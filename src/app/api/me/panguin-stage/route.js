import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';

export async function POST(request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const emailAddress = user.primaryEmailAddress?.emailAddress;
    
    if (!emailAddress) {
      return NextResponse.json({ success: false, error: 'No email address found for user' }, { status: 400 });
    }

    const body = await request.json();
    const { stage } = body;

    if (stage === undefined || stage === null) {
      return NextResponse.json({ success: false, error: 'Stage parameter is required' }, { status: 400 });
    }

    const parsedStage = parseInt(stage, 10);
    if (isNaN(parsedStage) || parsedStage < 0 || parsedStage > 5) {
      return NextResponse.json({ success: false, error: 'Invalid stage value' }, { status: 400 });
    }

    // Update the panguin_stage in the database for this user
    await Database.query(`
      UPDATE users 
      SET panguin_stage = $1 
      WHERE email = $2 OR clerk_id = $3
    `, [parsedStage, emailAddress.toLowerCase(), user.id]);

    return NextResponse.json({ success: true, message: `Panguin stage updated to ${parsedStage}` });
  } catch (error) {
    console.error("Error in /api/me/panguin-stage POST:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update panguin stage' }, { status: 500 });
  }
}
