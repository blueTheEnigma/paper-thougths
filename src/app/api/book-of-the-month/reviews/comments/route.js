import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewIdStr = searchParams.get('reviewId');

    if (!reviewIdStr) {
      return NextResponse.json({ success: false, error: 'Missing reviewId parameter.' }, { status: 400 });
    }

    const reviewId = parseInt(reviewIdStr, 10);

    const comments = await Database.query(`
      SELECT c.id, c.comment_text as "commentText", c.created_at as "createdAt",
             u.full_name as "userName", ch.name as "chapterName"
      FROM book_of_the_month_comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN chapters ch ON ch.id = u.chapter_id
      WHERE c.review_id = $1
      ORDER BY c.created_at ASC
    `, [reviewId]);

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Failed to fetch book review replies:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch replies.' }, { status: 500 });
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
    const { reviewId, commentText } = body;

    const parsedReviewId = parseInt(reviewId, 10);

    if (!parsedReviewId || !commentText?.trim()) {
      return NextResponse.json({ success: false, error: 'Missing required reply fields.' }, { status: 400 });
    }

    // Insert comment/reply
    await Database.query(`
      INSERT INTO book_of_the_month_comments (review_id, user_id, comment_text)
      VALUES ($1, $2, $3)
    `, [parsedReviewId, dbUser.id, commentText.trim()]);

    // Note: Per user preference, comments/replies do NOT award leaves or milestone tokens.

    return NextResponse.json({ success: true, message: 'Reply posted successfully.' });
  } catch (error) {
    console.error('Failed to submit book review reply:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit reply.' }, { status: 500 });
  }
}
