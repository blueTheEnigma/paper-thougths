import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

// 1. Donate Paper Leaves to Chapter Pool
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
    const donationAmount = parseInt(body.donationAmount);

    if (isNaN(donationAmount) || donationAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Please enter a valid positive donation amount.' }, { status: 400 });
    }

    if (dbUser.spendable_leaves < donationAmount) {
      return NextResponse.json({ success: false, error: `Insufficient balance: You only have ${dbUser.spendable_leaves} Paper Leaves.` }, { status: 400 });
    }

    if (!dbUser.chapter_id) {
      return NextResponse.json({ success: false, error: 'Please select a chapter on your profile before donating to chapter pools.' }, { status: 400 });
    }

    const result = await Database.transaction(async (client) => {
      // 1. Deduct leaves from user
      await client.query(`
        UPDATE users 
        SET spendable_leaves = spendable_leaves - $1 
        WHERE id = $2
      `, [donationAmount, dbUser.id]);

      // 1b. Log to leaf_transactions ledger
      await client.query(`
        INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
        VALUES ($1, $2, 'chapter_pool_donation', $3)
      `, [dbUser.id, -donationAmount, `Donated ${donationAmount} leaves to chapter pool`]);

      // 2. Fetch current chapter pool details
      const pool = await client.queryOne(`
        SELECT id, current_leaves_balance, target_leaves_limit 
        FROM chapter_pools 
        WHERE chapter_id = $1
      `, [dbUser.chapter_id]);

      if (!pool) {
        throw new Error('Chapter pool not initialized.');
      }

      const newBalance = pool.current_leaves_balance + donationAmount;
      const target = pool.target_leaves_limit || 500;
      
      const vouchersGenerated = Math.floor(newBalance / target);
      const remainingBalance = newBalance % target;

      // 3. Update chapter pool balance
      await client.query(`
        UPDATE chapter_pools 
        SET current_leaves_balance = $1 
        WHERE id = $2
      `, [remainingBalance, pool.id]);

      return {
        donationAmount,
        vouchersGenerated,
        remainingBalance,
        totalPooledContribution: newBalance
      };
    });

    return NextResponse.json({
      success: true,
      message: result.vouchersGenerated > 0
        ? `Donated ${donationAmount} Leaves! The pool crossed 500 leaves and generated ${result.vouchersGenerated} book voucher(s) for the chapter!`
        : `Successfully donated ${donationAmount} Leaves to your chapter pool. Thank you for paying it forward!`,
      data: result
    });

  } catch (error) {
    console.error('Donation failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process donation' }, { status: 500 });
  }
}

// 2. GET current user's chapter pool status
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

    if (!dbUser.chapter_id) {
      return NextResponse.json({ success: true, pool: null });
    }

    const pool = await Database.queryOne(`
      SELECT cp.current_leaves_balance, cp.target_leaves_limit, c.name as chapter_name
      FROM chapter_pools cp
      JOIN chapters c ON c.id = cp.chapter_id
      WHERE cp.chapter_id = $1
    `, [dbUser.chapter_id]);

    return NextResponse.json({
      success: true,
      pool: pool || null
    });
  } catch (error) {
    console.error('Failed to fetch pool status:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch pool' }, { status: 500 });
  }
}
