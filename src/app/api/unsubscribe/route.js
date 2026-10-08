import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Unsubscribe Error - Paper Thoughts</title></head>
        <body style="font-family: Georgia, serif; background: #20070e; color: #FAF7F2; text-align: center; padding: 50px 20px;">
          <h2>Invalid Unsubscribe Link</h2>
          <p>No email address was specified. Please manage notifications from your dashboard.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  await Database.query(`
    UPDATE users
    SET unsubscribed_from_reminders = TRUE
    WHERE LOWER(email) = LOWER($1)
  `, [email]);

  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Unsubscribed - Paper Thoughts Sanctuary</title>
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #120308; font-family: 'Georgia', serif; color: #FAF7F2; text-align: center;">
        <div style="max-width: 500px; margin: 40px auto; background-color: #20070e; border: 1px solid rgba(201, 106, 66, 0.4); border-radius: 24px; padding: 40px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="font-size: 32px; margin-bottom: 12px;">🕯️</div>
          <h1 style="font-size: 24px; margin: 0 0 12px 0; color: #FBF7EE;">You Have Been Unsubscribed</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #F2A98A; margin-bottom: 25px;">
            You will no longer receive automated reminder or marketing calls at <strong>${email}</strong>. 
            Your writing, milestone tokens, and Sanctuary standing remain intact.
          </p>
          <a href="https://www.paperthoughts.org/dashboard" style="display: inline-block; padding: 12px 28px; background: #c96a42; color: #FAF7F2; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
            Return to Dashboard →
          </a>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    if (userId) {
      await Database.query(`
        UPDATE users
        SET unsubscribed_from_reminders = TRUE
        WHERE id = $1
      `, [userId]);
    } else if (email) {
      await Database.query(`
        UPDATE users
        SET unsubscribed_from_reminders = TRUE
        WHERE LOWER(email) = LOWER($1)
      `, [email]);
    } else {
      return NextResponse.json({ success: false, error: 'email or userId is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from automated reminders'
    });
  } catch (err) {
    console.error('POST /api/unsubscribe error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
