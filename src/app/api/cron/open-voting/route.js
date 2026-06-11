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
    console.log(`Opening voting for BOTM cycle: ${currentMonthYear}...`);

    await Database.query(`
      INSERT INTO botm_cycles (month_year, voting_open)
      VALUES ($1, TRUE)
      ON CONFLICT (month_year) DO UPDATE SET voting_open = TRUE
    `, [currentMonthYear]);

    return NextResponse.json({ success: true, message: `Voting successfully opened for ${currentMonthYear}.` });
  } catch (error) {
    console.error('Failed to open voting:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to open voting' }, { status: 500 });
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
