import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

// Saturday 12:00 AM batch cycle start calculator (UTC aligned)
function getLastSaturdayStart() {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) {
    daysSinceSaturday += 7;
  }
  
  const lastSaturday = new Date(now);
  lastSaturday.setUTCDate(now.getUTCDate() - daysSinceSaturday);
  lastSaturday.setUTCHours(0, 0, 0, 0);
  return lastSaturday;
}

// 1. Create a submission (queued for the Saturday Batch Drop)
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

    const body = await request.json();
    const { title, genre, logline, bodyText, penName } = body;
    const cleanPenName = penName && typeof penName === 'string' && penName.trim() ? penName.trim() : null;

    if (!title || !genre || !logline || !bodyText) {
      return NextResponse.json({ success: false, error: 'All fields (title, genre, teaser, body) are required.' }, { status: 400 });
    }

    // Submission Gate Lock Check: Friday 11:59 PM to Saturday 12:00 AM (Batch drop transition)
    const now = new Date();
    const day = now.getDay(); // 5 = Friday, 6 = Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const isFridayNightLock = (day === 5 && hours === 23 && minutes >= 59);
    
    if (isFridayNightLock) {
      return NextResponse.json({ 
        success: false, 
        error: 'The Submission Gate is currently locked for Saturday Batch Drop preparations. Please try again in a few minutes.' 
      }, { status: 403 });
    }

    // Calculate current batch cycle start (Saturday 12:00 AM)
    const lastSaturday = getLastSaturdayStart();

    const result = await Database.transaction(async (client) => {
      // 1. Create submission
      const subRes = await client.query(`
        INSERT INTO submissions (author_id, title, genre, logline, body_text, pen_name, batch_status)
        VALUES ($1, $2, $3, $4, $5, $6, 'queued')
        RETURNING id, title, genre, pen_name as "penName", batch_status
      `, [dbUser.id, title, genre, logline, bodyText, cleanPenName]);
      const newSubmission = subRes.rows[0];

      // 2. Update user's last_submission_date
      await client.query(`
        UPDATE users 
        SET last_submission_date = CURRENT_DATE 
        WHERE id = $1
      `, [dbUser.id]);

      // 3. Count weekly submissions (excluding this new one)
      const userSubmissionsThisWeek = await client.query(`
        SELECT COUNT(*) as count 
        FROM submissions 
        WHERE author_id = $1 AND created_at >= $2 AND id != $3
      `, [dbUser.id, lastSaturday, newSubmission.id]);
      const submissionCount = parseInt(userSubmissionsThisWeek.rows[0]?.count || 0);
      const isFirstSubmissionThisWeek = (submissionCount === 0);

      let tokensRewarded = 0.0;
      let leavesRewarded = 0;
      let milestoneTriggered = false;

      if (isFirstSubmissionThisWeek) {
        tokensRewarded = 1.0;
        leavesRewarded = 5;

        // Fetch user leaves stats to check hidden milestone
        const userStatsRes = await client.query(`
          SELECT spendable_leaves, lifetime_leaves, book_vouchers_gifted FROM users WHERE id = $1
        `, [dbUser.id]);
        const userStats = userStatsRes.rows[0];

        const newLifetimeLeaves = (userStats.lifetime_leaves || 0) + leavesRewarded;
        const totalMilestonesEarned = Math.floor(newLifetimeLeaves / 500);
        const originalMilestonesEarned = userStats.book_vouchers_gifted || 0;
        let vouchersEarned = userStats.book_vouchers_gifted || 0;
        
        if (totalMilestonesEarned > originalMilestonesEarned) {
          vouchersEarned = totalMilestonesEarned;
          milestoneTriggered = true;
        }

        // Update rewards inside database
        await client.query(`
          UPDATE users 
          SET milestone_tokens = milestone_tokens + $1,
              spendable_leaves = spendable_leaves + $2,
              lifetime_leaves = lifetime_leaves + $2,
              book_vouchers_gifted = $3
          WHERE id = $4
        `, [tokensRewarded, leavesRewarded, vouchersEarned, dbUser.id]);

        // Log transaction to leaf_transactions
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, $2, 'submission', $3)
        `, [dbUser.id, leavesRewarded, `Earned ${leavesRewarded} leaves for the first weekly prompt submission`]);
      }

      return {
        newSubmission,
        isFirstSubmissionThisWeek,
        tokensRewarded,
        leavesRewarded,
        milestoneTriggered
      };
    });

    return NextResponse.json({ 
      success: true, 
      message: result.isFirstSubmissionThisWeek
        ? `Submission successfully uploaded and queued. Rewarded ${result.tokensRewarded} Milestone Tokens and ${result.leavesRewarded} Paper Leaves!`
        : 'Submission successfully uploaded and queued.',
      rewarded: result.isFirstSubmissionThisWeek,
      tokensEarned: result.tokensRewarded,
      leavesEarned: result.leavesRewarded,
      milestoneTriggered: result.milestoneTriggered,
      submission: result.newSubmission
    });
  } catch (error) {
    console.error('Submission creation failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit' }, { status: 500 });
  }
}

// 2. Fetch the Double-Blind Selection Queue OR author's own submission
// Returns 3 randomized active stories holding the lowest active review counts.
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

    const { searchParams } = new URL(request.url);
    const subId = searchParams.get('id');

    if (subId) {
      const submissionRaw = await Database.queryOne(`
        SELECT id, author_id, title, genre, logline, body_text, pen_name, batch_status, is_revised
        FROM submissions
        WHERE id = $1
      `, [subId]);

      if (!submissionRaw) {
        return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
      }

      // If the requester is the author, allow viewing of any status
      if (submissionRaw.author_id === dbUser.id) {
        return NextResponse.json({ 
          success: true, 
          submission: {
            id: submissionRaw.id,
            title: submissionRaw.title,
            genre: submissionRaw.genre,
            logline: submissionRaw.logline,
            bodyText: submissionRaw.body_text,
            penName: submissionRaw.pen_name || null,
            batchStatus: submissionRaw.batch_status,
            isRevised: submissionRaw.is_revised
          } 
        });
      }

      // If not the author, enforce double-blind conditions: must be active_batch
      if (submissionRaw.batch_status !== 'active_batch') {
        return NextResponse.json({ success: false, error: 'Submission not found or unauthorized.' }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        submission: {
          id: submissionRaw.id,
          title: submissionRaw.title,
          genre: submissionRaw.genre,
          logline: submissionRaw.logline,
          bodyText: submissionRaw.body_text
        } 
      });
    }

    // Dynamic queue query:
    // Selects active submissions excluding the reviewer's own work,
    // sorted by lowest review count first, breaking ties randomly
    const blindCards = await Database.query(`
      SELECT s.id, s.title, s.genre, s.logline, COUNT(r.id) as review_count
      FROM submissions s
      LEFT JOIN peer_reviews r ON r.submission_id = s.id
      WHERE s.batch_status = 'active_batch' AND s.author_id != $1
      GROUP BY s.id
      ORDER BY review_count ASC, RANDOM()
      LIMIT 3
    `, [dbUser.id]);

    // Strip metadata: we explicitly only return id, title, genre, and logline.
    // Review counts are used only internally for sorting.
    const strippedCards = blindCards.map(card => ({
      id: card.id,
      title: card.title,
      genre: card.genre,
      logline: card.logline
    }));

    return NextResponse.json({ 
      success: true, 
      queue: strippedCards 
    });
  } catch (error) {
    console.error('Failed to load selection queue:', error);
    return NextResponse.json({ success: false, error: error.message || 'Queue fetch failed' }, { status: 500 });
  }
}

// 3. Selection Intent Intercept: Record reader hook feedback (PATCH)
export async function PATCH(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, reason } = body;

    const validReasons = ['title', 'genre', 'logline', 'outside_comfort'];
    if (!submissionId || !reason || !validReasons.includes(reason)) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID or reason key.' }, { status: 400 });
    }

    // Increment selection_reason_counts using jsonb_set
    await Database.query(`
      UPDATE submissions
      SET selection_reason_counts = jsonb_set(
        selection_reason_counts, 
        ARRAY[$1], 
        (COALESCE(selection_reason_counts->>$1, '0')::int + 1)::text::jsonb
      )
      WHERE id = $2
    `, [reason, submissionId]);

    return NextResponse.json({ 
      success: true, 
      message: `Hook analytical intent '${reason}' recorded.` 
    });
  } catch (error) {
    console.error('Failed to record intent survey:', error);
    return NextResponse.json({ success: false, error: error.message || 'Intent record failed' }, { status: 500 });
  }
}

// 4. Update or Revision manuscript past works (PUT)
export async function PUT(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const body = await request.json();
    const { id, title, genre, logline, bodyText, penName, saveMode = 'update' } = body;
    const cleanPenName = penName && typeof penName === 'string' && penName.trim() ? penName.trim() : null;

    if (!id || !title || !genre || !logline || !bodyText) {
      return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
    }

    // 1. Fetch original submission to verify ownership and batch status
    const submission = await Database.queryOne(`
      SELECT id, author_id, batch_status FROM submissions WHERE id = $1
    `, [id]);

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
    }

    if (submission.author_id !== dbUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: You are not the author of this submission.' }, { status: 403 });
    }

    // 2. Enforce batch status constraints
    if (submission.batch_status === 'active_batch') {
      return NextResponse.json({ success: false, error: 'Editing is disabled: This manuscript is currently in the active critique queue.' }, { status: 400 });
    }

    if (submission.batch_status === 'queued') {
      // Queued submissions can only be updated in-place (inline)
      await Database.query(`
        UPDATE submissions 
        SET title = $1, genre = $2, logline = $3, body_text = $4, pen_name = $5 
        WHERE id = $6
      `, [title, genre, logline, bodyText, cleanPenName, id]);

      return NextResponse.json({ 
        success: true, 
        message: 'Manuscript updated inline successfully.',
        submission: { id, title, genre, penName: cleanPenName, batchStatus: 'queued' }
      });
    }

    if (submission.batch_status === 'archived') {
      if (saveMode === 'revision') {
        // Save as a new queued copy (revision)
        // Run weekly prompt reward logic (exact same as POST submissions)
        const lastSaturday = getLastSaturdayStart();

        const result = await Database.transaction(async (client) => {
          // A: Create new submission
          const subRes = await client.query(`
            INSERT INTO submissions (author_id, title, genre, logline, body_text, pen_name, batch_status)
            VALUES ($1, $2, $3, $4, $5, $6, 'queued')
            RETURNING id, title, genre, pen_name as "penName", batch_status
          `, [dbUser.id, title, genre, logline, bodyText, cleanPenName]);
          const newSubmission = subRes.rows[0];

          // B: Update user's last_submission_date
          await client.query(`
            UPDATE users 
            SET last_submission_date = CURRENT_DATE 
            WHERE id = $1
          `, [dbUser.id]);

          // C: Check weekly submission reward (first this week gets rewards)
          const userSubmissionsThisWeek = await client.query(`
            SELECT COUNT(*) as count 
            FROM submissions 
            WHERE author_id = $1 AND created_at >= $2 AND id != $3
          `, [dbUser.id, lastSaturday, newSubmission.id]);
          const submissionCount = parseInt(userSubmissionsThisWeek.rows[0]?.count || 0, 10);
          const isFirstSubmissionThisWeek = (submissionCount === 0);

          let tokensRewarded = 0.0;
          let leavesRewarded = 0;
          let milestoneTriggered = false;

          if (isFirstSubmissionThisWeek) {
            tokensRewarded = 1.0;
            leavesRewarded = 5;

            const userStatsRes = await client.query(`
              SELECT spendable_leaves, lifetime_leaves, book_vouchers_gifted FROM users WHERE id = $1
            `, [dbUser.id]);
            const userStats = userStatsRes.rows[0];

            const newLifetimeLeaves = (userStats.lifetime_leaves || 0) + leavesRewarded;
            const totalMilestonesEarned = Math.floor(newLifetimeLeaves / 500);
            const originalMilestonesEarned = userStats.book_vouchers_gifted || 0;
            let vouchersEarned = userStats.book_vouchers_gifted || 0;
            
            if (totalMilestonesEarned > originalMilestonesEarned) {
              vouchersEarned = totalMilestonesEarned;
              milestoneTriggered = true;
            }

            await client.query(`
              UPDATE users 
              SET milestone_tokens = milestone_tokens + $1,
                  spendable_leaves = spendable_leaves + $2,
                  lifetime_leaves = lifetime_leaves + $2,
                  book_vouchers_gifted = $3
              WHERE id = $4
            `, [tokensRewarded, leavesRewarded, vouchersEarned, dbUser.id]);

            await client.query(`
              INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
              VALUES ($1, $2, 'submission', $3)
            `, [dbUser.id, leavesRewarded, `Earned ${leavesRewarded} leaves for the first weekly prompt submission (revision)`]);
          }

          return {
            newSubmission,
            isFirstSubmissionThisWeek,
            tokensRewarded,
            leavesRewarded,
            milestoneTriggered
          };
        });

        return NextResponse.json({ 
          success: true, 
          message: result.isFirstSubmissionThisWeek
            ? `Revision successfully submitted as a new queued copy. Rewarded ${result.tokensRewarded} Milestone Tokens and ${result.leavesRewarded} Paper Leaves!`
            : 'Revision successfully submitted as a new queued copy.',
          rewarded: result.isFirstSubmissionThisWeek,
          tokensEarned: result.tokensRewarded,
          leavesEarned: result.leavesRewarded,
          milestoneTriggered: result.milestoneTriggered,
          submission: result.newSubmission
        });
      } else {
        // Save inline: Update existing archived work directly and mark it is_revised = true
        await Database.query(`
          UPDATE submissions 
          SET title = $1, genre = $2, logline = $3, body_text = $4, pen_name = $5, is_revised = true 
          WHERE id = $6
        `, [title, genre, logline, bodyText, cleanPenName, id]);

        return NextResponse.json({ 
          success: true, 
          message: 'Archived manuscript updated inline successfully. Critiques will show a revision badge.',
          submission: { id, title, genre, penName: cleanPenName, batchStatus: 'archived', isRevised: true }
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid batch status for editing.' }, { status: 400 });

  } catch (error) {
    console.error('Submission update failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update submission' }, { status: 500 });
  }
}

