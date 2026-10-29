import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import { ARCHETYPES } from '@/lib/archetypesData';
import { SIGNS } from '@/lib/zodiacData';

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

    const userId = dbUser.id;
    const body = await request.json();
    const { archetype, zodiacSign, scores } = body;

    if (!archetype && !zodiacSign) {
      return NextResponse.json({ success: false, error: 'Archetype or Zodiac Sign is required' }, { status: 400 });
    }

    // Determine normalized value to store in reader_archetype
    // Can be an archetype key (e.g. 'marathon', 'mood', 'researcher') or a zodiac sign key (e.g. 'Sage', 'Titan')
    let resolvedArchetype = null;
    const targetKey = (archetype || zodiacSign).toString().trim();
    const lowerKey = targetKey.toLowerCase();

    if (ARCHETYPES[lowerKey]) {
      resolvedArchetype = lowerKey;
    } else if (ARCHETYPES[targetKey]) {
      resolvedArchetype = targetKey;
    } else if (SIGNS[targetKey]) {
      resolvedArchetype = SIGNS[targetKey].name;
    } else {
      const signMatch = Object.values(SIGNS).find(s => s.name.toLowerCase() === lowerKey);
      if (signMatch) {
        resolvedArchetype = signMatch.name;
      } else {
        // Fallback to storing the clean provided string
        resolvedArchetype = targetKey;
      }
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

        // Update archetype and reward leaves
        await client.query(`
          UPDATE users 
          SET reader_archetype = $1, 
              spendable_leaves = $2, 
              lifetime_leaves = $3
          WHERE id = $4
        `, [resolvedArchetype, newLeaves, newLifetime, userId]);

        // Insert ledger transaction record
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, $2, $3, $4)
        `, [userId, 10, 'archetype_quiz', 'Earned 10 leaves for discovering your Literary Archetype & Book Zodiac']);
      } else {
        // Just update archetype
        await client.query(`
          UPDATE users 
          SET reader_archetype = $1
          WHERE id = $2
        `, [resolvedArchetype, userId]);
      }

      return { rewarded, newLeaves, resolvedArchetype };
    });

    return NextResponse.json({
      success: true,
      archetype: result.resolvedArchetype,
      rewarded: result.rewarded,
      newLeaves: result.newLeaves,
      message: result.rewarded 
        ? 'Archetype saved! You earned +10 Paper Leaves.' 
        : 'Archetype updated successfully!'
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

    let userId = null;
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const dbUser = await syncOrCreateUser(clerkUser);
        userId = dbUser?.id || null;
      }
    } catch {
      // Anonymous user
    }

    let queryText = `
      SELECT u.full_name as "name", u.lk_id as "lkid", c.name as "chapter"
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE LOWER(u.reader_archetype) = LOWER($1)
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
