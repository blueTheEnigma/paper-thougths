import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

export async function GET(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
    const isSuperadmin = email === SUPERADMIN_EMAIL.toLowerCase();
    const canModerate = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !canModerate) {
      return NextResponse.json({ success: false, error: 'Access denied: Insufficient privileges.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthYear = searchParams.get('monthYear') || defaultMonth;
    const allEligible = searchParams.get('allEligible') === 'true';

    // 1. Fetch Candidate Submissions
    // If allEligible is true, fetch all submissions in active_batch or submitted this year
    let subWhereClause = `s.cycle_month = $1`;
    let subParams = [monthYear];

    if (allEligible) {
      subWhereClause = `(s.cycle_month = $1 OR s.batch_status = 'active_batch' OR s.created_at >= date_trunc('year', CURRENT_DATE))`;
    }

    const submissionsRaw = await Database.query(`
      SELECT 
        s.id,
        s.title,
        s.genre,
        s.logline,
        s.body_text,
        s.pen_name,
        s.batch_status,
        s.has_laurel,
        s.anthology_inducted,
        s.cycle_month,
        s.created_at,
        u.id as author_id,
        u.full_name as author_name,
        u.avatar_url as author_avatar,
        u.reader_archetype as author_archetype,
        u.whatsapp as author_whatsapp,
        c.name as chapter_name,
        (SELECT COUNT(*) FROM submission_likes sl WHERE sl.submission_id = s.id)::int as likes_count
      FROM submissions s
      JOIN users u ON u.id = s.author_id
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE ${subWhereClause}
      ORDER BY s.created_at DESC
    `, subParams);

    // Fetch salon comments for these submissions
    const subIds = submissionsRaw.map(s => s.id);
    let commentsBySubId = {};
    let reviewsBySubId = {};

    if (subIds.length > 0) {
      const comments = await Database.query(`
        SELECT 
          sc.id,
          sc.submission_id,
          sc.content,
          sc.created_at,
          COALESCE(sc.pen_name, u.full_name, 'Anonymous') as commenter_name,
          u.avatar_url as commenter_avatar
        FROM submission_comments sc
        LEFT JOIN users u ON u.id = sc.user_id
        WHERE sc.submission_id = ANY($1)
        ORDER BY sc.created_at ASC
      `, [subIds]);

      comments.forEach(c => {
        if (!commentsBySubId[c.submission_id]) commentsBySubId[c.submission_id] = [];
        commentsBySubId[c.submission_id].push({
          id: c.id,
          content: c.content,
          author: c.commenter_name,
          avatar: c.commenter_avatar,
          createdAt: c.created_at
        });
      });

      const reviews = await Database.query(`
        SELECT 
          pr.id,
          pr.submission_id,
          pr.pacing_rating,
          pr.strengths_array,
          pr.mirror_response,
          pr.highwater_response,
          pr.pivot_response,
          pr.is_helpful,
          pr.created_at,
          u.full_name as reviewer_name,
          u.avatar_url as reviewer_avatar
        FROM peer_reviews pr
        LEFT JOIN users u ON u.id = pr.reviewer_id
        WHERE pr.submission_id = ANY($1)
        ORDER BY pr.created_at DESC
      `, [subIds]);

      reviews.forEach(r => {
        if (!reviewsBySubId[r.submission_id]) reviewsBySubId[r.submission_id] = [];
        reviewsBySubId[r.submission_id].push({
          id: r.id,
          reviewerName: r.reviewer_name || 'Anonymous Peer',
          reviewerAvatar: r.reviewer_avatar,
          pacingRating: r.pacing_rating,
          strengths: r.strengths_array || [],
          mirror: r.mirror_response,
          highwater: r.highwater_response,
          pivot: r.pivot_response,
          isHelpful: !!r.is_helpful,
          createdAt: r.created_at
        });
      });
    }

    const candidateSubmissions = submissionsRaw.map(s => ({
      id: s.id,
      title: s.title,
      genre: s.genre,
      isPoem: (s.genre || '').toLowerCase() === 'poetry',
      logline: s.logline,
      bodyText: s.body_text,
      penName: s.pen_name || s.author_name || 'Anonymous',
      authorId: s.author_id,
      authorName: s.author_name,
      authorAvatar: s.author_avatar,
      authorArchetype: s.author_archetype,
      authorWhatsapp: s.author_whatsapp,
      chapterName: s.chapter_name || 'General',
      batchStatus: s.batch_status,
      hasLaurel: !!s.has_laurel,
      anthologyInducted: !!s.anthology_inducted,
      cycleMonth: s.cycle_month,
      createdAt: s.created_at,
      likesCount: s.likes_count || 0,
      comments: commentsBySubId[s.id] || [],
      reviews: reviewsBySubId[s.id] || []
    }));

    // 2. Fetch Reviewers Analytics (90% Completion Rule)
    const totalEligibleSubmissions = candidateSubmissions.length;

    const reviewerStatsRaw = await Database.query(`
      SELECT 
        u.id as reviewer_id,
        u.full_name as reviewer_name,
        u.avatar_url as reviewer_avatar,
        u.reader_archetype as reviewer_archetype,
        u.whatsapp as reviewer_whatsapp,
        COUNT(pr.id)::int as total_reviews,
        COUNT(CASE WHEN pr.is_helpful = TRUE THEN 1 END)::int as helpful_reviews
      FROM users u
      JOIN peer_reviews pr ON pr.reviewer_id = u.id
      WHERE pr.created_at >= date_trunc('month', CURRENT_DATE)
         OR ($1 = true AND pr.created_at >= date_trunc('year', CURRENT_DATE))
      GROUP BY u.id
      ORDER BY helpful_reviews DESC, total_reviews DESC
    `, [allEligible]);

    const reviewerAnalytics = reviewerStatsRaw.map(r => {
      // Find how many submissions this reviewer authored (they cannot review themselves)
      const ownSubmissionsCount = candidateSubmissions.filter(s => s.authorId === r.reviewer_id).length;
      const eligibleForReviewer = Math.max(1, totalEligibleSubmissions - ownSubmissionsCount);
      const completionRate = Math.min(1.0, (r.total_reviews / eligibleForReviewer));
      const qualifiesForCash = completionRate >= 0.90;

      return {
        id: r.reviewer_id,
        name: r.reviewer_name || 'Anonymous Reviewer',
        avatarUrl: r.reviewer_avatar,
        archetype: r.reviewer_archetype,
        whatsapp: r.reviewer_whatsapp,
        totalReviews: r.total_reviews,
        helpfulReviews: r.helpful_reviews,
        eligibleSubmissions: eligibleForReviewer,
        completionPercentage: Math.round(completionRate * 100),
        qualifiesForCash,
        cashPrizeLabel: qualifiesForCash ? 'Inquisitor Laurel Eligible (90%+ Met)' : 'Honorary Reviewer (Standard Leaves)'
      };
    });

    // 3. Fetch Existing Anthology Issue & Inducted Entries for this Month
    const currentIssue = await Database.queryOne(`
      SELECT * FROM monthly_anthology_issues WHERE month_year = $1
    `, [monthYear]);

    let inductedEntries = [];
    if (currentIssue) {
      inductedEntries = await Database.query(`
        SELECT 
          mae.id,
          mae.issue_id,
          mae.submission_id,
          mae.category,
          mae.placement_rank,
          mae.editor_citation,
          mae.prize_amount,
          s.title as submission_title,
          s.genre as submission_genre,
          s.pen_name,
          u.full_name as author_name,
          u.avatar_url as author_avatar,
          u.reader_archetype as author_archetype
        FROM monthly_anthology_entries mae
        JOIN submissions s ON s.id = mae.submission_id
        JOIN users u ON u.id = s.author_id
        WHERE mae.issue_id = $1
        ORDER BY mae.category ASC, mae.placement_rank ASC
      `, [currentIssue.id]);
    }

    // 4. Fetch Monthly Honors from monthly_leaderboard
    const leaderboardHonors = await Database.queryOne(`
      SELECT 
        l.*,
        gb.full_name as general_bookie_name,
        ab.full_name as abuja_bookie_name,
        ro.full_name as review_of_the_month_name
      FROM monthly_leaderboard l
      LEFT JOIN users gb ON gb.id = l.general_bookie_user_id
      LEFT JOIN users ab ON ab.id = l.abuja_bookie_user_id
      LEFT JOIN users ro ON ro.id = l.review_of_the_month_user_id
      WHERE l.month_year = $1
    `, [monthYear]);

    return NextResponse.json({
      success: true,
      monthYear,
      totalSubmissions: candidateSubmissions.length,
      submissions: candidateSubmissions,
      reviewers: reviewerAnalytics,
      anthologyIssue: currentIssue || null,
      inductedEntries,
      leaderboardHonors: leaderboardHonors || null
    });

  } catch (error) {
    console.error('Failed to fetch candidate submissions for anthology:', error);
    return NextResponse.json({ success: false, error: error.message || 'Operation failed' }, { status: 500 });
  }
}

