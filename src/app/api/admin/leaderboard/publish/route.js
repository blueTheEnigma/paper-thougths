import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

export async function POST(request) {
  try {
    // 1. Authorize Admin
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
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      monthYear,
      generalBookieUserId,
      generalBookieText,
      abujaBookieUserId,
      abujaBookieText,
      reviewOfTheMonthUserId,
      reviewOfTheMonthText,
      authorOfTheMonthUserId,
      authorOfTheMonthText,
      mostImprovedAuthorUserId,
      mostImprovedAuthorText,
      published
    } = body;

    if (!monthYear) {
      return NextResponse.json({ success: false, error: 'Missing monthYear.' }, { status: 400 });
    }

    const cleanGeneralBookieUserId = generalBookieUserId ? parseInt(generalBookieUserId, 10) : null;
    const cleanAbujaBookieUserId = abujaBookieUserId ? parseInt(abujaBookieUserId, 10) : null;
    const cleanReviewUserId = reviewOfTheMonthUserId ? parseInt(reviewOfTheMonthUserId, 10) : null;
    const cleanAuthorUserId = authorOfTheMonthUserId ? parseInt(authorOfTheMonthUserId, 10) : null;
    const cleanImprovedUserId = mostImprovedAuthorUserId ? parseInt(mostImprovedAuthorUserId, 10) : null;

    await Database.query(`
      INSERT INTO monthly_leaderboard (
        month_year,
        general_bookie_user_id, general_bookie_text,
        abuja_bookie_user_id, abuja_bookie_text,
        review_of_the_month_user_id, review_of_the_month_text,
        author_of_the_month_user_id, author_of_the_month_text,
        most_improved_author_user_id, most_improved_author_text,
        published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (month_year) DO UPDATE SET
        general_bookie_user_id = EXCLUDED.general_bookie_user_id,
        general_bookie_text = EXCLUDED.general_bookie_text,
        abuja_bookie_user_id = EXCLUDED.abuja_bookie_user_id,
        abuja_bookie_text = EXCLUDED.abuja_bookie_text,
        review_of_the_month_user_id = EXCLUDED.review_of_the_month_user_id,
        review_of_the_month_text = EXCLUDED.review_of_the_month_text,
        author_of_the_month_user_id = EXCLUDED.author_of_the_month_user_id,
        author_of_the_month_text = EXCLUDED.author_of_the_month_text,
        most_improved_author_user_id = EXCLUDED.most_improved_author_user_id,
        most_improved_author_text = EXCLUDED.most_improved_author_text,
        published = EXCLUDED.published,
        created_at = NOW()
    `, [
      monthYear,
      cleanGeneralBookieUserId,
      generalBookieText || null,
      cleanAbujaBookieUserId,
      abujaBookieText || null,
      cleanReviewUserId,
      reviewOfTheMonthText || null,
      cleanAuthorUserId,
      authorOfTheMonthText || null,
      cleanImprovedUserId,
      mostImprovedAuthorText || null,
      published !== false
    ]);

    return NextResponse.json({ success: true, message: 'Leaderboard saved and published successfully.' });

  } catch (error) {
    console.error('Failed to publish leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to publish leaderboard.' }, { status: 500 });
  }
}
