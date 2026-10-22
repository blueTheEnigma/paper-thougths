import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, getUserPermissions, hasGatheringAdminAccess } from '@/lib/permissions';

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
    // Array of attendance IDs in intended rank order [rank1Id, rank2Id, rank3Id, rank4Id, rank5Id]
    const { topFiveAttendanceIds = [] } = body;

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

    // Execute corroboration update
    await Database.transaction(async (client) => {
      // 1. Reset vanguard flags on this gathering
      await client.query(`
        UPDATE gathering_attendances 
        SET is_corona_muralis = false, is_vanguard = false
        WHERE gathering_id = $1
      `, [gatheringId]);

      // 2. Apply explicit confirmed order
      for (let i = 0; i < topFiveAttendanceIds.length; i++) {
        const attId = topFiveAttendanceIds[i];
        const isFirst = i === 0;
        const newLeaves = isFirst ? 25 : 10;

        await client.query(`
          UPDATE gathering_attendances 
          SET 
            arrival_order = $1,
            is_corona_muralis = $2,
            is_vanguard = true,
            leaves_awarded = $3
          WHERE id = $4 AND gathering_id = $5
        `, [i + 1, isFirst, newLeaves, attId, gatheringId]);
      }
    });

    // Fetch the corroborated Top 5 for WhatsApp message generation
    const corroboratedVanguard = await Database.query(`
      SELECT 
        ga.arrival_order as "arrivalOrder",
        COALESCE(u.full_name, ga.attendee_name) as "name",
        COALESCE(u.instagram, u.full_name) as "handle",
        ga.is_corona_muralis as "isCoronaMuralis",
        ga.leaves_awarded as "leavesAwarded"
      FROM gathering_attendances ga
      LEFT JOIN users u ON u.id = ga.user_id
      WHERE ga.gathering_id = $1 AND ga.is_vanguard = true
      ORDER BY ga.arrival_order ASC
      LIMIT 5
    `, [gatheringId]);

    const totalCountRes = await Database.queryOne(
      'SELECT COUNT(*)::int as count FROM gathering_attendances WHERE gathering_id = $1',
      [gatheringId]
    );
    const totalAttendees = totalCountRes ? totalCountRes.count : 0;

    // Generate formatted WhatsApp announcement
    const coronaWinner = corroboratedVanguard.find(v => v.isCoronaMuralis) || corroboratedVanguard[0];
    const vanguardList = corroboratedVanguard
      .map(v => `${v.arrivalOrder}. ${v.handle ? `@${v.handle.replace('@', '')}` : v.name} ${v.isCoronaMuralis ? '👑 (+25 Leaves)' : '🛡️ (+10 Leaves)'}`)
      .join('\n');

    const heraldName = gathering.firstHeraldInstagram 
      ? `@${gathering.firstHeraldInstagram.replace('@', '')}` 
      : (gathering.firstHeraldName || 'Claimed');

    const whatsappMessage = `🏛️ *PAPER THOUGHTS SANCTUARY — ROLL OF HONOR* 🏛️
*Gathering:* ${gathering.title}

*"The first man over the wall holds the standard for all who follow."*

👑 *CORONA MURALIS (First Over the Wall):*
✦ ${coronaWinner ? (coronaWinner.handle ? `@${coronaWinner.handle.replace('@', '')}` : coronaWinner.name) : 'The Kin'} (+25 Leaves Awarded)

🛡️ *THE PUNCTUAL VANGUARD (Top Arrivals):*
${vanguardList || '1. Verified by Grand Custodians'}

📯 *THE FIRST HERALD (Fastest RSVP):*
✦ ${heraldName} (+15 Leaves Awarded)

⚖️ *GRAND CUSTODIANS (Hosts & Moderators):*
✦ @${dbUser.instagram ? dbUser.instagram.replace('@', '') : dbUser.full_name}

To the ${totalAttendees} kindred spirits who answered the summons tonight: we live in the lines.
The next gathering card drops this weekend on the Archive. Be ready.

👉 View the Archive Ledger: https://www.paperthoughts.org/events`;

    return NextResponse.json({
      success: true,
      message: 'Roster corroborated successfully. Celebration broadcast generated.',
      whatsappMessage,
      corroboratedVanguard
    });

  } catch (error) {
    console.error('Error corroborating roster:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to corroborate roster' }, { status: 500 });
  }
}
