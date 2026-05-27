import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET() {
  try {
    const leaderboard = await Database.queryOne(`
      SELECT 
        l.id,
        l.month_year as "monthYear",
        l.general_bookie_user_id as "generalBookieUserId",
        l.general_bookie_text as "generalBookieText",
        l.abuja_bookie_user_id as "abujaBookieUserId",
        l.abuja_bookie_text as "abujaBookieText",
        l.review_of_the_month_user_id as "reviewOfTheMonthUserId",
        l.review_of_the_month_text as "reviewOfTheMonthText",
        l.author_of_the_month_user_id as "authorOfTheMonthUserId",
        l.author_of_the_month_text as "authorOfTheMonthText",
        l.most_improved_author_user_id as "mostImprovedAuthorUserId",
        l.most_improved_author_text as "mostImprovedAuthorText",
        l.created_at as "createdAt",
        ug.full_name as "generalBookieName",
        ua.full_name as "abujaBookieName",
        ur.full_name as "reviewWinnerName",
        uw.full_name as "authorWinnerName",
        ui.full_name as "improvedWinnerName"
      FROM monthly_leaderboard l
      LEFT JOIN users ug ON ug.id = l.general_bookie_user_id
      LEFT JOIN users ua ON ua.id = l.abuja_bookie_user_id
      LEFT JOIN users ur ON ur.id = l.review_of_the_month_user_id
      LEFT JOIN users uw ON uw.id = l.author_of_the_month_user_id
      LEFT JOIN users ui ON ui.id = l.most_improved_author_user_id
      WHERE l.published = TRUE
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 1
    `);

    return NextResponse.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Failed to fetch active leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve active leaderboard.' }, { status: 500 });
  }
}
