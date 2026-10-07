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

    const body = await request.json().catch(() => ({}));
    const requestedVote = body.voteType === 'confused' ? 'confused' : 'convinced';
    const targetStatus = requestedVote === 'confused' ? 'confused' : 'pledged';

    const result = await Database.transaction(async (client) => {
      // 1. Check if user already voted/pledged
      const existing = await client.query(`
        SELECT id, reading_status FROM book_pitch_pledges
        WHERE pitch_id = $1 AND user_id = $2
      `, [pitchId, dbUser.id]);

      let finalVote = null;

      if (existing.rows.length > 0) {
        const currentStatus = existing.rows[0].reading_status;
        const currentVote = currentStatus === 'confused' ? 'confused' : 'convinced';

        if (currentVote === requestedVote) {
          // Toggle off
          await client.query(`
            DELETE FROM book_pitch_pledges
            WHERE pitch_id = $1 AND user_id = $2
          `, [pitchId, dbUser.id]);
          finalVote = null;
        } else {
          // Switch vote
          await client.query(`
            UPDATE book_pitch_pledges
            SET reading_status = $3
            WHERE pitch_id = $1 AND user_id = $2
          `, [pitchId, dbUser.id, targetStatus]);
          finalVote = requestedVote;
        }
      } else {
        // Insert new vote
        await client.query(`
          INSERT INTO book_pitch_pledges (pitch_id, user_id, reading_status)
          VALUES ($1, $2, $3)
        `, [pitchId, dbUser.id, targetStatus]);
        finalVote = requestedVote;
      }

      // 2. Count tallies
      const countsRes = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE reading_status != 'confused')::int as "convincedCount",
          COUNT(*) FILTER (WHERE reading_status = 'confused')::int as "confusedCount"
        FROM book_pitch_pledges
        WHERE pitch_id = $1
      `, [pitchId]);

      const convincedCount = countsRes.rows[0]?.convincedCount || 0;
      const confusedCount = countsRes.rows[0]?.confusedCount || 0;

      return {
        userVote: finalVote,
        userPledged: finalVote === 'convinced',
        convincedCount,
        confusedCount,
        pledgeCount: convincedCount
      };
    });

    return NextResponse.json({
      success: true,
      userVote: result.userVote,
      userPledged: result.userPledged,
      convincedCount: result.convincedCount,
      confusedCount: result.confusedCount,
      pledgeCount: result.pledgeCount,
      message: result.userVote === 'convinced'
        ? "Convinced! Added to your Personal TBR Shelf 🍃"
        : result.userVote === 'confused'
          ? "Challenged the author to pitch harder 🤔"
          : "Vote removed"
    });
  } catch (error) {
    console.error('Error toggling pitch pledge:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to toggle pledge' }, { status: 500 });
  }
}
