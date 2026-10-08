import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json({ success: false, error: 'Invalid review ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { isHelpful } = body;
    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid payload: isHelpful must be a boolean.' }, { status: 400 });
    }

    // 1. Fetch review, submission, and author details
    const reviewData = await Database.queryOne(`
      SELECT r.id, r.reviewer_id, r.submission_id, r.is_helpful,
             s.author_id, s.title as "submissionTitle"
      FROM peer_reviews r
      JOIN submissions s ON s.id = r.submission_id
      WHERE r.id = $1
    `, [reviewId]);

    if (!reviewData) {
      return NextResponse.json({ success: false, error: 'Review not found.' }, { status: 404 });
    }

    // 2. Author verification: Only the author of the manuscript can evaluate this critique
    if (reviewData.author_id !== dbUser.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only the author of this manuscript can evaluate this critique.' 
      }, { status: 403 });
    }

    // 3. Prevent self-evaluation
    if (reviewData.reviewer_id === dbUser.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'You cannot evaluate your own critique.' 
      }, { status: 400 });
    }

    // 4. Ensure review has not already been evaluated
    if (reviewData.is_helpful !== null) {
      return NextResponse.json({ 
        success: false, 
        error: 'This critique has already been evaluated and cannot be changed.' 
      }, { status: 400 });
    }

    // 5. Execute state update and reward payout inside a transaction
    const result = await Database.transaction(async (client) => {
      // A. Update review evaluation state
      await client.query(`
        UPDATE peer_reviews 
        SET is_helpful = $1, helpful_reviewed_at = NOW()
        WHERE id = $2
      `, [isHelpful, reviewId]);

      let leavesAwarded = 0;
      let voucherTriggered = false;

      // B. If confirmed helpful, reward +10 leaves to the reviewer from community treasury
      if (isHelpful && reviewData.reviewer_id) {
        leavesAwarded = 10;

        // Fetch reviewer stats to check voucher milestones
        const reviewerStatsRes = await client.query(`
          SELECT lifetime_leaves, book_vouchers_gifted FROM users WHERE id = $1
        `, [reviewData.reviewer_id]);
        const reviewerStats = reviewerStatsRes.rows[0];

        const newLifetime = (reviewerStats?.lifetime_leaves || 0) + 10;
        const totalVouchersEarned = Math.floor(newLifetime / 500);
        const originalVouchers = reviewerStats?.book_vouchers_gifted || 0;
        let vouchersCount = originalVouchers;

        if (totalVouchersEarned > originalVouchers) {
          vouchersCount = totalVouchersEarned;
          voucherTriggered = true;
        }

        // Award leaves to reviewer
        await client.query(`
          UPDATE users 
          SET spendable_leaves = spendable_leaves + 10,
              lifetime_leaves = lifetime_leaves + 10,
              book_vouchers_gifted = $1
          WHERE id = $2
        `, [vouchersCount, reviewData.reviewer_id]);

        // Log transaction in leaf_transactions
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, 10, 'helpful_critique', $2)
        `, [
          reviewData.reviewer_id, 
          `Author confirmed helpful critique for submission #${reviewData.submission_id} ("${reviewData.submissionTitle || 'Manuscript'}")`
        ]);

        // Insert notification into user_notifications for the reviewer
        await client.query(`
          INSERT INTO user_notifications (user_id, type, title, body, link, is_read, created_at)
          VALUES ($1, 'review_helpful', $2, $3, $4, FALSE, NOW())
        `, [
          reviewData.reviewer_id,
          'Critique Marked Genuinely Helpful! 🍃',
          `Your critique on manuscript "${reviewData.submissionTitle || 'Submission'}" was confirmed as Genuinely Helpful. +10 Leaves awarded from the Community Treasury!`,
          '/dashboard'
        ]);
      }

      return {
        leavesAwarded,
        voucherTriggered
      };
    });

    return NextResponse.json({
      success: true,
      reviewId,
      isHelpful,
      leavesAwarded: result.leavesAwarded,
      message: isHelpful
        ? `Critique confirmed as Genuinely Helpful! Rewarded +10 Leaves to the reviewer from the clubhouse treasury at zero cost to you.`
        : `Critique recorded as Not Helpful.`
    });

  } catch (error) {
    console.error('Failed to submit critique evaluation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to submit critique evaluation.' 
    }, { status: 500 });
  }
}
