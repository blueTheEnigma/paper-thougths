import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

function getNextMonthYear() {
  const now = new Date();
  let nextMonth = now.getMonth() + 1;
  let nextYear = now.getFullYear();
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[nextMonth]} ${nextYear}`;
}

function getVotingMonthYear() {
  const now = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

// GET: Fetch suggestions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterIdParam = searchParams.get('chapterId');
    const chapterId = chapterIdParam && chapterIdParam !== 'null' ? parseInt(chapterIdParam, 10) : null;

    const now = new Date();
    const day = now.getDate();
    // If first 3 days of the month, fetch suggestions for the current month (voting time).
    // Otherwise, fetch suggestions for the next month (suggestion time).
    const targetMonthYear = day <= 3 ? getVotingMonthYear() : getNextMonthYear();

    const suggestions = await Database.query(`
      SELECT s.id, s.title, s.author, s.teaser, s.month_year as "monthYear",
             u.full_name as "suggestedBy", s.created_at as "createdAt"
      FROM botm_suggestions s
      JOIN users u ON u.id = s.user_id
      WHERE s.month_year = $1
        AND s.chapter_id IS NOT DISTINCT FROM $2
      ORDER BY s.created_at DESC
    `, [targetMonthYear, chapterId]);

    return NextResponse.json({ success: true, suggestions, targetMonthYear });
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}

// POST: Submit a suggestion
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
    const { bookId, title, author, teaser } = body;

    const parsedBookId = parseInt(bookId, 10);
    if (!parsedBookId || !title || !author || !teaser) {
      return NextResponse.json({ success: false, error: 'Missing required suggestion fields.' }, { status: 400 });
    }

    // 1. Fetch current BOTM info
    const botm = await Database.queryOne(`
      SELECT id, chapter_id as "chapterId"
      FROM book_of_the_month
      WHERE id = $1
    `, [parsedBookId]);

    if (!botm) {
      return NextResponse.json({ success: false, error: 'Book of the Month not found.' }, { status: 404 });
    }

    // 2. Check if user reviewed this BOTM
    const review = await Database.queryOne(`
      SELECT id FROM book_of_the_month_reviews
      WHERE user_id = $1 AND book_of_the_month_id = $2
    `, [dbUser.id, parsedBookId]);

    if (!review) {
      return NextResponse.json({ success: false, error: 'You must review this Book of the Month before submitting a suggestion.' }, { status: 403 });
    }

    // 3. Check if user already submitted a suggestion for this BOTM
    const existingSuggestion = await Database.queryOne(`
      SELECT id FROM botm_suggestions
      WHERE user_id = $1 AND book_of_the_month_id = $2
    `, [dbUser.id, parsedBookId]);

    if (existingSuggestion) {
      return NextResponse.json({ success: false, error: 'You have already suggested a book for this Book of the Month cycle.' }, { status: 400 });
    }

    // Suggestions are always for the next month's cycle
    const targetMonthYear = getNextMonthYear();

    const result = await Database.queryOne(`
      INSERT INTO botm_suggestions (user_id, book_of_the_month_id, title, author, teaser, chapter_id, month_year)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, author, teaser, month_year as "monthYear"
    `, [dbUser.id, parsedBookId, title.trim(), author.trim(), teaser.trim(), botm.chapterId, targetMonthYear]);

    return NextResponse.json({
      success: true,
      message: `Suggestion "${result.title}" submitted successfully for the ${targetMonthYear} cycle!`,
      suggestion: result
    });

  } catch (error) {
    console.error('Failed to submit suggestion:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit suggestion.' }, { status: 500 });
  }
}
