import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Database } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, referral } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await Database.queryOne(`
      SELECT * FROM users WHERE email = $1
    `, [cleanEmail]);

    if (existingUser) {
      if (existingUser.password_hash) {
        return NextResponse.json({ success: false, error: 'This email is already registered.' }, { status: 400 });
      }

      // User exists but has no password (e.g. from Google login or Clerk migration)
      // We will hash the password and update their profile to support credentials login
      const hashedPassword = await bcrypt.hash(password, 10);
      
      let referrerId = null;
      if (referral) {
        const refUser = await Database.queryOne('SELECT id FROM users WHERE lk_id = $1', [referral.trim().toUpperCase()]);
        if (refUser) referrerId = refUser.id;
      }

      await Database.query(`
        UPDATE users 
        SET password_hash = $1, full_name = COALESCE(full_name, $2), referred_by_id = COALESCE(referred_by_id, $3)
        WHERE id = $4
      `, [hashedPassword, name.trim(), referrerId, existingUser.id]);

      return NextResponse.json({ 
        success: true, 
        message: 'Account updated successfully. You can now log in.' 
      });
    }

    // Hash the password for the new user
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user and generate the LK-ID in a single transaction
    const newUser = await Database.transaction(async (client) => {
      let referrerId = null;
      if (referral) {
        const refRes = await client.query('SELECT id FROM users WHERE lk_id = $1', [referral.trim().toUpperCase()]);
        if (refRes.rows.length > 0) {
          referrerId = refRes.rows[0].id;
        }
      }

      const userRes = await client.query(`
        INSERT INTO users (email, full_name, password_hash, onboarded, referred_by_id)
        VALUES ($1, $2, $3, FALSE, $4)
        RETURNING id
      `, [cleanEmail, name.trim(), hashedPassword, referrerId]);
      
      const newUserId = userRes.rows[0].id;
      const year = new Date().getFullYear();
      const lkId = `LK-${year}-${1000 + newUserId}`;
      
      const updatedRes = await client.query(`
        UPDATE users 
        SET lk_id = $1 
        WHERE id = $2 
        RETURNING *
      `, [lkId, newUserId]);
      
      return updatedRes.rows[0];
    });

    console.log('Created new credential user with LK-ID:', newUser.email, newUser.lk_id);

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully! Redirecting to login...' 
    });

  } catch (error) {
    console.error('Registration API failure:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error during registration' }, { status: 500 });
  }
}
