import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

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

    const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
    const isSuperadmin = email === SUPERADMIN_EMAIL.toLowerCase();
    const canModerate = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !canModerate) {
      return NextResponse.json({ success: false, error: 'Access denied: Insufficient privileges.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      monthYear,
      displayTitle,
      curatorForeword,
      stories = [], // [{ submissionId, rank, editorCitation, prizeAmount }]
      poems = [],   // [{ submissionId, rank, editorCitation, prizeAmount }]
      generalBookieUserId,
      generalBookieText,
      abujaBookieUserId,
      abujaBookieText,
      reviewOfTheMonthUserId,
      reviewOfTheMonthText,
      published = true
    } = body;

    if (!monthYear || !displayTitle) {
      return NextResponse.json({ success: false, error: 'Missing monthYear or displayTitle.' }, { status: 400 });
    }

    const result = await Database.transaction(async (client) => {
      // 1. Upsert Monthly Anthology Issue
      const issueRes = await client.query(`
        INSERT INTO monthly_anthology_issues (month_year, display_title, curator_foreword, published, published_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (month_year) DO UPDATE SET
          display_title = EXCLUDED.display_title,
          curator_foreword = EXCLUDED.curator_foreword,
          published = EXCLUDED.published,
          published_at = NOW()
        RETURNING id
      `, [monthYear, displayTitle, curatorForeword || '', published]);

      const issueId = issueRes.rows[0].id;

      // 2. Remove previous entries for this issue if re-publishing
      await client.query(`DELETE FROM monthly_anthology_entries WHERE issue_id = $1`, [issueId]);

      // Helper to insert entries
      const entriesToInsert = [
        ...stories.map(s => ({ ...s, category: 'story' })),
        ...poems.map(p => ({ ...p, category: 'poem' }))
      ];

      for (const entry of entriesToInsert) {
        if (!entry.submissionId || !entry.rank) continue;

        await client.query(`
          INSERT INTO monthly_anthology_entries (
            issue_id, submission_id, category, placement_rank, editor_citation, prize_amount
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          issueId,
          parseInt(entry.submissionId, 10),
          entry.category,
          parseInt(entry.rank, 10),
          entry.editorCitation || 'Inducted into the Paper Thoughts Monthly Anthology.',
          parseInt(entry.prizeAmount || 2000, 10)
        ]);

        // Update submission status and award laurel
        await client.query(`
          UPDATE submissions 
          SET has_laurel = TRUE, anthology_inducted = TRUE 
          WHERE id = $1
        `, [entry.submissionId]);

        // Reward author with 100 Spendable Leaves & 100 Lifetime Leaves
        const authorRes = await client.query(`
          UPDATE users 
          SET spendable_leaves = spendable_leaves + 100, 
              lifetime_leaves = lifetime_leaves + 100 
          WHERE id = (SELECT author_id FROM submissions WHERE id = $1)
          RETURNING id
        `, [entry.submissionId]);

        if (authorRes.rows.length > 0) {
          const authorId = authorRes.rows[0].id;
          await client.query(`
            INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
            VALUES ($1, 100, 'anthology_laurel', $2)
          `, [authorId, `Awarded for ${entry.category === 'poem' ? 'Poem' : 'Short Story'} Anthology Placement (${monthYear})`]);
        }
      }

      // 3. Upsert into monthly_leaderboard for unified honors synchronization
      const cleanGeneralBookieId = (body.bookieUserId || generalBookieUserId) ? parseInt(body.bookieUserId || generalBookieUserId, 10) : null;
      const cleanAbujaBookieId = abujaBookieUserId ? parseInt(abujaBookieUserId, 10) : null;
      const cleanReviewerId = reviewOfTheMonthUserId ? parseInt(reviewOfTheMonthUserId, 10) : null;

      await client.query(`
        INSERT INTO monthly_leaderboard (
          month_year,
          general_bookie_user_id, general_bookie_text,
          abuja_bookie_user_id, abuja_bookie_text,
          review_of_the_month_user_id, review_of_the_month_text,
          published
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (month_year) DO UPDATE SET
          general_bookie_user_id = EXCLUDED.general_bookie_user_id,
          general_bookie_text = EXCLUDED.general_bookie_text,
          abuja_bookie_user_id = EXCLUDED.abuja_bookie_user_id,
          abuja_bookie_text = EXCLUDED.abuja_bookie_text,
          review_of_the_month_user_id = EXCLUDED.review_of_the_month_user_id,
          review_of_the_month_text = EXCLUDED.review_of_the_month_text,
          published = EXCLUDED.published,
          created_at = NOW()
      `, [
        monthYear,
        cleanGeneralBookieId, (body.bookieText || generalBookieText) || null,
        null, null,
        cleanReviewerId, reviewOfTheMonthText || null,
        published
      ]);

      return { issueId, monthYear, published: true };
    });

    return NextResponse.json({
      success: true,
      message: `Anthology issue for ${monthYear} published successfully.`,
      data: result
    });

  } catch (error) {
    console.error('Failed to publish monthly anthology:', error);
    return NextResponse.json({ success: false, error: error.message || 'Publishing failed' }, { status: 500 });
  }
}

