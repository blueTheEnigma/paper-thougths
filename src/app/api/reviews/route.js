import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

// Word counter helper
function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

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
    const { submissionId, pacingRating, strengthsArray, mirrorResponse, highwaterResponse, pivotResponse } = body;

    // Validate fields
    if (!submissionId || !pacingRating || !strengthsArray || !mirrorResponse || !highwaterResponse || !pivotResponse) {
      return NextResponse.json({ success: false, error: 'All review fields are required.' }, { status: 400 });
    }

    // Enforce 30-word limit on open-ended text fields
    const mirrorWordCount = countWords(mirrorResponse);
    const highwaterWordCount = countWords(highwaterResponse);
    const pivotWordCount = countWords(pivotResponse);

    if (mirrorWordCount < 30 || highwaterWordCount < 30 || pivotWordCount < 30) {
      return NextResponse.json({ 
        success: false, 
        error: `Critique rejected: All open-ended fields must contain at least 30 words. (Perception: ${mirrorWordCount} words, Climax: ${highwaterWordCount} words, Constructive Feedback: ${pivotWordCount} words)` 
      }, { status: 400 });
    }

    // Ensure the submission exists and is currently in the active batch
    const submission = await Database.queryOne(`
      SELECT id, author_id FROM submissions 
      WHERE id = $1 AND batch_status = 'active_batch'
    `, [submissionId]);

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found or not in active review pool.' }, { status: 404 });
    }

    if (submission.author_id === dbUser.id) {
      return NextResponse.json({ success: false, error: 'Review rejected: You cannot critique your own story.' }, { status: 400 });
    }

    // Calculate current batch cycle start (Saturday 12:00 AM)
    const lastSaturday = getLastSaturdayStart();
    const now = new Date();

    // Query reviews count in this batch cycle for this user
    const userReviewsThisWeek = await Database.queryOne(`
      SELECT COUNT(*) as count 
      FROM peer_reviews 
      WHERE reviewer_id = $1 AND created_at >= $2
    `, [dbUser.id, lastSaturday]);

    const reviewCount = parseInt(userReviewsThisWeek?.count || 0);
    const isRewarded = (reviewCount < 3);

    // Check if within Early-Bird Window (Saturday 12:00 AM to Sunday 12:00 AM)
    const earlyBirdLimit = new Date(lastSaturday.getTime() + 24 * 60 * 60 * 1000);
    const isEarlyBird = now >= lastSaturday && now < earlyBirdLimit;

    // Create the review and update rewards in a transaction
    const result = await Database.transaction(async (client) => {
      // 1. Insert review record
      const reviewRes = await client.query(`
        INSERT INTO peer_reviews (submission_id, reviewer_id, pacing_rating, strengths_array, mirror_response, highwater_response, pivot_response, is_early_bird)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, is_early_bird, created_at
      `, [submissionId, dbUser.id, pacingRating, strengthsArray, mirrorResponse, highwaterResponse, pivotResponse, isEarlyBird]);
      const newReview = reviewRes.rows[0];

      let tokensRewarded = 0.0;
      let leavesRewarded = 0;
      let milestoneTriggered = false;

      if (isRewarded) {
        // Calculate reward payouts
        tokensRewarded = isEarlyBird ? 1.5 : 1.0;
        leavesRewarded = isEarlyBird ? 15 : 10;

        // Fetch user leaves stats to check milestones
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
          VALUES ($1, $2, 'review', $3)
        `, [dbUser.id, leavesRewarded, `Earned ${leavesRewarded} leaves for critique of submission #${submissionId}`]);
      }

      return {
        newReview,
        tokensRewarded,
        leavesRewarded,
        milestoneTriggered
      };
    });

    return NextResponse.json({
      success: true,
      message: isRewarded 
        ? `Critique submitted successfully! Rewarded ${result.tokensRewarded} Milestone Tokens and ${result.leavesRewarded} Paper Leaves.`
        : 'Critique submitted successfully! You have already completed 3 rewarded reviews this week, so this critique was recorded without adding extra tokens.',
      rewarded: isRewarded,
      earlyBird: isEarlyBird,
      tokensEarned: result.tokensRewarded,
      leavesEarned: result.leavesRewarded,
      milestoneTriggered: result.milestoneTriggered,
      review: result.newReview
    });

  } catch (error) {
    console.error('Review submission failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
