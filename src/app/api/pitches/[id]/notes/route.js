import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import Database from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const pitchId = parseInt(resolvedParams.id, 10);
    if (isNaN(pitchId)) {
      return NextResponse.json({ success: false, error: 'Invalid pitch ID' }, { status: 400 });
    }

    const res = await Database.query(`
      SELECT 
        n.id,
        n.content,
        n.pen_name as "penName",
        n.created_at as "createdAt",
        COALESCE(n.pen_name, u.full_name, 'Literary Reader') as "displayName",
        u.avatar_url as "authorAvatar",
        u.reader_archetype as "authorArchetype"
      FROM book_pitch_notes n
      LEFT JOIN users u ON u.id = n.user_id
      WHERE n.pitch_id = $1
      ORDER BY n.created_at ASC
    `, [pitchId]);

    return NextResponse.json({
      success: true,
      notes: res.rows
    });
  } catch (error) {
    console.error('Error fetching pitch notes:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User synchronization failed' }, { status: 500 });
    }

    const resolvedParams = await params;
    const pitchId = parseInt(resolvedParams.id, 10);
    if (isNaN(pitchId)) {
      return NextResponse.json({ success: false, error: 'Invalid pitch ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content, penName } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Note content cannot be empty' }, { status: 400 });
    }

    const cleanPenName = penName && penName.trim() ? penName.trim() : null;

    const res = await Database.query(`
      INSERT INTO book_pitch_notes (pitch_id, user_id, pen_name, content)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        content, 
        pen_name as "penName", 
        created_at as "createdAt"
    `, [pitchId, dbUser.id, cleanPenName, content.trim()]);

    const newNote = {
      ...res.rows[0],
      displayName: cleanPenName || dbUser.full_name || 'Literary Reader',
      authorAvatar: dbUser.avatar_url || null,
      authorArchetype: dbUser.reader_archetype || null
    };

    // Total comment count
    const countRes = await Database.query(`
      SELECT COUNT(*)::int as count
      FROM book_pitch_notes
      WHERE pitch_id = $1
    `, [pitchId]);

    return NextResponse.json({
      success: true,
      note: newNote,
      commentCount: countRes.rows[0].count
    });
  } catch (error) {
    console.error('Error posting pitch note:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to post note' }, { status: 500 });
  }
}
