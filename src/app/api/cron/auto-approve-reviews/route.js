import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Auto-Approve Unrated Peer Reviews Cron Endpoint
 * Any review pending author feedback after 8 days automatically passes,
 * rewarding +10 leaves to the reviewer from the clubhouse treasury.
 */
export async function POST(request) {
  try {
    const expiredReviews = await Database.query(`
      SELECT pr.id, pr.reviewer_id, pr.submission_id, s.title as "submissionTitle"
      FROM peer_reviews pr
      LEFT JOIN submissions s ON s.id = pr.submission_id
      WHERE pr.is_helpful IS NULL 
        AND pr.created_at < NOW() - INTERVAL '8 days'
    `);

    if (expiredReviews.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No reviews awaiting auto-approval.',
        approvedCount: 0 
      });
    }

    let approvedCount = 0;

    for (const rev of expiredReviews) {
      await Database.transaction(async (client) => {
        // 1. Mark review as auto-approved
        await client.query(`
          UPDATE peer_reviews 
          SET is_helpful = TRUE, 
              helpful_reviewed_at = NOW(), 
              helpful_auto_approved = TRUE 
          WHERE id = $1
        `, [rev.id]);

        if (rev.reviewer_id) {
          // 2. Fetch reviewer stats to check voucher milestones
          const reviewerStatsRes = await client.query(`
            SELECT lifetime_leaves, book_vouchers_gifted FROM users WHERE id = $1
          `, [rev.reviewer_id]);
          const reviewerStats = reviewerStatsRes.rows[0];

          const newLifetime = (reviewerStats?.lifetime_leaves || 0) + 10;
          const totalVouchersEarned = Math.floor(newLifetime / 500);
          const originalVouchers = reviewerStats?.book_vouchers_gifted || 0;
          let vouchersCount = originalVouchers;

          if (totalVouchersEarned > originalVouchers) {
            vouchersCount = totalVouchersEarned;
          }

          // 3. Award +10 leaves
          await client.query(`
            UPDATE users 
            SET spendable_leaves = spendable_leaves + 10,
                lifetime_leaves = lifetime_leaves + 10,
                book_vouchers_gifted = $1
            WHERE id = $2
          `, [vouchersCount, rev.reviewer_id]);

          // 4. Log transaction
          await client.query(`
            INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
            VALUES ($1, 10, 'helpful_auto_approved', $2)
          `, [
            rev.reviewer_id,
            `Critique auto-approved after 8-day author window for submission #${rev.submission_id} ("${rev.submissionTitle || 'Manuscript'}")`
          ]);

          // 5. Send notification to reviewer
          await client.query(`
            INSERT INTO user_notifications (user_id, type, title, body, link, is_read, created_at)
            VALUES ($1, 'review_auto_approved', $2, $3, $4, FALSE, NOW())
          `, [
            rev.reviewer_id,
            'Critique Auto-Approved! 🌟 (+10 Leaves)',
            `Your critique on manuscript "${rev.submissionTitle || 'Submission'}" was automatically approved after 8 days. +10 Leaves awarded from the Clubhouse Treasury!`,
            '/dashboard'
          ]);
        }
      });

      approvedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully auto-approved ${approvedCount} review(s).`,
      approvedCount
    });

  } catch (error) {
    console.error('Auto-approval cron failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Auto-approval cron failed' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  return POST(request);
}
