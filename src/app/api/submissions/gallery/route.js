import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export async function GET(request) {
  try {
    const clerkUser = await currentUser();
    let dbUser = null;
    if (clerkUser) {
      dbUser = await syncOrCreateUser(clerkUser);
    }

    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    const monthYear = searchParams.get('monthYear'); // '2026-10', 'all', or null
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const currentUserId = dbUser ? dbUser.id : -1;

    // Fetch available distinct cycle months for the archive selector
    const monthsRes = await Database.query(`
      SELECT DISTINCT cycle_month 
      FROM submissions 
      WHERE cycle_month IS NOT NULL AND batch_status IN ('active_batch', 'archived')
      ORDER BY cycle_month DESC
    `);
    const availableMonths = monthsRes.map(m => m.cycle_month).filter(Boolean);

    // Active cycle month to filter by (default to latest cycle month if not 'all' and not specified)
    const activeCycle = monthYear === 'all' 
      ? null 
      : (monthYear || (availableMonths.length > 0 ? availableMonths[0] : null));

    let queryText = `
      SELECT 
        s.id,
        s.title,
        s.genre,
        s.logline,
        s.body_text as "bodyText",
        s.pen_name as "penName",
        s.batch_status as "batchStatus",
        s.has_laurel as "hasLaurel",
        s.anthology_inducted as "anthologyInducted",
        s.cycle_month as "cycleMonth",
        s.created_at as "createdAt",
        u.full_name as "authorFullName",
        u.avatar_url as "authorAvatarUrl",
        u.reader_archetype as "authorArchetype",
        COALESCE(s.pen_name, u.full_name, 'Anonymous Writer') as "displayName",
        (SELECT COUNT(*) FROM submission_likes l WHERE l.submission_id = s.id)::int as "likeCount",
        (SELECT COUNT(*) FROM submission_comments c WHERE c.submission_id = s.id)::int as "commentCount",
        (SELECT COUNT(*) FROM submission_ratings r WHERE r.submission_id = s.id)::int as "ratingCount",
        (SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0) FROM submission_ratings r WHERE r.submission_id = s.id)::float as "averageRating",
        (SELECT r.rating FROM submission_ratings r WHERE r.submission_id = s.id AND r.user_id = $1) as "userRating",
        EXISTS(SELECT 1 FROM submission_likes l WHERE l.submission_id = s.id AND l.user_id = $1) as "userLiked"
      FROM submissions s
      JOIN users u ON u.id = s.author_id
      WHERE (
        s.batch_status IN ('active_batch', 'archived')
      )
    `;

    const queryParams = [currentUserId];

    if (activeCycle) {
      queryParams.push(activeCycle);
      queryText += ` AND s.cycle_month = $${queryParams.length}`;
    }

    if (genre && genre !== 'All') {
      queryParams.push(genre);
      queryText += ` AND s.genre = $${queryParams.length}`;
    }

    if (search && search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      queryText += ` AND (s.title ILIKE $${queryParams.length} OR s.logline ILIKE $${queryParams.length} OR s.pen_name ILIKE $${queryParams.length})`;
    }

    queryText += ` ORDER BY s.created_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    const submissions = await Database.query(queryText, queryParams);

    return NextResponse.json({
      success: true,
      selectedCycle: activeCycle || 'all',
      availableMonths,
      submissions: submissions.map(s => ({
        id: s.id,
        title: s.title,
        genre: s.genre,
        logline: s.logline,
        bodyText: s.bodyText,
        penName: s.penName,
        displayName: s.displayName,
        authorAvatarUrl: s.authorAvatarUrl,
        authorArchetype: s.authorArchetype,
        hasLaurel: !!s.hasLaurel,
        anthologyInducted: !!s.anthologyInducted,
        cycleMonth: s.cycleMonth,
        createdAt: s.createdAt,
        likeCount: parseInt(s.likeCount || 0, 10),
        commentCount: parseInt(s.commentCount || 0, 10),
        userLiked: !!s.userLiked
      }))
    });
  } catch (error) {
    console.error('Failed to fetch gallery submissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to load gallery works.' }, { status: 500 });
  }
}
