import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import Database from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const clerkUser = await currentUser();
    let currentUserId = null;
    if (clerkUser) {
      const dbUser = await syncOrCreateUser(clerkUser);
      currentUserId = dbUser ? dbUser.id : null;
    }

    const { searchParams } = new URL(request.url);
    const vibe = searchParams.get('vibe');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'top'; // 'top' or 'recent'

    let queryText = `
      SELECT 
        p.id,
        p.book_title as "bookTitle",
        p.book_author as "bookAuthor",
        p.hook_line as "hookLine",
        p.aftertaste,
        p.killer_quote as "killerQuote",
        p.cover_url as "coverUrl",
        p.vibe_tags as "vibeTags",
        p.status,
        p.created_at as "createdAt",
        u.id as "authorId",
        u.full_name as "authorName",
        u.avatar_url as "authorAvatar",
        u.reader_archetype as "authorArchetype",
        (SELECT COUNT(*) FROM book_pitch_pledges bpp WHERE bpp.pitch_id = p.id)::int as "pledgeCount",
        (SELECT COUNT(*) FROM book_pitch_notes bpn WHERE bpn.pitch_id = p.id)::int as "commentCount",
        EXISTS(SELECT 1 FROM book_pitch_pledges bpp WHERE bpp.pitch_id = p.id AND bpp.user_id = $1) as "userPledged"
      FROM book_pitches p
      JOIN users u ON u.id = p.user_id
      WHERE p.status = 'active'
    `;

    const queryParams = [currentUserId];

    if (vibe && vibe !== 'All') {
      queryParams.push(vibe);
      queryText += ` AND $${queryParams.length} = ANY(p.vibe_tags)`;
    }

    if (search && search.trim()) {
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (
        LOWER(p.book_title) LIKE $${queryParams.length} 
        OR LOWER(p.book_author) LIKE $${queryParams.length} 
        OR LOWER(p.hook_line) LIKE $${queryParams.length}
        OR LOWER(u.full_name) LIKE $${queryParams.length}
      )`;
    }

    if (sort === 'recent') {
      queryText += ` ORDER BY p.created_at DESC LIMIT 60`;
    } else {
      queryText += ` ORDER BY "pledgeCount" DESC, p.created_at DESC LIMIT 60`;
    }

    const result = await Database.query(queryText, queryParams);

    return NextResponse.json({
      success: true,
      pitches: result.rows
    });
  } catch (error) {
    console.error('Error fetching book pitches:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pitches' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User synchronization failed' }, { status: 500 });
    }

    const body = await request.json();
    const { bookTitle, bookAuthor, hookLine, aftertaste, killerQuote, coverUrl, vibeTags } = body;

    if (!bookTitle || !bookAuthor || !hookLine || !aftertaste) {
      return NextResponse.json({ 
        success: false, 
        error: 'Book title, author, 1-line hook, and emotional aftertaste are required.' 
      }, { status: 400 });
    }

    const cleanVibeTags = Array.isArray(vibeTags) ? vibeTags.slice(0, 5) : [];

    const result = await Database.transaction(async (client) => {
      // 1. Insert pitch
      const pitchRes = await client.query(`
        INSERT INTO book_pitches (
          user_id, book_title, book_author, hook_line, aftertaste, killer_quote, cover_url, vibe_tags, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        RETURNING id, book_title as "bookTitle", book_author as "bookAuthor", hook_line as "hookLine", aftertaste, killer_quote as "killerQuote", cover_url as "coverUrl", vibe_tags as "vibeTags", created_at as "createdAt"
      `, [
        dbUser.id, 
        bookTitle.trim(), 
        bookAuthor.trim(), 
        hookLine.trim(), 
        aftertaste.trim(), 
        killerQuote ? killerQuote.trim() : null, 
        coverUrl ? coverUrl.trim() : null, 
        cleanVibeTags
      ]);

      const newPitch = pitchRes.rows[0];

      // 2. Reward +10 Leaves to author for pitching
      await client.query(`
        UPDATE users
        SET spendable_leaves = spendable_leaves + 10,
            lifetime_leaves = lifetime_leaves + 10
        WHERE id = $1
      `, [dbUser.id]);

      // 3. Log leaves transaction if table exists
      try {
        await client.query(`
          INSERT INTO leaves_transactions (user_id, amount, transaction_type, reference_id, description)
          VALUES ($1, 10, 'earn_pitch', $2, $3)
        `, [dbUser.id, newPitch.id, `Created Book Pitch: "${bookTitle}"`]);
      } catch (err) {
        // Non-fatal if leaves_transactions schema differs
      }

      return newPitch;
    });

    return NextResponse.json({
      success: true,
      message: 'Book pitch published to The Salon! Earned +10 Leaves 🍃',
      pitch: result
    });
  } catch (error) {
    console.error('Error creating book pitch:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create pitch' }, { status: 500 });
  }
}
