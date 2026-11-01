import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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
    const monthYear = searchParams.get('monthYear'); // e.g. '2026-11', '2026-10', '2026', 'all', or null
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const currentUserId = dbUser ? dbUser.id : -1;

    // Calculate current real-world calendar cycle
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const currentCycleMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    // Fetch available distinct cycle months for the archive selector
    const monthsRes = await Database.query(`
      SELECT DISTINCT cycle_month 
      FROM submissions 
      WHERE cycle_month IS NOT NULL AND batch_status IN ('active_batch', 'archived')
      ORDER BY cycle_month DESC
    `);
    const availableMonths = monthsRes.map(m => m.cycle_month).filter(Boolean);

    // Build intelligent filter options:
    // 1. Current month of the current year (always first, even if 0 pieces)
    // 2. Previous months of the CURRENT YEAR (e.g. October, September, August, July...)
    // 3. Past years (prior to currentYear) grouped by year (e.g. "2026", "2025")
    // 4. "All Archives"
    const filterOptions = [];

    // 1. Current month (always first, default)
    filterOptions.push({
      value: currentCycleMonth,
      label: MONTH_NAMES[now.getMonth()]
    });

    // 2. Previous months of the CURRENT YEAR
    const currentYearMonths = availableMonths
      .filter(m => m.startsWith(`${currentYear}-`) && m !== currentCycleMonth)
      .sort((a, b) => b.localeCompare(a));

    for (const m of currentYearMonths) {
      const parts = m.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthName = MONTH_NAMES[monthIdx] || m;
      filterOptions.push({
        value: m,
        label: monthName
      });
    }

    // 3. Past years grouped by year
    const priorYears = Array.from(new Set(
      availableMonths
        .map(m => m.split('-')[0])
        .filter(y => parseInt(y, 10) < currentYear)
    )).sort((a, b) => b.localeCompare(a));

    for (const year of priorYears) {
      filterOptions.push({
        value: year,
        label: year
      });
    }

    // 4. All Archives
    filterOptions.push({
      value: 'all',
      label: 'All Archives'
    });

    // Determine active filter:
    // Defaults strictly to CURRENT MONTH if not specified or empty!
    const activeCycle = monthYear === 'all'
      ? 'all'
      : (monthYear || currentCycleMonth);

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

    if (activeCycle !== 'all') {
      if (/^\d{4}$/.test(activeCycle)) {
        // Grouped year filter, e.g. "2026"
        queryParams.push(`${activeCycle}-%`);
        queryText += ` AND s.cycle_month LIKE $${queryParams.length}`;
      } else {
        // Specific month filter, e.g. "2026-11" or "2026-10"
        queryParams.push(activeCycle);
        queryText += ` AND s.cycle_month = $${queryParams.length}`;
      }
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
      selectedCycle: activeCycle,
      currentCycle: currentCycleMonth,
      filterOptions,
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
        ratingCount: parseInt(s.ratingCount || 0, 10),
        averageRating: parseFloat(s.averageRating || 0),
        userRating: s.userRating ? parseInt(s.userRating, 10) : null,
        userLiked: !!s.userLiked
      }))
    });
  } catch (error) {
    console.error('Failed to fetch gallery submissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to load gallery works.' }, { status: 500 });
  }
}
