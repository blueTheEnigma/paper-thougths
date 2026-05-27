import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    // Query transaction ledger
    const transactions = await Database.query(`
      SELECT id, amount, transaction_type as type, description, created_at as date
      FROM leaf_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [dbUser.id]);

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: parseInt(t.amount, 10),
        type: t.type,
        description: t.description,
        date: t.date ? new Date(t.date).toISOString() : new Date().toISOString()
      }))
    });

  } catch (error) {
    console.error('Failed to fetch leaf transactions:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to load ledger history' }, { status: 500 });
  }
}
