import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

// Saturday 12:00 AM batch cycle start calculator
function getLastSaturdayStart() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) {
    daysSinceSaturday += 7;
  }
  
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - daysSinceSaturday);
  lastSaturday.setHours(0, 0, 0, 0);
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
    const { title, genre, logline, bodyText } = body;

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

    // Insert new submission into PostgreSQL
    // Status is 'queued' by default, waiting for the Saturday 12:00 AM cron to set it to 'active_batch'
    const newSubmission = await Database.queryOne(`
      INSERT INTO submissions (author_id, title, genre, logline, body_text, batch_status)
      VALUES ($1, $2, $3, $4, $5, 'queued')
      RETURNING id, title, genre, batch_status
    `, [dbUser.id, title, genre, logline, bodyText]);

    // Update user's last_submission_date
    await Database.query(`
      UPDATE users 
      SET last_submission_date = CURRENT_DATE 
      WHERE id = $1
    `, [dbUser.id]);

    // Calculate current batch cycle start (Saturday 12:00 AM)
    const lastSaturday = getLastSaturdayStart();

    // Query submissions count in this batch cycle for this user (excluding the new one to check if this was the first)
    const userSubmissionsThisWeek = await Database.queryOne(`
      SELECT COUNT(*) as count 
      FROM submissions 
      WHERE author_id = $1 AND created_at >= $2 AND id != $3
    `, [dbUser.id, lastSaturday, newSubmission.id]);

    const submissionCount = parseInt(userSubmissionsThisWeek?.count || 0);
    const isFirstSubmissionThisWeek = (submissionCount === 0);

    let tokensRewarded = 0.0;
    let leavesRewarded = 0;
    let milestoneTriggered = false;

    if (isFirstSubmissionThisWeek) {
      tokensRewarded = 1.0;
      leavesRewarded = 0;

      const newTotalLeaves = (dbUser.spendable_leaves || 0) + leavesRewarded;
      const newLifetimeLeaves = (dbUser.lifetime_leaves || 0) + leavesRewarded;

      // Check for hidden 500-leaves milestone gift
      const totalMilestonesEarned = Math.floor(newLifetimeLeaves / 500);
      const originalMilestonesEarned = dbUser.book_vouchers_gifted || 0;
      let vouchersEarned = dbUser.book_vouchers_gifted || 0;
      
      if (totalMilestonesEarned > originalMilestonesEarned) {
        vouchersEarned = totalMilestonesEarned;
        milestoneTriggered = true;
      }

      // Update rewards inside database
      await Database.query(`
        UPDATE users 
        SET milestone_tokens = milestone_tokens + $1,
            spendable_leaves = spendable_leaves + $2,
            lifetime_leaves = lifetime_leaves + $2,
            book_vouchers_gifted = $3
        WHERE id = $4
      `, [tokensRewarded, leavesRewarded, vouchersEarned, dbUser.id]);
    }

    return NextResponse.json({ 
      success: true, 
      message: isFirstSubmissionThisWeek
        ? `Submission successfully uploaded and queued. Rewarded ${tokensRewarded} Milestone Tokens and ${leavesRewarded} Paper Leaves!`
        : 'Submission successfully uploaded and queued.',
      rewarded: isFirstSubmissionThisWeek,
      tokensEarned: tokensRewarded,
      leavesEarned: leavesRewarded,
      milestoneTriggered,
      submission: newSubmission
    });
  } catch (error) {
    console.error('Submission creation failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit' }, { status: 500 });
  }
}

// 2. Fetch the Double-Blind Selection Queue
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
      const submission = await Database.queryOne(`
        SELECT id, title, genre, logline, body_text 
        FROM submissions
        WHERE id = $1 AND batch_status = 'active_batch' AND author_id != $2
      `, [subId, dbUser.id]);

      if (!submission) {
        return NextResponse.json({ success: false, error: 'Submission not found or unauthorized.' }, { status: 404 });
      }

      return NextResponse.json({ success: true, submission });
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
