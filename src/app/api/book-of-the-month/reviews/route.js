import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

// Word counter helper
function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookIdStr = searchParams.get('bookId');

    if (!bookIdStr) {
      return NextResponse.json({ success: false, error: 'Missing bookId parameter.' }, { status: 400 });
    }

    const bookId = parseInt(bookIdStr, 10);

    const reviews = await Database.query(`
      SELECT r.id, r.rating, r.review_text as "reviewText", r.is_finished as "isFinished",
             r.is_bookie as "isBookie", r.created_at as "createdAt",
             u.full_name as "reviewerName", c.name as "chapterName",
             u.lifetime_leaves as "lifetimeLeaves"
      FROM book_of_the_month_reviews r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE r.book_of_the_month_id = $1
      ORDER BY r.is_bookie DESC, r.created_at DESC
    `, [bookId]);

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Failed to fetch book reviews:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const body = await request.json();
    const { bookId, rating, reviewText, isFinished } = body;

    const parsedBookId = parseInt(bookId, 10);
    const parsedRating = parseInt(rating, 10);

    if (!parsedBookId || !parsedRating || !reviewText) {
      return NextResponse.json({ success: false, error: 'Missing required review fields.' }, { status: 400 });
    }

    if (parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const wordCount = countWords(reviewText);
    if (wordCount < 30) {
      return NextResponse.json({
        success: false,
        error: `Review rejected: Your review must contain at least 30 words. (Currently: ${wordCount} words)`
      }, { status: 400 });
    }

    // 1. Fetch book of the month details to verify stream chapter
    const book = await Database.queryOne(`
      SELECT id, title, chapter_id as "chapterId", active
      FROM book_of_the_month
      WHERE id = $1
    `, [parsedBookId]);

    if (!book) {
      return NextResponse.json({ success: false, error: 'Book of the Month not found.' }, { status: 404 });
    }

    // Abuja Book of the Month stream restriction check (chapter_id = 3 is Abuja)
    if (book.chapterId === 3) {
      // Fetch user's chapter to verify it is Abuja
      const userChapter = await Database.queryOne(`
        SELECT chapter_id FROM users WHERE id = $1
      `, [dbUser.id]);
      
      if (userChapter?.chapter_id !== 3) {
        return NextResponse.json({
          success: false,
          error: 'Review rejected: The Abuja Book of the Month stream is strictly reserved for members of the Abuja chapter.'
        }, { status: 403 });
      }
    }

    // 2. Check if user has already reviewed this book
    const existingReview = await Database.queryOne(`
      SELECT id FROM book_of_the_month_reviews
      WHERE book_of_the_month_id = $1 AND user_id = $2
    `, [parsedBookId, dbUser.id]);

    if (existingReview) {
      return NextResponse.json({ success: false, error: 'You have already reviewed this Book of the Month.' }, { status: 400 });
    }

    // 3. Insert review and process rewards in transaction
    const result = await Database.transaction(async (client) => {
      // Check if there is already a finished review for this book (to determine Bookie eligibility)
      let isFirstBookie = false;
      if (isFinished === true) {
        const hasBookie = await client.query(`
          SELECT 1 FROM book_of_the_month_reviews
          WHERE book_of_the_month_id = $1 AND is_finished = TRUE AND is_bookie = TRUE
          LIMIT 1
        `, [parsedBookId]);
        
        if (hasBookie.rows.length === 0) {
          isFirstBookie = true;
        }
      }

      // Insert review
      const reviewRes = await client.query(`
        INSERT INTO book_of_the_month_reviews (book_of_the_month_id, user_id, rating, review_text, is_finished, is_bookie)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, rating, review_text as "reviewText", is_finished as "isFinished", is_bookie as "isBookie", created_at as "createdAt"
      `, [parsedBookId, dbUser.id, parsedRating, reviewText, !!isFinished, isFirstBookie]);
      
      const newReview = reviewRes.rows[0];

      // Standard rewards: 10 leaves and 1 milestone token
      let totalLeavesAwarded = 10;
      let totalTokensAwarded = 1.0;

      // Add Bookie bonus (+50 leaves) if eligible
      if (isFirstBookie) {
        totalLeavesAwarded += 50;
      }

      // Update user stats
      await client.query(`
        UPDATE users
        SET spendable_leaves = spendable_leaves + $1,
            lifetime_leaves = lifetime_leaves + $1,
            milestone_tokens = milestone_tokens + $2
        WHERE id = $3
      `, [totalLeavesAwarded, totalTokensAwarded, dbUser.id]);

      // Log transactions
      await client.query(`
        INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
        VALUES ($1, $2, 'review', $3)
      `, [dbUser.id, 10, `Earned 10 leaves for review of Book of the Month: "${book.title}"`]);

      if (isFirstBookie) {
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, $2, 'review', $3)
        `, [dbUser.id, 50, `Crowned Bookie of the Month! Bonus 50 leaves for: "${book.title}"`]);
      }

      return {
        review: newReview,
        isBookie: isFirstBookie,
        leavesEarned: totalLeavesAwarded,
        tokensEarned: totalTokensAwarded
      };
    });

    return NextResponse.json({
      success: true,
      message: result.isBookie
        ? `Review submitted successfully! 🎉 You are the Bookie of the Month for "${book.title}"! Rewarded ${result.leavesEarned} leaves (including +50 bonus) and ${result.tokensEarned} Milestone Token.`
        : `Review submitted successfully! Rewarded ${result.leavesEarned} leaves and ${result.tokensEarned} Milestone Token.`,
      review: result.review,
      isBookie: result.isBookie,
      leavesEarned: result.leavesEarned,
      tokensEarned: result.tokensEarned
    });

  } catch (error) {
    console.error('Review submission failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review.' }, { status: 500 });
  }
}
