import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import Database from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    const result = await Database.transaction(async (client) => {
      // 1. Check if user already pledged
      const existing = await client.query(`
        SELECT id FROM book_pitch_pledges
        WHERE pitch_id = $1 AND user_id = $2
      `, [pitchId, dbUser.id]);

      let userPledged = false;

      if (existing.rows.length > 0) {
        // Remove pledge
        await client.query(`
          DELETE FROM book_pitch_pledges
          WHERE pitch_id = $1 AND user_id = $2
        `, [pitchId, dbUser.id]);
        userPledged = false;
      } else {
        // Insert new pledge
        await client.query(`
          INSERT INTO book_pitch_pledges (pitch_id, user_id, reading_status)
          VALUES ($1, $2, 'pledged')
        `, [pitchId, dbUser.id]);
        userPledged = true;

        // Reward +2 Leaves to the pitcher as conviction appreciation
        await client.query(`
          UPDATE users
          SET spendable_leaves = spendable_leaves + 2,
              lifetime_leaves = lifetime_leaves + 2
          WHERE id = (SELECT user_id FROM book_pitches WHERE id = $1)
        `, [pitchId]);
      }

      // 2. Count total pledges
      const countRes = await client.query(`
        SELECT COUNT(*)::int as count
        FROM book_pitch_pledges
        WHERE pitch_id = $1
      `, [pitchId]);

      return {
        userPledged,
        pledgeCount: countRes.rows[0].count
      };
    });

    return NextResponse.json({
      success: true,
      userPledged: result.userPledged,
      pledgeCount: result.pledgeCount,
      message: result.userPledged 
        ? "Convinced! Added to your Personal TBR Shelf 🍃" 
        : "Pledge removed from TBR Shelf"
    });
  } catch (error) {
    console.error('Error toggling pitch pledge:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to toggle pledge' }, { status: 500 });
  }
}
