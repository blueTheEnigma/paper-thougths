import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const BUNDLE_MAPPING = {
  50: 500,
  100: 1000,
  200: 2000,
  500: 5000
};

export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const body = await req.json();
    const { reference, bundleAmount, price } = body;

    if (!reference || !bundleAmount || !price) {
      return NextResponse.json({ success: false, error: 'Missing required parameters.' }, { status: 400 });
    }

    const leaves = parseInt(bundleAmount, 10);
    const cost = parseInt(price, 10);

    // Validate bundle mapping
    if (!BUNDLE_MAPPING[leaves] || BUNDLE_MAPPING[leaves] !== cost) {
      return NextResponse.json({ success: false, error: 'Invalid bundle amount or price.' }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ success: false, error: 'Paystack is not configured on the server.' }, { status: 500 });
    }

    // 1. Verify transaction with Paystack API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paystackRes.ok) {
      const errText = await paystackRes.text();
      console.error('Paystack verification request failed for leaves:', errText);
      return NextResponse.json({ success: false, error: 'Failed to contact Paystack.' }, { status: 400 });
    }

    const paystackData = await paystackRes.json();
    
    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: 'Payment was not successful.' }, { status: 400 });
    }

    // Paystack amount is in kobo
    const expectedKobo = cost * 100;
    const actualKobo = paystackData.data.amount;
    
    if (Math.abs(actualKobo - expectedKobo) > 100) { // Allow 1 NGN leeway
      return NextResponse.json({ success: false, error: 'Payment amount mismatch.' }, { status: 400 });
    }

    // 2. Perform DB operations inside a transaction
    const result = await Database.transaction(async (client) => {
      // Fetch fresh stats to check milestones
      const userStatsRes = await client.query(`
        SELECT spendable_leaves, lifetime_leaves, book_vouchers_gifted FROM users WHERE id = $1
      `, [dbUser.id]);
      const userStats = userStatsRes.rows[0];

      const newSpendableLeaves = (userStats.spendable_leaves || 0) + leaves;
      const newLifetimeLeaves = (userStats.lifetime_leaves || 0) + leaves;

      // Check for hidden 500-leaves milestone gift
      const totalMilestonesEarned = Math.floor(newLifetimeLeaves / 500);
      const originalMilestonesEarned = userStats.book_vouchers_gifted || 0;
      let vouchersEarned = userStats.book_vouchers_gifted || 0;
      let milestoneTriggered = false;
      
      if (totalMilestonesEarned > originalMilestonesEarned) {
        vouchersEarned = totalMilestonesEarned;
        milestoneTriggered = true;
      }

      // Update user details
      await client.query(`
        UPDATE users 
        SET spendable_leaves = $1,
            lifetime_leaves = $2,
            book_vouchers_gifted = $3
        WHERE id = $4
      `, [newSpendableLeaves, newLifetimeLeaves, vouchersEarned, dbUser.id]);

      // Log transaction to leaf_transactions
      await client.query(`
        INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
        VALUES ($1, $2, 'purchase', $3)
      `, [dbUser.id, leaves, `Purchased ${leaves} leaves bundle`]);

      return {
        spendableLeaves: newSpendableLeaves,
        milestoneTriggered
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${leaves} Paper Leaves!`,
      spendableLeaves: result.spendableLeaves,
      milestoneTriggered: result.milestoneTriggered
    });

  } catch (error) {
    console.error('Leaves bundle purchase verification failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 });
  }
}
