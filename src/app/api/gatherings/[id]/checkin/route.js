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
      // In-app webview without Clerk session
    }

    const body = await request.json().catch(() => ({}));
    const magicToken = body.magicToken?.trim();
    const gateCode = body.gateCode?.trim();
    const rawInput = (body.lkId || body.name || body.email || '').trim();
    const selectedUserId = body.userId ? parseInt(body.userId, 10) : null;
    const inputLkId = body.lkId?.trim() || null;
    const inputEmail = body.email?.trim()?.toLowerCase() || null;
    const guestName = body.name?.trim() || null;
    const isGroupArrival = Boolean(body.isGroupArrival);
    const groupCompanions = Array.isArray(body.groupCompanions) ? body.groupCompanions.filter(Boolean) : [];
    const photoProof = body.photoProof || null; // Base64 WhatsApp screenshot

    // ✦ Seamless Name & LK-ID Alignment ✦
    // If not authenticated via Clerk session, resolve against registered users:
    if (!dbUser) {
      // 1. Explicit userId selected from autocomplete
      if (selectedUserId && !isNaN(selectedUserId)) {
        dbUser = await Database.queryOne('SELECT * FROM users WHERE id = $1', [selectedUserId]);
      }

      // 2. Exact LK-ID match
      if (!dbUser && rawInput) {
        dbUser = await Database.queryOne('SELECT * FROM users WHERE UPPER(lk_id) = UPPER($1)', [rawInput]);
      }

      // 3. Email match (either from email field or typed in input)
      if (!dbUser && (inputEmail || rawInput.includes('@'))) {
        const searchEmail = (inputEmail || rawInput).toLowerCase();
        dbUser = await Database.queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [searchEmail]);
      }

      // 4. Exact Full Name match (case-insensitive & trimmed)
      const nameCandidate = guestName || rawInput;
      if (!dbUser && nameCandidate) {
        dbUser = await Database.queryOne(
          'SELECT * FROM users WHERE LOWER(TRIM(full_name)) = LOWER(TRIM($1))',
          [nameCandidate]
        );
      }

      // 5. Case-insensitive Substring / Fuzzy match for Name (if >= 3 characters)
      if (!dbUser && nameCandidate && nameCandidate.length >= 3) {
        dbUser = await Database.queryOne(`
          SELECT * FROM users 
          WHERE full_name ILIKE $1 
          ORDER BY LENGTH(full_name) ASC 
          LIMIT 1
        `, [`%${nameCandidate}%`]);
      }
    }

    // Verify gathering exists
    const gathering = await Database.queryOne('SELECT * FROM gatherings WHERE id = $1', [gatheringId]);
    if (!gathering) {
      return NextResponse.json({ success: false, error: 'Gathering not found' }, { status: 404 });
    }

    if (gathering.status === 'concluded') {
      return NextResponse.json({ success: false, error: 'This gathering has already concluded.' }, { status: 400 });
    }

    // Gate code verification: Only strictly required for physical in-person venue arrivals
    const isPhysical = gathering.gathering_type === 'physical';
    if (isPhysical && gateCode && gathering.gate_code) {
      if (gateCode !== gathering.gate_code) {
        return NextResponse.json({ success: false, error: 'Incorrect 4-digit venue gate code.' }, { status: 400 });
      }
    }

    const userId = dbUser ? dbUser.id : null;
    const attendeeName = dbUser ? dbUser.full_name : (guestName || rawInput || 'Kindred Spirit');
    const attendeeLkId = dbUser ? dbUser.lk_id : (rawInput.toUpperCase().startsWith('LK-') ? rawInput.toUpperCase() : null);

    // Check duplicate check-in
    if (userId) {
      const existing = await Database.queryOne(
        'SELECT * FROM gathering_attendances WHERE gathering_id = $1 AND user_id = $2',
        [gatheringId, userId]
      );
      if (existing) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          message: `Your presence has already been inscribed into the lines, ${attendeeName}.`,
          arrivalOrder: existing.arrival_order,
          isCoronaMuralis: existing.is_corona_muralis,
          isVanguard: existing.is_vanguard,
          leavesAwarded: existing.leaves_awarded,
          attendeeName,
          attendeeLkId,
          alignedUser: {
            name: attendeeName,
            lkId: attendeeLkId
          }
        });
      }
    } else if (attendeeName && attendeeName !== 'Kindred Spirit') {
      const existing = await Database.queryOne(
        'SELECT * FROM gathering_attendances WHERE gathering_id = $1 AND LOWER(TRIM(attendee_name)) = LOWER(TRIM($2))',
        [gatheringId, attendeeName]
      );
      if (existing) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          message: `Attendance for "${attendeeName}" is already inscribed for this gathering.`,
          arrivalOrder: existing.arrival_order,
          isCoronaMuralis: existing.is_corona_muralis,
          isVanguard: existing.is_vanguard,
          leavesAwarded: existing.leaves_awarded,
          attendeeName,
          attendeeLkId: null,
          alignedUser: null
        });
      }
    }

    // Execute atomic check-in and merit evaluation
    const result = await Database.transaction(async (client) => {
      // Lock gatherings row for monotonic arrival sequence
      await client.query('SELECT id FROM gatherings WHERE id = $1 FOR UPDATE', [gatheringId]);

      // Calculate arrival sequence order
      const countRes = await client.query(
        'SELECT COALESCE(MAX(arrival_order), 0) + 1 as next_order FROM gathering_attendances WHERE gathering_id = $1',
        [gatheringId]
      );
      const arrivalOrder = parseInt(countRes.rows[0].next_order, 10);

      const isPhysical = gathering.gathering_type === 'physical';

      // For physical #1 arrival: require WhatsApp screenshot photo proof
      if (isPhysical && arrivalOrder === 1 && !photoProof) {
        throw new Error('As the first arrival at the physical venue, please upload your WhatsApp group announcement screenshot to claim the wall.');
      }

      let isCoronaMuralis = false;
      let isVanguard = false;
      let isCoVanguard = false;
      let leavesAwarded = 0;
      let honorTitle = 'Attendee';

      if (arrivalOrder === 1) {
        isCoronaMuralis = true;
        isVanguard = true;
        leavesAwarded = 25;
        honorTitle = '👑 Corona Muralis (First Over the Wall)';
      } else if (isGroupArrival && photoProof) {
        isCoVanguard = true;
        isVanguard = true;
        leavesAwarded = 20;
        honorTitle = '🤝 Shield-Brother / Co-Vanguard';
      } else if (arrivalOrder <= 5) {
        isVanguard = true;
        leavesAwarded = 10;
        honorTitle = `🛡️ Punctual Vanguard (Arrival #${arrivalOrder})`;
      } else {
        // Standard attendance: 5 Leaves + 0.5 Milestone Tokens for presence
        leavesAwarded = 5;
        honorTitle = 'Kindred Attendee';
      }

      // Credit tokens and leaves to user account if applicable
      if (userId) {
        await client.query(`
          UPDATE users 
          SET milestone_tokens = milestone_tokens + 0.5,
              spendable_leaves = spendable_leaves + $1,
              lifetime_leaves = lifetime_leaves + $1
          WHERE id = $2
        `, [leavesAwarded, userId]);

        if (leavesAwarded > 0) {
          await client.query(`
            INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
            VALUES ($1, $2, 'attendance_punctuality_award', $3)
          `, [
            userId,
            leavesAwarded,
            `${honorTitle} (+0.5 Tokens) for ${gathering.title}`
          ]);
        }
      }

      // Record attendance
      const attendanceRes = await client.query(`
        INSERT INTO gathering_attendances (
          gathering_id, user_id, lk_id, attendee_name, arrival_order,
          is_corona_muralis, is_vanguard, is_co_vanguard, group_companions,
          photo_proof_url, status, leaves_awarded
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'verified', $11)
        RETURNING *
      `, [
        gatheringId,
        userId,
        attendeeLkId,
        attendeeName,
        arrivalOrder,
        isCoronaMuralis,
        isVanguard,
        isCoVanguard,
        groupCompanions,
        photoProof,
        leavesAwarded
      ]);

      // If gathering was published, shift to 'live' upon first arrival
      if (gathering.status === 'published' && arrivalOrder === 1) {
        await client.query("UPDATE gatherings SET status = 'live' WHERE id = $1", [gatheringId]);
      }

      return {
        attendance: attendanceRes.rows[0],
        arrivalOrder,
        isCoronaMuralis,
        isVanguard,
        isCoVanguard,
        leavesAwarded,
        honorTitle
      };
    });

    // Fetch the updated Top 5 Vanguard roster to display immediately on screen
    const topVanguard = await Database.query(`
      SELECT 
        ga.arrival_order as "arrivalOrder",
        COALESCE(u.full_name, ga.attendee_name) as "name",
        COALESCE(u.lk_id, ga.lk_id) as "lkId",
        ga.is_corona_muralis as "isCoronaMuralis",
        ga.is_vanguard as "isVanguard",
        ga.is_co_vanguard as "isCoVanguard",
        ga.leaves_awarded as "leavesAwarded"
      FROM gathering_attendances ga
      LEFT JOIN users u ON u.id = ga.user_id
      WHERE ga.gathering_id = $1
      ORDER BY ga.arrival_order ASC
      LIMIT 5
    `, [gatheringId]);

    return NextResponse.json({
      success: true,
      message: result.leavesAwarded > 0 
        ? `✦ Laurels Bestowed! ${result.honorTitle} (+${result.leavesAwarded} Leaves Awarded)` 
        : `Welcome ${attendeeName}! Your presence has been recorded.`,
      arrivalOrder: result.arrivalOrder,
      isCoronaMuralis: result.isCoronaMuralis,
      isVanguard: result.isVanguard,
      leavesAwarded: result.leavesAwarded,
      honorTitle: result.honorTitle,
      attendeeName,
      attendeeLkId,
      alignedUser: dbUser ? {
        id: dbUser.id,
        name: dbUser.full_name,
        lkId: dbUser.lk_id
      } : null,
      topVanguard,
      gateCode: gathering.gate_code,
      magicToken: gathering.magic_token
    });

  } catch (error) {
    console.error('Error recording check-in:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to record check-in' }, { status: 400 });
  }
}
