import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// GET: Fetch ratings summary & user's own rating
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID' }, { status: 400 });
    }

    let currentUserId = null;
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const dbUser = await syncOrCreateUser(clerkUser);
        currentUserId = dbUser?.id || null;
      }
    } catch {
      // Allow guest lookup
    }

    // 1. Fetch aggregate stats
    const stats = await Database.queryOne(`
      SELECT 
        COUNT(*)::int as "totalRatings",
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0)::float as "averageRating",
        COUNT(*) FILTER (WHERE rating = 5)::int as "fiveStar",
        COUNT(*) FILTER (WHERE rating = 4)::int as "fourStar",
        COUNT(*) FILTER (WHERE rating = 3)::int as "threeStar",
        COUNT(*) FILTER (WHERE rating = 2)::int as "twoStar",
        COUNT(*) FILTER (WHERE rating = 1)::int as "oneStar"
      FROM submission_ratings
      WHERE submission_id = $1
    `, [submissionId]);

    // 2. Fetch aggregated top tags
    const tagsRes = await Database.query(`
      SELECT unnest(tags) as tag, COUNT(*)::int as count
      FROM submission_ratings
      WHERE submission_id = $1
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 6
    `, [submissionId]);

    // 3. Fetch user's own rating if logged in
    let userRating = null;
    if (currentUserId) {
      userRating = await Database.queryOne(`
        SELECT rating, tags, review_text as "reviewText", created_at as "createdAt"
        FROM submission_ratings
        WHERE submission_id = $1 AND user_id = $2
      `, [submissionId, currentUserId]);
    }

    // 4. Fetch recent ratings with reviews
    const recentReviews = await Database.query(`
      SELECT 
        r.id,
        r.rating,
        r.tags,
        r.review_text as "reviewText",
        r.created_at as "createdAt",
        u.full_name as "userName",
        u.avatar_url as "userAvatarUrl",
        u.reader_archetype as "userArchetype"
      FROM submission_ratings r
      JOIN users u ON u.id = r.user_id
      WHERE r.submission_id = $1 AND r.review_text IS NOT NULL AND r.review_text != ''
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [submissionId]);

    return NextResponse.json({
      success: true,
      stats: {
        totalRatings: stats?.totalRatings || 0,
        averageRating: stats?.averageRating || 0,
        distribution: {
          5: stats?.fiveStar || 0,
          4: stats?.fourStar || 0,
          3: stats?.threeStar || 0,
          2: stats?.twoStar || 0,
          1: stats?.oneStar || 0
        },
        topTags: tagsRes || []
      },
      userRating,
      recentReviews
    });
  } catch (error) {
    console.error('Failed to fetch ratings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load ratings' }, { status: 500 });
  }
}

// POST: Add or update rating
export async function POST(request, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Sign in to rate this piece.' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const rating = parseInt(body.rating, 10);
    const tags = Array.isArray(body.tags) ? body.tags.slice(0, 5) : [];
    const reviewText = body.reviewText && typeof body.reviewText === 'string' ? body.reviewText.trim().slice(0, 500) : null;

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5 quills.' }, { status: 400 });
    }

    // Upsert rating
    const saved = await Database.queryOne(`
      INSERT INTO submission_ratings (submission_id, user_id, rating, tags, review_text, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (submission_id, user_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        tags = EXCLUDED.tags,
        review_text = EXCLUDED.review_text,
        created_at = CURRENT_TIMESTAMP
      RETURNING id, rating, tags, review_text as "reviewText", created_at as "createdAt"
    `, [submissionId, dbUser.id, rating, tags, reviewText]);

    // Recalculate stats
    const stats = await Database.queryOne(`
      SELECT 
        COUNT(*)::int as "totalRatings",
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0)::float as "averageRating"
      FROM submission_ratings
      WHERE submission_id = $1
    `, [submissionId]);

    return NextResponse.json({
      success: true,
      userRating: saved,
      stats: {
        totalRatings: stats?.totalRatings || 0,
        averageRating: stats?.averageRating || 0
      }
    });
  } catch (error) {
    console.error('Failed to save rating:', error);
    return NextResponse.json({ success: false, error: 'Failed to record rating.' }, { status: 500 });
  }
}

