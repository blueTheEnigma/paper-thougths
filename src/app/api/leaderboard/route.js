import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import { getThreeTierLeaderboard } from '@/lib/leaderboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let currentUserId = null;
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const dbUser = await syncOrCreateUser(clerkUser);
        if (dbUser) currentUserId = dbUser.id;
      }
    } catch {
      // Unauthenticated visitor is allowed
    }

    const leaderboardData = await getThreeTierLeaderboard(currentUserId);
    return NextResponse.json({ success: true, ...leaderboardData });

  } catch (error) {
    console.error('Failed to fetch 3-Tier leaderboard:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve the 3-Tier Leaderboard.' 
    }, { status: 500 });
  }
}
