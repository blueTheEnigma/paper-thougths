import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/submissions/[id]/tip
 * Transfer spendable Paper Leaves from the reader to the manuscript's author
 * inside The Living Salon, logging both leaf_transactions and submission_tips.
 */
export async function POST(req, context) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please sign in to tip authors.' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(user);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Member profile not found.' }, { status: 404 });
    }

    const resolvedParams = await context.params;
    const submissionId = parseInt(resolvedParams?.id, 10);
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID.' }, { status: 400 });
    }

    const body = await req.json();
    const rawAmount = body?.tipAmount ?? body?.amount;
    const tipAmount = parseInt(rawAmount, 10);
    const cleanNote = typeof body?.note === 'string' && body.note.trim()
      ? body.note.trim().slice(0, 280)
      : null;

    if (!Number.isInteger(tipAmount) || tipAmount < 1) {
      return NextResponse.json({ success: false, error: 'Tip amount must be a whole number of at least 1 Leaf.' }, { status: 400 });
    }

    const txResult = await Database.transaction(async (client) => {
      const subRes = await client.query(
        `SELECT id, author_id, title, batch_status
         FROM submissions
         WHERE id = $1`,
        [submissionId]
      );
      const submission = subRes.rows[0];
      if (!submission) {
        throw new Error('NOT_FOUND:Submission not found.');
      }

      const authorId = submission.author_id;
      if (authorId === dbUser.id) {
        throw new Error('SELF_TIP:You cannot tip your own manuscript.');
      }

      // Lock rows in deterministic user ID order to avoid deadlocks
      const firstLockId = Math.min(dbUser.id, authorId);
      const secondLockId = Math.max(dbUser.id, authorId);
      const lockedUsersRes = await client.query(
        `SELECT id, full_name, spendable_leaves, lifetime_leaves, book_vouchers_gifted
         FROM users
         WHERE id IN ($1, $2)
         ORDER BY id ASC
         FOR UPDATE`,
        [firstLockId, secondLockId]
      );

      const sender = lockedUsersRes.rows.find((u) => u.id === dbUser.id);
      const author = lockedUsersRes.rows.find((u) => u.id === authorId);
      if (!sender || !author) {
        throw new Error('NOT_FOUND:Author or reader account could not be resolved.');
      }

      const senderBalance = parseInt(sender.spendable_leaves || 0, 10);
      if (senderBalance < tipAmount) {
        throw new Error(`INSUFFICIENT:Insufficient Paper Leaves (you have ${senderBalance} 🍂).`);
      }

      const oldAuthorLifetime = parseInt(author.lifetime_leaves || 0, 10);
      const newAuthorLifetime = oldAuthorLifetime + tipAmount;
      const vouchersAwarded = Math.max(
        0,
        Math.floor(newAuthorLifetime / 500) - Math.floor(oldAuthorLifetime / 500)
      );

      await client.query(
        'UPDATE users SET spendable_leaves = spendable_leaves - $1 WHERE id = $2',
        [tipAmount, dbUser.id]
      );

      await client.query(
        `UPDATE users
         SET spendable_leaves = spendable_leaves + $1,
             lifetime_leaves = lifetime_leaves + $1,
             book_vouchers_gifted = COALESCE(book_vouchers_gifted, 0) + $2
         WHERE id = $3`,
        [tipAmount, vouchersAwarded, authorId]
      );

      const pieceLabel = submission.title || 'Living Salon manuscript';
      await client.query(
        `INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
         VALUES ($1, $2, 'tip_sent', $3)`,
        [dbUser.id, -tipAmount, `Tipped ${tipAmount} Leaves on "${pieceLabel}" in The Living Salon`]
      );

      await client.query(
        `INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
         VALUES ($1, $2, 'tip_received', $3)`,
        [authorId, tipAmount, `Received ${tipAmount} Leaves Salon tip on "${pieceLabel}"`]
      );

      await client.query(
        `INSERT INTO submission_tips (submission_id, sender_id, recipient_id, amount, source, note)
         VALUES ($1, $2, $3, $4, 'salon', $5)`,
        [submissionId, dbUser.id, authorId, tipAmount, cleanNote]
      );

      const sumRes = await client.query(
        'SELECT COALESCE(SUM(amount), 0)::int AS total FROM submission_tips WHERE submission_id = $1',
        [submissionId]
      );

      return {
        newBalance: senderBalance - tipAmount,
        totalTips: parseInt(sumRes.rows[0]?.total || tipAmount, 10),
        vouchersAwarded,
        authorName: author.full_name || 'the author',
      };
    });

    return NextResponse.json({
      success: true,
      tipAmount,
      newBalance: txResult.newBalance,
      totalTips: txResult.totalTips,
      tipsReceived: txResult.totalTips,
      submissionTotalTips: txResult.totalTips,
      vouchersAwarded: txResult.vouchersAwarded,
      message: `Tipped ${tipAmount} 🍂 Leaves to ${txResult.authorName}!`,
    });
  } catch (error) {
    const rawMsg = error.message || 'Failed to process tip.';
    if (rawMsg.startsWith('NOT_FOUND:')) {
      return NextResponse.json({ success: false, error: rawMsg.replace('NOT_FOUND:', '') }, { status: 404 });
    }
    if (rawMsg.startsWith('SELF_TIP:') || rawMsg.startsWith('INSUFFICIENT:')) {
      return NextResponse.json({ success: false, error: rawMsg.split(':').slice(1).join(':') }, { status: 400 });
    }
    console.error('Error tipping submission in Salon:', error);
    return NextResponse.json({ success: false, error: 'Failed to transfer tip.' }, { status: 500 });
  }
}
