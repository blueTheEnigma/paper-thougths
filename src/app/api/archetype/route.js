import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Database } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { archetype } = body;

    if (!archetype) {
      return NextResponse.json({ success: false, error: 'Archetype is required' }, { status: 400 });
    }

    const validArchetypes = ['mood', 'marathon', 'tsundoku', 'completist', 'mourner', 'annotator', 'juggler'];
    if (!validArchetypes.includes(archetype)) {
      return NextResponse.json({ success: false, error: 'Invalid archetype' }, { status: 400 });
    }

    const result = await Database.transaction(async (client) => {
      // 1. Fetch user to check current archetype and leaves
      const userRes = await client.query(`
        SELECT reader_archetype, spendable_leaves, lifetime_leaves 
        FROM users 
        WHERE id = $1
      `, [userId]);

      const user = userRes.rows[0];
      if (!user) {
        throw new Error('User not found');
      }

      const isFirstTime = !user.reader_archetype;
      let newLeaves = parseInt(user.spendable_leaves || 0);
      let newLifetime = parseInt(user.lifetime_leaves || 0);
      let rewarded = false;

      if (isFirstTime) {
        newLeaves += 10;
        newLifetime += 10;
        rewarded = true;

        // Update archetype and add leaves
        await client.query(`
          UPDATE users 
          SET reader_archetype = $1, 
              spendable_leaves = $2, 
              lifetime_leaves = $3
          WHERE id = $4
        `, [archetype, newLeaves, newLifetime, userId]);

        // Insert ledger transaction record
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, $2, $3, $4)
        `, [userId, 10, 'archetype_quiz', 'Earned 10 leaves for completing the Reader Archetype Quiz']);
      } else {
        // Just update archetype
        await client.query(`
          UPDATE users 
          SET reader_archetype = $1
          WHERE id = $2
        `, [archetype, userId]);
      }

      return { rewarded, newLeaves };
    });

    return NextResponse.json({
      success: true,
      archetype,
      rewarded: result.rewarded,
      newLeaves: result.newLeaves,
      message: result.rewarded 
        ? 'Archetype saved! You earned +10 Paper Leaves.' 
        : 'Archetype updated!'
    });

  } catch (error) {
    console.error('Archetype POST API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const archetype = searchParams.get('archetype');

    if (!archetype) {
      return NextResponse.json({ success: false, error: 'Archetype is required' }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    let queryText = `
      SELECT u.full_name as "name", u.lk_id as "lkid", c.name as "chapter"
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE u.reader_archetype = $1
    `;
    const params = [archetype];

    if (userId) {
      queryText += ` AND u.id != $2`;
      params.push(userId);
    }

    queryText += ` ORDER BY RANDOM() LIMIT 4`;
    const soulmates = await Database.query(queryText, params);

    return NextResponse.json({ success: true, soulmates });
  } catch (error) {
    console.error('Archetype GET API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
