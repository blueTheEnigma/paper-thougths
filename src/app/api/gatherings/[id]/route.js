import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, getUserPermissions, hasGatheringAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const gatheringId = parseInt(id, 10);
    if (isNaN(gatheringId)) {
      return NextResponse.json({ success: false, error: 'Invalid gathering ID' }, { status: 400 });
    }

    const query = `
      SELECT 
        g.id,
        g.title,
        g.gathering_type as "gatheringType",
        g.chapter_id as "chapterId",
        c.name as "chapterName",
        TO_CHAR(g.event_date, 'YYYY-MM-DD') as "eventDate",
        g.start_time as "startTime",
        g.meet_url as "meetUrl",
        g.venue_name as "venueName",
        g.description,
        g.status,
        g.magic_token as "magicToken",
        g.gate_code as "gateCode",
        g.cover_url as "coverUrl",
        g.moderator_user_id as "moderatorUserId",
        g.moderator_name as "moderatorName",
        g.moderator_avatar_url as "moderatorAvatarUrl",
        g.moderator_lkid as "moderatorLkid",
        g.moderator_bio as "moderatorBio",
        g.moderator_leaves_bounty as "moderatorLeavesBounty",
        g.moderator_bounty_awarded as "moderatorBountyAwarded",
        g.first_herald_user_id as "firstHeraldUserId",
        g.first_herald_claimed_at as "firstHeraldClaimedAt",
        fh.full_name as "firstHeraldName",
        fh.lk_id as "firstHeraldLkId",
        fh.instagram as "firstHeraldInstagram",
        COUNT(DISTINCT r.id)::int as "rsvpCount",
        COUNT(DISTINCT a.id)::int as "attendanceCount"
      FROM gatherings g
      LEFT JOIN chapters c ON c.id = g.chapter_id
      LEFT JOIN users fh ON fh.id = g.first_herald_user_id
      LEFT JOIN gathering_rsvps r ON r.gathering_id = g.id
      LEFT JOIN gathering_attendances a ON a.gathering_id = g.id
      WHERE g.id = $1
      GROUP BY g.id, c.name, fh.full_name, fh.lk_id, fh.instagram
    `;

    const gathering = await Database.queryOne(query, [gatheringId]);
    if (!gathering) {
      return NextResponse.json({ success: false, error: 'Gathering not found' }, { status: 404 });
    }

    // Fetch the attendee roll (ordered by arrival_order)
    const attendances = await Database.query(`
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
        ga.status,
        ga.leaves_awarded as "leavesAwarded",
        ga.checkin_time as "checkinTime"
      FROM gathering_attendances ga
      LEFT JOIN users u ON u.id = ga.user_id
      WHERE ga.gathering_id = $1
      ORDER BY ga.arrival_order ASC, ga.checkin_time ASC
    `, [gatheringId]);

    // Fetch the RSVP list
    const rsvps = await Database.query(`
      SELECT 
        gr.id,
        gr.user_id as "userId",
        COALESCE(u.full_name, gr.guest_name) as "name",
        COALESCE(u.lk_id, 'Guest') as "lkId",
        gr.is_first_herald as "isFirstHerald",
        gr.created_at as "rsvpTime"
      FROM gathering_rsvps gr
      LEFT JOIN users u ON u.id = gr.user_id
      WHERE gr.gathering_id = $1
      ORDER BY gr.created_at ASC
    `, [gatheringId]);

    return NextResponse.json({
      success: true,
      gathering,
      attendances,
      rsvps
    });
  } catch (error) {
    console.error('Error fetching gathering details:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch gathering details' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
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

    const body = await request.json();
    const { 
      status, 
      title, 
      meetUrl, 
      venueName, 
      description,
      gatheringType,
      eventDate,
      startTime,
      chapterId,
      coverUrl,
      gateCode,
      moderatorUserId,
      moderatorName,
      moderatorAvatarUrl,
      moderatorLkid,
      moderatorBio,
      moderatorLeavesBounty
    } = body;

    const allowedUpdates = [];
    const values = [];
    let idx = 1;

    if (status !== undefined) {
      allowedUpdates.push(`status = $${idx++}`);
      values.push(status);

      // Automated Bounty Payout when session concludes
      if (status === 'concluded') {
        try {
          const currentGathering = await Database.queryOne(
            'SELECT moderator_user_id, moderator_leaves_bounty, moderator_bounty_awarded, title FROM gatherings WHERE id = $1',
            [gatheringId]
          );
          if (currentGathering?.moderator_user_id && !currentGathering.moderator_bounty_awarded) {
            const bounty = parseInt(currentGathering.moderator_leaves_bounty || 50, 10);
            await Database.query(
              'UPDATE users SET leaves_balance = leaves_balance + $1 WHERE id = $2',
              [bounty, currentGathering.moderator_user_id]
            );
            await Database.query(
              `INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
               VALUES ($1, $2, 'event_anchor_bounty', $3)`,
              [
                currentGathering.moderator_user_id,
                bounty,
                `Host Bounty for moderating: ${currentGathering.title}`
              ]
            );
            allowedUpdates.push(`moderator_bounty_awarded = TRUE`);
          }
        } catch (bountyErr) {
          console.error('Error auto-awarding moderator leaves bounty:', bountyErr);
        }
      }
    }
    if (title !== undefined) {
      allowedUpdates.push(`title = $${idx++}`);
      values.push(title);
    }
    if (meetUrl !== undefined) {
      allowedUpdates.push(`meet_url = $${idx++}`);
      values.push(meetUrl);
    }
    if (venueName !== undefined) {
      allowedUpdates.push(`venue_name = $${idx++}`);
      values.push(venueName);
    }
    if (description !== undefined) {
      allowedUpdates.push(`description = $${idx++}`);
      values.push(description);
    }
    if (gatheringType !== undefined) {
      allowedUpdates.push(`gathering_type = $${idx++}`);
      values.push(gatheringType);
    }
    if (eventDate !== undefined) {
      allowedUpdates.push(`event_date = $${idx++}`);
      values.push(eventDate);
    }
    if (startTime !== undefined) {
      allowedUpdates.push(`start_time = $${idx++}`);
      values.push(startTime);
    }
    if (chapterId !== undefined) {
      allowedUpdates.push(`chapter_id = $${idx++}`);
      values.push(chapterId ? parseInt(chapterId, 10) : null);
    }
    if (coverUrl !== undefined) {
      allowedUpdates.push(`cover_url = $${idx++}`);
      values.push(coverUrl);
    }
    if (gateCode !== undefined) {
      allowedUpdates.push(`gate_code = $${idx++}`);
      values.push(gateCode);
    }
    if (moderatorUserId !== undefined) {
      allowedUpdates.push(`moderator_user_id = $${idx++}`);
      values.push(moderatorUserId ? parseInt(moderatorUserId, 10) : null);
    }
    if (moderatorName !== undefined) {
      allowedUpdates.push(`moderator_name = $${idx++}`);
      values.push(moderatorName || null);
    }
    if (moderatorAvatarUrl !== undefined) {
      allowedUpdates.push(`moderator_avatar_url = $${idx++}`);
      values.push(moderatorAvatarUrl || null);
    }
    if (moderatorLkid !== undefined) {
      allowedUpdates.push(`moderator_lkid = $${idx++}`);
      values.push(moderatorLkid || null);
    }
    if (moderatorBio !== undefined) {
      allowedUpdates.push(`moderator_bio = $${idx++}`);
      values.push(moderatorBio || null);
    }
    if (moderatorLeavesBounty !== undefined) {
      allowedUpdates.push(`moderator_leaves_bounty = $${idx++}`);
      values.push(parseInt(moderatorLeavesBounty || 50, 10));
    }

    if (allowedUpdates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(gatheringId);
    const updated = await Database.queryOne(`
      UPDATE gatherings 
      SET ${allowedUpdates.join(', ')} 
      WHERE id = $${idx} 
      RETURNING *
    `, values);

    return NextResponse.json({
      success: true,
      gathering: updated
    });
  } catch (error) {
    console.error('Error updating gathering:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update gathering' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    // Cascade delete rsvps and attendances
    await Database.query('DELETE FROM gathering_rsvps WHERE gathering_id = $1', [gatheringId]);
    await Database.query('DELETE FROM gathering_attendances WHERE gathering_id = $1', [gatheringId]);
    await Database.query('DELETE FROM gathering_disputes WHERE gathering_id = $1', [gatheringId]);
    await Database.query('DELETE FROM gatherings WHERE id = $1', [gatheringId]);

    return NextResponse.json({ success: true, message: 'Gathering removed successfully' });
  } catch (error) {
    console.error('Error deleting gathering:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete gathering' }, { status: 500 });
  }
}
