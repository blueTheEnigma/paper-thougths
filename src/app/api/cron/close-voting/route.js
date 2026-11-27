import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

import { isCronAuthorized } from '@/lib/cronAuth';

function getVotingMonthYear() {
  const now = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

export async function POST(request) {
  try {
    if (!isCronAuthorized(request)) {
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

export async function GET(request) {
  return POST(request);
}
