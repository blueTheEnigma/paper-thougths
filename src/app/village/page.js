import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import VillageClient from './VillageClient';

export const metadata = {
  title: "Writers' Village - Paper Thoughts",
  description: "Enter the creative heart of the clubhouse. Draft your manuscripts or critique peers in the anonymous double-blind pool.",
};

// Saturday 12:00 AM batch cycle start calculator (UTC aligned)
function getLastSaturdayStart() {
  const now = new Date();
  const currentDay = now.getUTCDay();
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) {
    daysSinceSaturday += 7;
  }
  const lastSaturday = new Date(now);
  lastSaturday.setUTCDate(now.getUTCDate() - daysSinceSaturday);
  lastSaturday.setUTCHours(0, 0, 0, 0);
  return lastSaturday;
}

export default async function VillagePage() {
  const user = await currentUser();
  const dbUser = user ? await syncOrCreateUser(user) : null;

  // Get active prompts (within 7 days)
  const storyPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'story'
      AND active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  const poemPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'poem'
      AND active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  let userStats = {
    spendableLeaves: 0,
    lifetimeLeaves: 0,
    milestoneTokens: 0.0,
    weeklyReviews: 0,
    lkId: 'Guest',
    name: 'Writer'
  };

  if (dbUser) {
    // Count reviews done this week
    const lastSaturday = getLastSaturdayStart();
    const reviewsCount = await Database.queryOne(`
      SELECT COUNT(*) as count 
      FROM peer_reviews 
      WHERE reviewer_id = $1 AND created_at >= $2
    `, [dbUser.id, lastSaturday]);

    userStats = {
      spendableLeaves: dbUser.spendable_leaves || 0,
      lifetimeLeaves: dbUser.lifetime_leaves || 0,
      milestoneTokens: parseFloat(dbUser.milestone_tokens || 0.0),
      weeklyReviews: parseInt(reviewsCount?.count || 0),
      lkId: dbUser.lk_id || 'Guest',
      name: dbUser.full_name || 'Writer',
      avatarUrl: dbUser.avatar_url || null
    };
  }

  return (
    <VillageClient
      storyPrompt={storyPrompt ? storyPrompt.promptText : "Write freely about any theme or subject that inspires you today."}
      poemPrompt={poemPrompt ? poemPrompt.promptText : "Write freely about any theme or subject that inspires you today."}
      userStats={userStats}
      isSignedIn={!!user}
      isRegistered={!!(dbUser && dbUser.whatsapp)}
    />
  );
}
