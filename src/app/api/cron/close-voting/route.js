import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

function getVotingMonthYear() {
  const now = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // Authorization check
    if (!isDev && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentMonthYear = getVotingMonthYear();
    console.log(`Closing voting for BOTM cycle: ${currentMonthYear}...`);

    await Database.query(`
      UPDATE botm_cycles 
      SET voting_open = FALSE
      WHERE month_year = $1
    `, [currentMonthYear]);

    return NextResponse.json({ success: true, message: `Voting successfully closed for ${currentMonthYear}.` });
  } catch (error) {
    console.error('Failed to close voting:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to close voting' }, { status: 500 });
  }
}

// Support GET requests in development for manual testing
export async function GET(request) {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    return NextResponse.json({ success: false, error: 'Method Not Allowed' }, { status: 405 });
  }
  return POST(request);
}
