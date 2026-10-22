import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasGatheringAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const gatheringId = parseInt(id, 10);
    if (isNaN(gatheringId)) {
      return NextResponse.json({ success: false, error: 'Invalid gathering ID' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const hasAccess = await hasGatheringAdminAccess(clerkUser, dbUser);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient ritual privileges' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    // Accepts either orderedAttendanceIds or topFiveAttendanceIds
    const orderedIds = body.orderedAttendanceIds || body.topFiveAttendanceIds || [];
    const addMemberId = body.addMemberId ? parseInt(body.addMemberId, 10) : null;
    const removeAttendanceId = body.removeAttendanceId ? parseInt(body.removeAttendanceId, 10) : null;

    const gathering = await Database.queryOne(`
      SELECT 
        g.*,
        fh.full_name as "firstHeraldName",
        fh.instagram as "firstHeraldInstagram"
      FROM gatherings g
      LEFT JOIN users fh ON fh.id = g.first_herald_user_id
      WHERE g.id = $1
    `, [gatheringId]);

    if (!gathering) {
      return NextResponse.json({ success: false, error: 'Gathering not found' }, { status: 404 });
    }

    // Execute corroboration update & leaf adjustments atomically
    await Database.transaction(async (client) => {
      // 1. Remove attendance if requested
      if (removeAttendanceId) {
        const toRemove = await client.query(
          'SELECT user_id, leaves_awarded FROM gathering_attendances WHERE id = $1 AND gathering_id = $2',
          [removeAttendanceId, gatheringId]
        );
        if (toRemove.rows.length > 0) {
          const prev = toRemove.rows[0];
          if (prev.user_id && prev.leaves_awarded > 0) {
            await client.query(`
              UPDATE users 
              SET spendable_leaves = GREATEST(0, spendable_leaves - $1),
                  lifetime_leaves = GREATEST(0, lifetime_leaves - $1)
              WHERE id = $2
            `, [prev.leaves_awarded, prev.user_id]);
          }
          await client.query('DELETE FROM gathering_attendances WHERE id = $1 AND gathering_id = $2', [removeAttendanceId, gatheringId]);
        }
      }

      // 2. Add registered member manually if requested
      if (addMemberId && !isNaN(addMemberId)) {
        const memberToAdd = await client.query('SELECT id, full_name, lk_id FROM users WHERE id = $1', [addMemberId]);
        if (memberToAdd.rows.length > 0) {
          const userToAdd = memberToAdd.rows[0];
          // Check not already checked in
          const existing = await client.query(
            'SELECT id FROM gathering_attendances WHERE gathering_id = $1 AND user_id = $2',
            [gatheringId, userToAdd.id]
          );
          if (existing.rows.length === 0) {
            const countRes = await client.query(
              'SELECT COALESCE(MAX(arrival_order), 0) + 1 as next_order FROM gathering_attendances WHERE gathering_id = $1',
              [gatheringId]
            );
            const nextOrder = parseInt(countRes.rows[0].next_order, 10);
            const isFirst = nextOrder === 1;
            const isVanguard = nextOrder <= 5;
            const newLeaves = isFirst ? 25 : (isVanguard ? 10 : 0);

            const inserted = await client.query(`
              INSERT INTO gathering_attendances (
                gathering_id, user_id, lk_id, attendee_name, arrival_order,
                is_corona_muralis, is_vanguard, status, leaves_awarded
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', $8)
              RETURNING id
            `, [
              gatheringId,
              userToAdd.id,
              userToAdd.lk_id,
              userToAdd.full_name,
              nextOrder,
              isFirst,
              isVanguard,
              newLeaves
            ]);

            if (newLeaves > 0) {
              await client.query(`
                UPDATE users 
                SET spendable_leaves = spendable_leaves + $1, lifetime_leaves = lifetime_leaves + $1 
                WHERE id = $2
              `, [newLeaves, userToAdd.id]);

              await client.query(`
                INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
                VALUES ($1, $2, 'attendance_punctuality_award', $3)
              `, [
                userToAdd.id,
                newLeaves,
                `Moderator inscripted attendance (#${nextOrder}) for ${gathering.title}`
              ]);
            }

            if (!orderedIds.includes(inserted.rows[0].id)) {
              orderedIds.push(inserted.rows[0].id);
            }
          }
        }
      }

      // 3. Re-order and adjust leaves according to confirmed order
      if (orderedIds.length > 0) {
        const currentRes = await client.query(`
          SELECT id, user_id, arrival_order, leaves_awarded, is_corona_muralis, is_vanguard
          FROM gathering_attendances
          WHERE gathering_id = $1
        `, [gatheringId]);
        const attMap = new Map(currentRes.rows.map(r => [r.id, r]));

        for (let i = 0; i < orderedIds.length; i++) {
          const attId = orderedIds[i];
          const prev = attMap.get(attId);
          if (!prev) continue;

          const newRank = i + 1;
          const isFirst = newRank === 1;
          const isVanguard = newRank <= 5;
          const newLeaves = isFirst ? 25 : (isVanguard ? 10 : 0);
          const prevLeaves = prev.leaves_awarded || 0;
          const leafDiff = newLeaves - prevLeaves;

          await client.query(`
            UPDATE gathering_attendances
            SET arrival_order = $1,
                is_corona_muralis = $2,
                is_vanguard = $3,
                leaves_awarded = $4
            WHERE id = $5 AND gathering_id = $6
          `, [newRank, isFirst, isVanguard, newLeaves, attId, gatheringId]);

          // Adjust user balance if userId is linked and leaves changed
          if (prev.user_id && leafDiff !== 0) {
            await client.query(`
              UPDATE users 
              SET spendable_leaves = GREATEST(0, spendable_leaves + $1),
                  lifetime_leaves = GREATEST(0, lifetime_leaves + $1)
              WHERE id = $2
            `, [leafDiff, prev.user_id]);

            await client.query(`
              INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
              VALUES ($1, $2, 'attendance_punctuality_award', $3)
            `, [
              prev.user_id,
              leafDiff,
              `Moderator corroboration adjustment (#${newRank}) for ${gathering.title}`
            ]);
          }
        }
      }
    });

    // Fetch the corroborated Vanguard & full roster
    const corroboratedVanguard = await Database.query(`
      SELECT 
        ga.arrival_order as "arrivalOrder",
        COALESCE(u.full_name, ga.attendee_name) as "name",
        COALESCE(u.instagram, u.full_name) as "handle",
        COALESCE(u.lk_id, ga.lk_id) as "lkId",
        ga.is_corona_muralis as "isCoronaMuralis",
        ga.leaves_awarded as "leavesAwarded"
      FROM gathering_attendances ga
      LEFT JOIN users u ON u.id = ga.user_id
      WHERE ga.gathering_id = $1 AND ga.is_vanguard = true
      ORDER BY ga.arrival_order ASC
      LIMIT 5
    `, [gatheringId]);

    const allAttendances = await Database.query(`
      SELECT 
        ga.id,
        ga.user_id as "userId",
        COALESCE(u.full_name, ga.attendee_name) as "name",
        COALESCE(u.lk_id, ga.lk_id) as "lkId",
        u.instagram,
        ga.arrival_order as "arrivalOrder",
        ga.is_corona_muralis as "isCoronaMuralis",
        ga.is_vanguard as "isVanguard",
        ga.is_co_vanguard as "isCoVanguard",
        ga.group_companions as "groupCompanions",
        ga.photo_proof_url as "photoProofUrl",
        ga.leaves_awarded as "leavesAwarded",
        ga.checkin_time as "checkinTime"
      FROM gathering_attendances ga
      LEFT JOIN users u ON u.id = ga.user_id
      WHERE ga.gathering_id = $1
      ORDER BY ga.arrival_order ASC
    `, [gatheringId]);

    const totalCountRes = await Database.queryOne(
      'SELECT COUNT(*)::int as count FROM gathering_attendances WHERE gathering_id = $1',
      [gatheringId]
    );
    const totalAttendees = totalCountRes ? totalCountRes.count : 0;

    // Generate formatted WhatsApp announcement
    const formatKinHandle = (kin) => {
      if (!kin) return 'The Kin';
      const raw = kin.handle || kin.instagram;
      const isDummy = !raw || ['non', 'none', 'n/a', 'na', 'nil', 'null', 'no', '-', '--'].includes(raw.trim().toLowerCase().replace('@', ''));
      if (!isDummy && raw) return `@${raw.replace(/^@/, '')}`;
      return kin.name || kin.attendeeName || 'The Kin';
    };

    const coronaWinner = corroboratedVanguard.find(v => v.isCoronaMuralis) || corroboratedVanguard[0];
    const vanguardList = corroboratedVanguard
      .map(v => `${v.arrivalOrder}. ${formatKinHandle(v)} ${v.isCoronaMuralis ? '👑 (+25 Leaves)' : '🛡️ (+10 Leaves)'}`)
      .join('\n');

    const heraldName = gathering.firstHeraldInstagram && !['non', 'none', 'n/a', 'nil'].includes(gathering.firstHeraldInstagram.trim().toLowerCase().replace('@', ''))
      ? `@${gathering.firstHeraldInstagram.replace(/^@/, '')}` 
      : (gathering.firstHeraldName || 'Claimed');

    const moderatorName = gathering.moderator_name || gathering.moderatorName || dbUser.full_name;

    const whatsappMessage = `🏛️ *PAPER THOUGHTS SANCTUARY — ROLL OF HONOR* 🏛️
*Gathering:* ${gathering.title}

*"The first man over the wall holds the standard for all who follow."*

👑 *CORONA MURALIS (First Over the Wall):*
✦ ${coronaWinner ? formatKinHandle(coronaWinner) : 'The Kin'} (+25 Leaves Awarded)

🛡️ *THE PUNCTUAL VANGUARD (Top Arrivals):*
${vanguardList || '1. Verified by Grand Custodians'}

📯 *THE FIRST HERALD (Fastest RSVP):*
✦ ${heraldName} (+15 Leaves Awarded)

⚖️ *GRAND CUSTODIANS (Hosts & Moderators):*
✦ ${moderatorName}

To the ${totalAttendees} kindred spirits who answered the summons tonight: we live in the lines.
The next gathering card drops this weekend on the Archive. Be ready.

👉 View the Archive Ledger: https://www.paperthoughts.org/events`;

    return NextResponse.json({
      success: true,
      message: 'Roster corroborated and re-ranked successfully. Leaves and broadcast updated.',
      whatsappMessage,
      corroboratedVanguard,
      attendances: allAttendances
    });

  } catch (error) {
    console.error('Error corroborating roster:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to corroborate roster' }, { status: 500 });
  }
}
