import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const gatheringId = parseInt(id, 10);
    if (isNaN(gatheringId)) {
      return NextResponse.json({ success: false, error: 'Invalid gathering ID' }, { status: 400 });
    }

    let clerkUser = null;
    let dbUser = null;
    try {
      clerkUser = await currentUser();
      if (clerkUser) {
        dbUser = await syncOrCreateUser(clerkUser);
      }
    } catch {
      // Guest fallback
    }

    const body = await request.json().catch(() => ({}));
    const guestName = body.name?.trim() || null;
    const guestEmail = body.email?.trim()?.toLowerCase() || null;
    const guestWhatsapp = body.whatsapp?.trim() || null;
    const guestLkId = body.lkId?.trim()?.toUpperCase() || null;

    // If not logged in, try resolving user by lkId or email
    if (!dbUser && (guestLkId || guestEmail)) {
      if (guestLkId) {
        dbUser = await Database.queryOne('SELECT * FROM users WHERE UPPER(lk_id) = $1', [guestLkId]);
      } else if (guestEmail) {
        dbUser = await Database.queryOne('SELECT * FROM users WHERE LOWER(email) = $1', [guestEmail]);
      }
    }

    // Verify gathering exists
    const gathering = await Database.queryOne('SELECT * FROM gatherings WHERE id = $1', [gatheringId]);
    if (!gathering) {
      return NextResponse.json({ success: false, error: 'Gathering not found' }, { status: 404 });
    }

    // Check if user already RSVPed
    if (dbUser) {
      const existing = await Database.queryOne(
        'SELECT * FROM gathering_rsvps WHERE gathering_id = $1 AND user_id = $2',
        [gatheringId, dbUser.id]
      );
      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'You have already pledged attendance for this gathering.',
          isFirstHerald: existing.is_first_herald,
          alreadyPledged: true
        });
      }
    }

    // Execute atomic RSVP and First Herald claim
    const result = await Database.transaction(async (client) => {
      // Lock gathering row for update to prevent concurrent First Herald race conditions
      const lockRes = await client.query(
        'SELECT id, title, first_herald_user_id FROM gatherings WHERE id = $1 FOR UPDATE',
        [gatheringId]
      );
      const lockedGathering = lockRes.rows[0];

      let isFirstHerald = false;
      let leavesAwarded = 0;

      if (!lockedGathering.first_herald_user_id && dbUser) {
        // Current user is the first herald!
        isFirstHerald = true;
        leavesAwarded = 15;

        await client.query(`
          UPDATE gatherings 
          SET first_herald_user_id = $1, first_herald_claimed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [dbUser.id, gatheringId]);

        // Bestow 15 Leaves
        await client.query(`
          UPDATE users 
          SET spendable_leaves = spendable_leaves + 15, lifetime_leaves = lifetime_leaves + 15
          WHERE id = $1
        `, [dbUser.id]);

        // Record in ledger
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, 15, 'first_herald_award', $2)
        `, [dbUser.id, `📯 The First Herald: Fastest RSVP for ${lockedGathering.title}`]);
      }

      // Insert RSVP record
      const rsvpRes = await client.query(`
        INSERT INTO gathering_rsvps (
          gathering_id, user_id, guest_name, guest_email, guest_whatsapp, is_first_herald
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        gatheringId,
        dbUser ? dbUser.id : null,
        dbUser ? dbUser.full_name : guestName,
        dbUser ? dbUser.email : guestEmail,
        dbUser ? dbUser.whatsapp : guestWhatsapp,
        isFirstHerald
      ]);

      return {
        rsvp: rsvpRes.rows[0],
        isFirstHerald,
        leavesAwarded
      };
    });

    return NextResponse.json({
      success: true,
      message: result.isFirstHerald 
        ? '✦ Laurel Claimed! You are The First Herald for this gathering! (+15 Leaves Awarded)' 
        : 'Attendance pledged. Your seat at the table is reserved.',
      isFirstHerald: result.isFirstHerald,
      leavesAwarded: result.leavesAwarded
    });

  } catch (error) {
    console.error('Error recording RSVP:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to record RSVP' }, { status: 500 });
  }
}
