import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import Database from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User synchronization failed' }, { status: 500 });
    }

    const res = await Database.query(`
      SELECT 
        bpp.id as "pledgeId",
        bpp.reading_status as "readingStatus",
        bpp.created_at as "pledgedAt",
        p.id as "pitchId",
        p.book_title as "bookTitle",
        p.book_author as "bookAuthor",
        p.hook_line as "hookLine",
        p.aftertaste,
        p.killer_quote as "killerQuote",
        p.cover_url as "coverUrl",
        p.vibe_tags as "vibeTags",
        u.full_name as "pitcherName",
        u.avatar_url as "pitcherAvatar"
      FROM book_pitch_pledges bpp
      JOIN book_pitches p ON p.id = bpp.pitch_id
      JOIN users u ON u.id = p.user_id
      WHERE bpp.user_id = $1
      ORDER BY bpp.created_at DESC
    `, [dbUser.id]);

    return NextResponse.json({
      success: true,
      tbrItems: res.rows
    });
  } catch (error) {
    console.error('Error fetching personal TBR list:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch TBR list' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User synchronization failed' }, { status: 500 });
    }

    const body = await request.json();
    const { pledgeId, pitchId, readingStatus } = body;

    const validStatuses = ['pledged', 'reading', 'completed'];
    if (!validStatuses.includes(readingStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid reading status' }, { status: 400 });
    }

    if (pledgeId) {
      await Database.query(`
        UPDATE book_pitch_pledges
        SET reading_status = $1
        WHERE id = $2 AND user_id = $3
      `, [readingStatus, pledgeId, dbUser.id]);
    } else if (pitchId) {
      await Database.query(`
        UPDATE book_pitch_pledges
        SET reading_status = $1
        WHERE pitch_id = $2 AND user_id = $3
      `, [readingStatus, pitchId, dbUser.id]);
    } else {
      return NextResponse.json({ success: false, error: 'pledgeId or pitchId required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Reading status updated to '${readingStatus}'`
    });
  } catch (error) {
    console.error('Error updating TBR status:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update TBR status' }, { status: 500 });
  }
}
