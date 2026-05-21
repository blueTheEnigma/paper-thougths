import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import SalonClient from './SalonClient';

export const metadata = {
  title: "The Salon - Paper Thoughts",
  description: "Enter the creative heart of the clubhouse. Draft your manuscripts or critique peers in the anonymous double-blind pool.",
};

function getLastSaturdayStart() {
  const now = new Date();
  const currentDay = now.getDay();
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) {
    daysSinceSaturday += 7;
  }
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - daysSinceSaturday);
  lastSaturday.setHours(0, 0, 0, 0);
  return lastSaturday;
}

export default async function SalonPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/salon');
  }

  const dbUser = await syncOrCreateUser(user);
  if (!dbUser) {
    redirect('/dashboard');
  }

  // Get active prompts
  const storyPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'story'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  const poemPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'poem'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  // Count reviews done this week
  const lastSaturday = getLastSaturdayStart();
  const reviewsCount = await Database.queryOne(`
    SELECT COUNT(*) as count 
    FROM peer_reviews 
    WHERE reviewer_id = $1 AND created_at >= $2
  `, [dbUser.id, lastSaturday]);

  const userStats = {
    spendableLeaves: dbUser.spendable_leaves || 0,
    milestoneTokens: parseFloat(dbUser.milestone_tokens || 0.0),
    weeklyReviews: parseInt(reviewsCount?.count || 0),
    lkId: dbUser.lk_id || 'Guest',
    name: dbUser.full_name || 'Writer'
  };

  return (
    <SalonClient
      storyPrompt={storyPrompt ? storyPrompt.promptText : "No active story prompt."}
      poemPrompt={poemPrompt ? poemPrompt.promptText : "No active poem prompt."}
      userStats={userStats}
    />
  );
}
