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

export async function GET(request) {
  return POST(request);
}
