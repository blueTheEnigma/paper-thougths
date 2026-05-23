import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullName, instagram, whatsapp, email, chapter, referral, birthday, preferredGenres } = body;

    if (!fullName || !whatsapp || !email) {
      return NextResponse.json({ success: false, error: 'Full name, WhatsApp number, and Email address are required.' }, { status: 400 });
    }

    const cleanInstagram = instagram ? instagram.replace('@', '').trim() : null;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check duplicate email or instagram in database
    const existingUser = await Database.queryOne(`
      SELECT id, email, instagram FROM users 
      WHERE email = $1 OR (instagram IS NOT NULL AND instagram = $2)
    `, [cleanEmail, cleanInstagram]);

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json({ success: false, error: 'This email address is already registered.' }, { status: 400 });
      }
      if (cleanInstagram && existingUser.instagram === cleanInstagram) {
        return NextResponse.json({ success: false, error: 'This Instagram handle is already registered.' }, { status: 400 });
      }
    }

    // 2. Resolve chapter name to chapter_id
    let chapterRow = await Database.queryOne(`
      SELECT id FROM chapters WHERE LOWER(name) = LOWER($1)
    `, [chapter || 'Other']);

    if (!chapterRow) {
      chapterRow = await Database.queryOne(`SELECT id FROM chapters WHERE name = 'Other'`);
    }

    // 3. Resolve referrer if code is provided
    let referrerId = null;
    if (referral) {
      const code = referral.trim().toUpperCase();
      const referrerDetails = await Database.queryOne(`
        SELECT id FROM users WHERE UPPER(lk_id) = $1
      `, [code]);
      if (referrerDetails) {
        referrerId = referrerDetails.id;
      }
    }

    // 4. Create user record inside a database transaction
    const assignedLkId = await Database.transaction(async (client) => {
      // Insert user
      const userRes = await client.query(`
        INSERT INTO users (full_name, instagram, whatsapp, email, chapter_id, referred_by_id, birthday, preferred_genres)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [fullName, cleanInstagram, whatsapp, cleanEmail, chapterRow.id, referrerId, birthday || null, preferredGenres || []]);

      const newUserId = userRes.rows[0].id;
      const year = new Date().getFullYear();
      const lkId = `LK-${year}-${1000 + newUserId}`;

      // Update the user record with the generated sequential lk_id code
      await client.query(`
        UPDATE users SET lk_id = $1 WHERE id = $2
      `, [lkId, newUserId]);

      // If referrer was found, apply tokens and check referral cap limit (max 5)
      if (referrerId) {
        const refsCount = await client.query(`
          SELECT COUNT(*) as count FROM users WHERE referred_by_id = $1
        `, [referrerId]);
        
        const count = parseInt(refsCount.rows[0].count || 0);
        
        // Anti-Influencer cap: Only reward the first 5 referrals
        if (count <= 5) {
          await client.query(`
            UPDATE users 
            SET milestone_tokens = milestone_tokens + 1.2
            WHERE id = $1
          `, [referrerId]);
          
          // Verify if referrer hit the 500 lifetime leaves milestone
          const updatedReferrer = await client.queryOne(`
            SELECT lifetime_leaves, book_vouchers_gifted FROM users WHERE id = $1
          `, [referrerId]);
          
          const totalMilestones = Math.floor(updatedReferrer.lifetime_leaves / 500);
          if (totalMilestones > (updatedReferrer.book_vouchers_gifted || 0)) {
            await client.query(`
              UPDATE users SET book_vouchers_gifted = $1 WHERE id = $2
            `, [totalMilestones, referrerId]);
          }
        }
      }

      return lkId;
    });

    return NextResponse.json({
      success: true,
      lkId: assignedLkId,
      message: 'Registration successful! Welcome to the Archive.'
    });

  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Registration failed' }, { status: 500 });
  }
}
