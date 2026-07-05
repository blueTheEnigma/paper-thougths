import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { MAX_POINTS, MIN_PASSAGE_POINTS, GIFT_THRESHOLD_POINTS } from '@/lib/crossingConfig';

// Helper to calculate total points
function calculatePoints(progress, isLoggedIn) {
  let points = 0;
  // The Register is 30 points. It is only valid if the user is logged in
  if (isLoggedIn || progress.app_signup) {
    points += 30;
  }
  
  const tenPointWaypoints = [
    'whatsapp_channel', 'whatsapp_tv',
    'instagram', 'founder_instagram', 'tiktok', 'youtube', 'facebook',
    'x', 'linkedin'
  ];

  tenPointWaypoints.forEach(key => {
    if (progress[key] === true) {
      points += 10;
    }
  });

  return points;
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: true, 
        isLoggedIn: false, 
        progress: {}, 
        hasRelic: false 
      });
    }

    const userId = parseInt(session.user.id);
    const dbUser = await Database.queryOne(`
      SELECT crossing_progress as "progress", has_relic as "hasRelic", lk_id as "lkId", full_name as "name"
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      progress: dbUser.progress || {},
      hasRelic: dbUser.hasRelic || false,
      lkId: dbUser.lkId,
      name: dbUser.name
    });
  } catch (error) {
    console.error('Crossing GET API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { progress } = body;

    if (!progress || typeof progress !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid progress data' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Fetch existing user data
    const dbUser = await Database.queryOne(`
      SELECT email, full_name as "name", lk_id as "lkId", crossing_progress as "progress", has_relic as "hasRelic"
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Merge new progress with existing progress
    const mergedProgress = {
      ...(dbUser.progress || {}),
      ...progress,
      app_signup: true // Forced true since they are authenticated
    };

    // Calculate score
    const points = calculatePoints(mergedProgress, true);
    let hasNewlyUnlockedRelic = false;
    let updateHasRelic = dbUser.hasRelic || false;

    if (points >= GIFT_THRESHOLD_POINTS && !dbUser.hasRelic) {
      updateHasRelic = true;
      hasNewlyUnlockedRelic = true;
    }

    // Update database
    await Database.query(`
      UPDATE users 
      SET crossing_progress = $1, has_relic = $2
      WHERE id = $3
    `, [JSON.stringify(mergedProgress), updateHasRelic, userId]);

    // Send email notification if newly unlocked
    if (hasNewlyUnlockedRelic) {
      try {
        const relicHtml = `
          <div style="background-color: #FAF7F2; color: #2C1A0E; font-family: sans-serif; padding: 40px; border: 1px solid rgba(44, 26, 14, 0.1); max-width: 600px; margin: 0 auto; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.2em; color: #5C1A2E; text-transform: uppercase;">Paper Thoughts Archive</span>
              <h1 style="font-family: serif; color: #5C1A2E; margin-top: 10px; margin-bottom: 5px; font-size: 28px;">The Founding Crosser Relic</h1>
              <div style="height: 1px; width: 60px; background-color: #C96A42; margin: 15px auto;"></div>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; font-style: italic; color: rgba(44, 26, 14, 0.8);">
              Dear ${dbUser.name || 'Reader'},
            </p>
            
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              You have walked the bridge. You have touched the realms and proven your commitment. The ledger is marked, and your crossing is now complete.
            </p>
            
            <div style="background-color: #FFF5EC; border: 1px solid rgba(201, 106, 66, 0.2); border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
              <span style="font-size: 10px; font-weight: bold; color: rgba(44, 26, 14, 0.4); text-transform: uppercase; display: block; margin-bottom: 5px;">Your Unique Membership ID</span>
              <span style="font-size: 28px; font-family: monospace; font-weight: bold; color: #5C1A2E; letter-spacing: 1px;">${dbUser.lkId}</span>
              
              <div style="margin-top: 20px; font-size: 13px; color: #7A9E7E; font-weight: bold;">
                ✦ Verified Founding Crosser ✦
              </div>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              This relic is your proof of passage. Your "Founding Crosser" badge has been permanently added to your app profile, and your personalized digital certificate can be generated and printed directly from your crossing page on our platform.
            </p>
            
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
              We will see you in the lines.
            </p>
            
            <div style="border-t: 1px solid rgba(44, 26, 14, 0.05); padding-top: 20px; font-size: 12px; color: rgba(44, 26, 14, 0.5); text-align: center;">
              This email was sent to ${dbUser.email} because you successfully completed the Relics of the Crossing quest.
            </div>
          </div>
        `;

        await sendEmail({
          to: dbUser.email,
          subject: 'Your Crossing is Complete - Claim Your Relic',
          html: relicHtml
        });
        console.log(`Relic email successfully sent to ${dbUser.email}`);
      } catch (emailError) {
        console.error('Failed to send relic email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      progress: mergedProgress,
      points,
      hasRelic: updateHasRelic,
      hasNewlyUnlockedRelic
    });
  } catch (error) {
    console.error('Crossing POST API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
