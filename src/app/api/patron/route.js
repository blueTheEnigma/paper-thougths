import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

const LEAVE_BUNDLES = {
  50: 500,
  100: 1000,
  200: 2000,
  500: 5000,
  1000: 10000,
};

/**
 * Derive a literary Patron Honor Tier from total value contributed without
 * publicly exposing raw Naira or Leave figures on the Wall of Patrons.
 */
function resolvePatronTier(nairaAmount = 0, leavesAmount = 0) {
  const effectiveValue = Math.max(Number(nairaAmount) || 0, (Number(leavesAmount) || 0) * 100);
  if (effectiveValue >= 50000) return { label: 'Founding Benefactor', badge: '👑' };
  if (effectiveValue >= 15000) return { label: 'Sanctuary Guardian', badge: '🏛️' };
  if (effectiveValue >= 5000) return { label: 'Hearth Keeper', badge: '🕯️' };
  return { label: 'Kindred Patron', badge: '🌿' };
}

/**
 * Build aggregated Literary Fund totals and masked Wall of Patrons entries.
 */
async function getPatronSummary(dbUser = null) {
  const stats = await Database.queryOne(`
    SELECT
      COALESCE(SUM(naira_amount), 0) AS total_naira,
      COALESCE(SUM(leaves_amount), 0) AS total_leaves,
      COUNT(*)::int AS total_contributions,
      COUNT(DISTINCT COALESCE(user_id::text, LOWER(NULLIF(TRIM(donor_email), '')), 'anon-' || id::text))::int AS patron_count
    FROM patron_contributions
  `);

  const recentRows = await Database.query(`
    SELECT
      pc.id,
      pc.user_id,
      pc.donor_name,
      pc.contribution_type,
      pc.naira_amount,
      pc.leaves_amount,
      pc.note,
      pc.is_anonymous,
      pc.created_at
    FROM patron_contributions pc
    ORDER BY pc.created_at DESC
    LIMIT 24
  `);

  const wallOfPatrons = recentRows.map((row) => {
    const tier = resolvePatronTier(row.naira_amount, row.leaves_amount);
    return {
      id: row.id,
      displayName: row.is_anonymous ? 'Anonymous Patron' : row.donor_name,
      isAnonymous: Boolean(row.is_anonymous),
      isMember: Boolean(row.user_id),
      tierLabel: tier.label,
      tierBadge: tier.badge,
      contributionType: row.contribution_type,
      note: row.note ? row.note.trim() : null,
      createdAt: row.created_at,
    };
  });

  let userSummary = null;
  if (dbUser) {
    const freshUser = await Database.queryOne(
      'SELECT id, full_name, email, spendable_leaves, is_patron FROM users WHERE id = $1',
      [dbUser.id]
    );
    const myHistory = await Database.query(`
      SELECT id, contribution_type, naira_amount, leaves_amount, note, is_anonymous, created_at
      FROM patron_contributions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [dbUser.id]);

    userSummary = {
      id: freshUser?.id || dbUser.id,
      name: freshUser?.full_name || dbUser.full_name || 'Member',
      email: freshUser?.email || dbUser.email,
      spendableLeaves: parseInt(freshUser?.spendable_leaves ?? dbUser.spendable_leaves ?? 0, 10),
      isPatron: Boolean(freshUser?.is_patron ?? dbUser.is_patron),
      contributions: myHistory.map((h) => ({
        id: h.id,
        contributionType: h.contribution_type,
        nairaAmount: parseInt(h.naira_amount || 0, 10),
        leavesAmount: parseInt(h.leaves_amount || 0, 10),
        note: h.note || null,
        isAnonymous: Boolean(h.is_anonymous),
        createdAt: h.created_at,
      })),
    };
  }

  return {
    stats: {
      totalNaira: parseInt(stats?.total_naira || 0, 10),
      totalLeaves: parseInt(stats?.total_leaves || 0, 10),
      totalContributions: parseInt(stats?.total_contributions || 0, 10),
      patronCount: parseInt(stats?.patron_count || 0, 10),
    },
    wallOfPatrons,
    user: userSummary,
  };
}

/**
 * Verify a Paystack transaction server-side against PAYSTACK_SECRET_KEY.
 */
async function verifyPaystackTransaction(reference) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Paystack verification secret is not configured on the server.');
  }

  const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
  const res = await fetch(verifyUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: 'no-store',
  });

  const payload = await res.json();
  if (!res.ok || !payload.status || payload.data?.status !== 'success') {
    throw new Error(payload.message || 'Paystack payment verification failed.');
  }

  return payload.data;
}

export async function GET() {
  try {
    let dbUser = null;
    try {
      const user = await currentUser();
      if (user) {
        dbUser = await syncOrCreateUser(user);
      }
    } catch {
      // Public endpoint remains accessible when unauthenticated
    }

    const summary = await getPatronSummary(dbUser);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('Error fetching patronage summary:', error);
    return NextResponse.json({ success: false, error: 'Failed to load Literary Fund ledger.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      mode,
      reference,
      bundleAmount,
      leavesAmount,
      donorName,
      donorEmail,
      note,
      isAnonymous = false,
    } = body || {};

    let dbUser = null;
    try {
      const user = await currentUser();
      if (user) {
        dbUser = await syncOrCreateUser(user);
      }
    } catch {
      // Guests may contribute via Paystack modes
    }

    const cleanNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 320) : null;
    const cleanName = (typeof donorName === 'string' && donorName.trim())
      ? donorName.trim().slice(0, 120)
      : (dbUser?.full_name || 'Kindred Patron');
    const cleanEmail = (typeof donorEmail === 'string' && donorEmail.trim())
      ? donorEmail.trim().slice(0, 180)
      : (dbUser?.email || null);

    // Path 1: Logged-in member donating existing spendable Leaves
    if (mode === 'leaves_donation') {
      if (!dbUser) {
        return NextResponse.json({ success: false, error: 'Please sign in to donate from your Leaves balance.' }, { status: 401 });
      }

      const parsedLeaves = parseInt(leavesAmount, 10);
      if (!Number.isInteger(parsedLeaves) || parsedLeaves < 1) {
        return NextResponse.json({ success: false, error: 'Please enter a valid positive number of Leaves.' }, { status: 400 });
      }

      const txResult = await Database.transaction(async (client) => {
        const userRes = await client.query('SELECT id, spendable_leaves FROM users WHERE id = $1 FOR UPDATE', [dbUser.id]);
        const current = userRes.rows[0];
        if (!current) {
          throw new Error('Member account not found.');
        }

        const currentBalance = parseInt(current.spendable_leaves || 0, 10);
        if (currentBalance < parsedLeaves) {
          throw new Error(`Insufficient Leaves: you currently have ${currentBalance} Leaves.`);
        }

        await client.query(
          'UPDATE users SET spendable_leaves = spendable_leaves - $1, is_patron = TRUE WHERE id = $2',
          [parsedLeaves, dbUser.id]
        );

        await client.query(
          `INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
           VALUES ($1, $2, 'patron_donation', $3)`,
          [dbUser.id, -parsedLeaves, `Gifted ${parsedLeaves} Leaves to the Paper Thoughts Literary Fund`]
        );

        await client.query(
          `INSERT INTO patron_contributions (user_id, donor_name, donor_email, contribution_type, naira_amount, leaves_amount, note, is_anonymous)
           VALUES ($1, $2, $3, 'leaves_donation', 0, $4, $5, $6)`,
          [dbUser.id, cleanName, cleanEmail, parsedLeaves, cleanNote, Boolean(isAnonymous)]
        );

        return { newBalance: currentBalance - parsedLeaves };
      });

      const summary = await getPatronSummary(dbUser);
      return NextResponse.json({
        success: true,
        message: `Thank you! ${parsedLeaves} Leaves were gifted to the Paper Thoughts Literary Fund.`,
        newBalance: txResult.newBalance,
        ...summary,
      });
    }

    // Path 2 & 3: Paystack Cash Gift OR Buy & Donate Leaves Bundle
    if (mode !== 'cash_paystack' && mode !== 'leaves_purchase_donation') {
      return NextResponse.json({ success: false, error: 'Invalid patronage contribution mode.' }, { status: 400 });
    }

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing Paystack payment reference.' }, { status: 400 });
    }

    const payData = await verifyPaystackTransaction(reference);
    const paidNaira = Math.round(Number(payData.amount || 0) / 100);
    if (paidNaira < 100) {
      return NextResponse.json({ success: false, error: 'Verified payment amount is below the minimum contribution.' }, { status: 400 });
    }

    let creditedLeaves = 0;
    if (mode === 'leaves_purchase_donation') {
      const requestedBundle = parseInt(bundleAmount, 10);
      const expectedNaira = LEAVE_BUNDLES[requestedBundle];
      if (!expectedNaira || paidNaira < expectedNaira) {
        return NextResponse.json({
          success: false,
          error: 'Verified Paystack amount does not match the selected Leaves Patronage bundle.',
        }, { status: 400 });
      }
      creditedLeaves = requestedBundle;
    }

    const resolvedEmail = cleanEmail || payData.customer?.email || null;

    const result = await Database.transaction(async (client) => {
      const existing = await client.query(
        'SELECT id FROM patron_contributions WHERE paystack_reference = $1',
        [reference]
      );
      if (existing.rows.length > 0) {
        return { alreadyProcessed: true };
      }

      await client.query(
        `INSERT INTO patron_contributions
           (user_id, donor_name, donor_email, contribution_type, naira_amount, leaves_amount, note, is_anonymous, paystack_reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          dbUser?.id || null,
          cleanName,
          resolvedEmail,
          mode,
          paidNaira,
          creditedLeaves,
          cleanNote,
          Boolean(isAnonymous),
          reference,
        ]
      );

      if (dbUser?.id) {
        await client.query('UPDATE users SET is_patron = TRUE WHERE id = $1', [dbUser.id]);
      }

      return { alreadyProcessed: false };
    });

    const summary = await getPatronSummary(dbUser);
    return NextResponse.json({
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      message: mode === 'leaves_purchase_donation'
        ? `Thank you! You sponsored ${creditedLeaves} Leaves (₦${paidNaira.toLocaleString()}) for Paper Thoughts writers.`
        : `Thank you for gifting ₦${paidNaira.toLocaleString()} to the Paper Thoughts Literary Fund!`,
      ...summary,
    });
  } catch (error) {
    console.error('Error processing patronage contribution:', error);
    const status = error.message?.includes('Insufficient') || error.message?.includes('verification') ? 400 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Could not process patronage contribution.' },
      { status }
    );
  }
}
