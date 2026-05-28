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

    // Update the onboarded flag in the database for this user
    await Database.query(`
      UPDATE users 
      SET onboarded = TRUE 
      WHERE email = $1 OR clerk_id = $2
    `, [emailAddress.toLowerCase(), user.id]);

    return NextResponse.json({ success: true, message: 'Onboarding complete' });
  } catch (error) {
    console.error("Error in /api/me/onboard POST:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to complete onboarding' }, { status: 500 });
  }
}
