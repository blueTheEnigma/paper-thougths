import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import Database from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Please sign in to tip the author.' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User synchronization failed' }, { status: 500 });
    }

    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const tipAmount = parseInt(body.amount, 10);
    const patronNote = body.note && typeof body.note === 'string' ? body.note.trim().slice(0, 200) : null;

    if (isNaN(tipAmount) || tipAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Tip amount must be at least 1 Leaf' }, { status: 400 });
    }

    const result = await Database.transaction(async (client) => {
      // 1. Fetch current tipper balance with row lock
      const userRes = await client.query('SELECT spendable_leaves FROM users WHERE id = $1 FOR UPDATE', [dbUser.id]);
      const currentSpendable = parseInt(userRes.rows[0]?.spendable_leaves || 0, 10);

      if (currentSpendable < tipAmount) {
        throw new Error(`Insufficient balance: You have ${currentSpendable} Leaves, but tried to tip ${tipAmount}.`);
      }

      // 2. Fetch submission author
      const subRes = await client.query('SELECT author_id, title, pen_name FROM submissions WHERE id = $1', [submissionId]);
      if (subRes.rows.length === 0) {
        throw new Error('Manuscript not found');
      }
      const authorId = subRes.rows[0].author_id;
      const pieceTitle = subRes.rows[0].title;
      const authorPenName = subRes.rows[0].pen_name;

      if (authorId === dbUser.id) {
        throw new Error('You cannot tip Leaves to your own manuscript!');
      }

      if (!authorId) {
        throw new Error('This manuscript author cannot receive Leaves.');
      }

      // 3. Transfer leaves directly from reader to author
      await client.query('UPDATE users SET spendable_leaves = spendable_leaves - $1 WHERE id = $2', [tipAmount, dbUser.id]);
      await client.query('UPDATE users SET spendable_leaves = spendable_leaves + $1, lifetime_leaves = lifetime_leaves + $1 WHERE id = $2', [tipAmount, authorId]);

      // 4. Record transaction in leaf_transactions
      await client.query(`
        INSERT INTO leaf_transactions (user_id, amount, transaction_type, reference_type, reference_id, description)
        VALUES ($1, $2, 'spent', 'submission_tip', $3, $4)
      `, [dbUser.id, -tipAmount, submissionId, `Tipped ${tipAmount} Leaves for "${pieceTitle}"`]);

      await client.query(`
        INSERT INTO leaf_transactions (user_id, amount, transaction_type, reference_type, reference_id, description)
        VALUES ($1, $2, 'earned', 'submission_tip', $3, $4)
      `, [authorId, tipAmount, submissionId, `Received ${tipAmount} Leaves tip from ${dbUser.full_name || 'a Reader'} for "${pieceTitle}"`]);

      // 5. If patron note provided, also add as a comment
      if (patronNote) {
        await client.query(`
          INSERT INTO submission_comments (submission_id, user_id, pen_name, content)
          VALUES ($1, $2, $3, $4)
        `, [submissionId, dbUser.id, dbUser.full_name, `🍂 Tipped ${tipAmount} Leaves: "${patronNote}"`]);
      }

      return {
        tippedAmount: tipAmount,
        newBalance: currentSpendable - tipAmount,
        pieceTitle,
        authorPenName
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully tipped ${result.tippedAmount} Leaves to the author of "${result.pieceTitle}"!`,
      ...result
    });
  } catch (error) {
    console.error('Failed to process tip:', error);
    return NextResponse.json({ success: false, error: error.message || 'Tipping failed.' }, { status: 400 });
  }
}

