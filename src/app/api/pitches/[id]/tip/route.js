import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import Database from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User synchronization failed' }, { status: 500 });
    }

    const resolvedParams = await params;
    const pitchId = parseInt(resolvedParams.id, 10);
    if (isNaN(pitchId)) {
      return NextResponse.json({ success: false, error: 'Invalid pitch ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const tipAmount = parseInt(body.amount, 10);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Tip amount must be at least 1 leaf' }, { status: 400 });
    }

    const result = await Database.transaction(async (client) => {
      // 1. Fetch current tipper balance with row lock
      const userRes = await client.query('SELECT spendable_leaves FROM users WHERE id = $1 FOR UPDATE', [dbUser.id]);
      const currentSpendable = parseInt(userRes.rows[0]?.spendable_leaves || 0, 10);

      if (currentSpendable < tipAmount) {
        throw new Error(`Insufficient balance: You have ${currentSpendable} Paper Leaves, but tried to tip ${tipAmount}.`);
      }

      // 2. Fetch pitch author
      const pitchRes = await client.query('SELECT user_id, book_title FROM book_pitches WHERE id = $1', [pitchId]);
      if (pitchRes.rows.length === 0) {
        throw new Error('Pitch not found');
      }
      const authorId = pitchRes.rows[0].user_id;
      const bookTitle = pitchRes.rows[0].book_title;

      if (authorId === dbUser.id) {
        throw new Error('You cannot tip leaves to your own book pitch!');
      }

      // 3. Transfer leaves directly from reader to author
      await client.query('UPDATE users SET spendable_leaves = spendable_leaves - $1 WHERE id = $2', [tipAmount, dbUser.id]);
      await client.query('UPDATE users SET spendable_leaves = spendable_leaves + $1, lifetime_leaves = lifetime_leaves + $1 WHERE id = $2', [tipAmount, authorId]);

      return {
        tippedAmount: tipAmount,
        newBalance: currentSpendable - tipAmount,
        bookTitle
      };
    });

    return NextResponse.json({
      success: true,
      tippedAmount: result.tippedAmount,
      newBalance: result.newBalance,
      message: `Gifted ${result.tippedAmount} Paper Leaves 🍃 for "${result.bookTitle}"!`
    });
  } catch (error) {
    console.error('Error tipping leaves on pitch:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to tip leaves' }, { status: 400 });
  }
}
