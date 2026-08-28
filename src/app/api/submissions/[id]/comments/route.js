import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

// GET: Fetch all comments for a manuscript
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID' }, { status: 400 });
    }

    const comments = await Database.query(`
      SELECT 
        c.id,
        c.content,
        c.pen_name as "penName",
        c.created_at as "createdAt",
        c.user_id as "userId",
        u.full_name as "userFullName",
        u.avatar_url as "userAvatarUrl",
        u.reader_archetype as "userArchetype",
        COALESCE(c.pen_name, u.full_name, 'Clubhouse Reader') as "displayName"
      FROM submission_comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.submission_id = $1
      ORDER BY c.created_at ASC
    `, [submissionId]);

    return NextResponse.json({
      success: true,
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        displayName: c.displayName,
        userAvatarUrl: c.userAvatarUrl,
        userArchetype: c.userArchetype,
        createdAt: c.createdAt,
        isAuthor: false // Can be enriched by frontend
      }))
    });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ success: false, error: 'Failed to load comments.' }, { status: 500 });
  }
}

// POST: Add a new reader comment
export async function POST(request, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Please sign in to leave a note.' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content, penName } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Comment cannot be empty.' }, { status: 400 });
    }

    const cleanPenName = penName && typeof penName === 'string' && penName.trim() ? penName.trim() : null;

    const res = await Database.queryOne(`
      INSERT INTO submission_comments (submission_id, user_id, pen_name, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, pen_name as "penName", created_at as "createdAt"
    `, [submissionId, dbUser.id, cleanPenName, content.trim()]);

    const countRes = await Database.queryOne(`
      SELECT COUNT(*) as count FROM submission_comments WHERE submission_id = $1
    `, [submissionId]);
    const commentCount = parseInt(countRes?.count || 0, 10);

    return NextResponse.json({
      success: true,
      comment: {
        id: res.id,
        content: res.content,
        displayName: res.penName || dbUser.full_name || 'Clubhouse Reader',
        userAvatarUrl: dbUser.avatar_url,
        userArchetype: dbUser.reader_archetype,
        createdAt: res.createdAt
      },
      commentCount
    });
  } catch (error) {
    console.error('Failed to post comment:', error);
    return NextResponse.json({ success: false, error: 'Failed to post note.' }, { status: 500 });
  }
}
