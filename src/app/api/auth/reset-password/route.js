import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, token, password } = body;

    // 1. Request Reset Flow (email only)
    if (email && !token && !password) {
      const targetEmail = email.trim().toLowerCase();
      
      const user = await Database.queryOne(`
        SELECT id, email, full_name FROM users WHERE email = $1
      `, [targetEmail]);

      if (!user) {
        // Return success to prevent email verification probing
        return NextResponse.json({ success: true, message: 'If this email is registered, a password setup link has been sent.' });
      }

      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      await Database.query(`
        UPDATE users 
        SET reset_token = $1, reset_token_expires = $2 
        WHERE id = $3
      `, [resetToken, resetTokenExpires, user.id]);

      // Construct reset URL
      const origin = request.nextUrl.origin;
      const resetUrl = `${origin}/auth/reset-password?token=${resetToken}`;

      // Send email via Resend
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; borderRadius: 8px;">
          <h2 style="color: #4A0E0E;">Set Up Your Password</h2>
          <p>Hello ${user.full_name || 'Member'},</p>
          <p>We are upgrading the Paper Thoughts security system. To access your account using credentials (email/password), please set up a new password using the link below:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #4A0E0E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Set Up Password</a>
          </div>
          <p style="font-size: 12px; color: #666;">This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">Paper Thoughts - Zaria • Kaduna • Abuja</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: 'Paper Thoughts - Password Setup / Reset Request',
        html: emailHtml
      });

      return NextResponse.json({ success: true, message: 'If this email is registered, a password setup link has been sent.' });
    }

    // 2. Perform Password Reset Flow (token + password)
    if (token && password) {
      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }

      // Find user with valid token that has not expired
      const user = await Database.queryOne(`
        SELECT id FROM users 
        WHERE reset_token = $1 AND reset_token_expires > NOW()
      `, [token]);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Password reset link is invalid or has expired.' }, { status: 400 });
      }

      // Hash password and clean up token columns
      const passwordHash = await bcrypt.hash(password, 10);

      await Database.query(`
        UPDATE users 
        SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
        WHERE id = $2
      `, [passwordHash, user.id]);

      return NextResponse.json({ success: true, message: 'Password has been set successfully. You can now log in.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid parameters.' }, { status: 400 });

  } catch (error) {
    console.error('Password reset endpoint failure:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
