import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export async function POST(request, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Please sign in to like this piece.' }, { status: 401 });
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

    // Check if submission exists
    const sub = await Database.queryOne(`
      SELECT id FROM submissions WHERE id = $1
    `, [submissionId]);

    if (!sub) {
      return NextResponse.json({ success: false, error: 'Manuscript not found.' }, { status: 404 });
    }

    // Check existing like
    const existing = await Database.queryOne(`
      SELECT id FROM submission_likes WHERE submission_id = $1 AND user_id = $2
    `, [submissionId, dbUser.id]);

    let userLiked = false;
    if (existing) {
      // Remove like
      await Database.query(`
        DELETE FROM submission_likes WHERE id = $1
      `, [existing.id]);
      userLiked = false;
    } else {
      // Insert like
      await Database.query(`
        INSERT INTO submission_likes (submission_id, user_id)
        VALUES ($1, $2)
      `, [submissionId, dbUser.id]);
      userLiked = true;
    }

    // Get updated count
    const countRes = await Database.queryOne(`
      SELECT COUNT(*) as count FROM submission_likes WHERE submission_id = $1
    `, [submissionId]);
    const likeCount = parseInt(countRes?.count || 0, 10);

    return NextResponse.json({
      success: true,
      userLiked,
      likeCount
    });
  } catch (error) {
    console.error('Like toggle failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update reaction.' }, { status: 500 });
  }
}
