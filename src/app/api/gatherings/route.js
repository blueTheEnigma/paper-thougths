import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, getUserPermissions, hasGatheringAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'upcoming'; // 'upcoming', 'all', 'past'

    let clerkUser = null;
    let dbUser = null;
    try {
      clerkUser = await currentUser();
      if (clerkUser) {
        dbUser = await syncOrCreateUser(clerkUser);
      }
    } catch {
      // Allow unauthenticated browsing
    }

    let statusCondition = "g.status IN ('published', 'live')";
    if (filter === 'all') {
      statusCondition = "1=1";
    } else if (filter === 'past') {
      statusCondition = "g.status = 'concluded' OR g.event_date < CURRENT_DATE";
    } else {
      statusCondition = "(g.status IN ('published', 'live') AND (g.event_date >= CURRENT_DATE OR g.status = 'live'))";
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
        COUNT(DISTINCT r.id)::int as "rsvpCount",
        COUNT(DISTINCT a.id)::int as "attendanceCount",
        CASE 
          WHEN $1::int IS NOT NULL AND EXISTS (
            SELECT 1 FROM gathering_rsvps gr WHERE gr.gathering_id = g.id AND gr.user_id = $1::int
          ) THEN true 
          ELSE false 
        END as "hasRsvped",
        CASE 
          WHEN $1::int IS NOT NULL AND EXISTS (
            SELECT 1 FROM gathering_attendances ga WHERE ga.gathering_id = g.id AND ga.user_id = $1::int
          ) THEN true 
          ELSE false 
        END as "hasCheckedIn"
      FROM gatherings g
      LEFT JOIN chapters c ON c.id = g.chapter_id
      LEFT JOIN users fh ON fh.id = g.first_herald_user_id
      LEFT JOIN gathering_rsvps r ON r.gathering_id = g.id
      LEFT JOIN gathering_attendances a ON a.gathering_id = g.id
      WHERE ${statusCondition}
      GROUP BY g.id, c.name, fh.full_name, fh.lk_id
      ORDER BY g.event_date ASC, g.start_time ASC
    `;

    const gatherings = await Database.query(query, [dbUser ? dbUser.id : null]);

    return NextResponse.json({
      success: true,
      gatherings
    });
  } catch (error) {
    console.error('Error fetching gatherings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch gatherings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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
      title, 
      gatheringType = 'townhall', 
      eventDate, 
      startTime = '20:15:00', 
      meetUrl, 
      venueName, 
      description, 
      chapterId = null,
      coverUrl = null,
      moderatorUserId = null,
      moderatorName = null,
      moderatorAvatarUrl = null,
      moderatorLkid = null,
      moderatorBio = null,
      moderatorLeavesBounty = 50
    } = body;

    if (!title || !eventDate) {
      return NextResponse.json({ success: false, error: 'Title and event date are required' }, { status: 400 });
    }

    // Default flyer fallback based on type if not provided
    let finalCoverUrl = coverUrl;
    if (!finalCoverUrl) {
      if (gatheringType === 'townhall') finalCoverUrl = '/images/gatherings/townhall.jpg';
      else if (gatheringType === 'book_banter') finalCoverUrl = '/images/gatherings/book_banter.jpg';
      else if (gatheringType === 'botm_review') finalCoverUrl = '/images/gatherings/botm_review.jpg';
    }

    // Generate random 4-digit numeric gate code and unique session token
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefixMap = {
      townhall: 'TH',
      book_banter: 'BB',
      botm_review: 'BR',
      physical: 'PH'
    };
    const prefix = prefixMap[gatheringType] || 'GT';
    const magicToken = `${prefix}-${eventDate.replace(/-/g, '')}-${randomSuffix}`;
    const gateCode = String(Math.floor(1000 + Math.random() * 9000));

    const insertQuery = `
      INSERT INTO gatherings (
        title, gathering_type, chapter_id, event_date, start_time,
        meet_url, venue_name, description, status, magic_token, gate_code, cover_url,
        moderator_user_id, moderator_name, moderator_avatar_url, moderator_lkid, moderator_bio,
        moderator_leaves_bounty, created_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const newGathering = await Database.queryOne(insertQuery, [
      title,
      gatheringType,
      chapterId ? parseInt(chapterId, 10) : null,
      eventDate,
      startTime,
      meetUrl || null,
      venueName || (gatheringType === 'book_banter' ? 'X Spaces' : 'Google Meet'),
      description || '',
      magicToken,
      gateCode,
      finalCoverUrl,
      moderatorUserId ? parseInt(moderatorUserId, 10) : null,
      moderatorName || null,
      moderatorAvatarUrl || null,
      moderatorLkid || null,
      moderatorBio || null,
      parseInt(moderatorLeavesBounty || 50, 10),
      dbUser.id
    ]);

    return NextResponse.json({
      success: true,
      gathering: newGathering
    });
  } catch (error) {
    console.error('Error creating gathering:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create gathering' }, { status: 500 });
  }
}
