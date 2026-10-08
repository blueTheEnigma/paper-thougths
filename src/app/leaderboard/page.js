import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import { getThreeTierLeaderboard } from '@/lib/leaderboard';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "The Scribes' Monument & Leaderboard - Paper Thoughts",
  description: "The 3-Tier Arena of Laurels: Compete for the ₦18,000 Monthly Cash Laurels, race for the Veteran Silver Bullet Shield, and inscribe your legacy in the Hall of Lore.",
  openGraph: {
    title: "Paper Thoughts • The Scribes' Monument",
    description: "Compete for the ₦18,000 monthly laurels pool and race for the annual Silver Bullet shield.",
  }
};

export default async function LeaderboardPage() {
  let dbUserId = null;
  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const dbUser = await syncOrCreateUser(clerkUser);
      if (dbUser) {
        dbUserId = dbUser.id;
      }
    }
  } catch (authErr) {
    console.error("Leaderboard auth check skipped/failed:", authErr);
  }

  const initialData = await getThreeTierLeaderboard(dbUserId);

  return (
    <LeaderboardClient 
      initialData={initialData} 
      currentUserId={dbUserId} 
    />
  );
}
