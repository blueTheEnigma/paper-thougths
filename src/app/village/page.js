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

  // Get active writing prompt (within 7 days, or latest active)
  const activePromptObj = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `) || await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE active_date IS NOT NULL
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  const weeklyPrompt = activePromptObj ? activePromptObj.promptText : "Write freely about any theme or subject that inspires you today.";

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
      avatarUrl: dbUser.avatar_url || null,
      archetype: dbUser.reader_archetype || null,
      foundingBadge: dbUser.founding_badge || null
    };
  }

  // Fetch recent qualifying manuscripts from The Living Salon
  const recentSalonWorks = await Database.query(`
    SELECT 
      s.id,
      s.title,
      s.genre,
      s.logline,
      COALESCE(s.pen_name, u.full_name, 'Anonymous Writer') as "displayName",
      (SELECT COUNT(*) FROM submission_likes l WHERE l.submission_id = s.id)::int as "likeCount",
      (SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0) FROM submission_ratings r WHERE r.submission_id = s.id)::float as "averageRating"
    FROM submissions s
    JOIN users u ON u.id = s.author_id
    WHERE s.batch_status IN ('active_batch', 'archived')
      AND (
        s.batch_status = 'archived'
        OR EXISTS (SELECT 1 FROM peer_reviews pr WHERE pr.submission_id = s.id)
        OR s.created_at <= NOW() - INTERVAL '7 days'
      )
    ORDER BY s.created_at DESC
    LIMIT 3
  `);

  return (
    <VillageClient
      weeklyPrompt={weeklyPrompt}
      storyPrompt={weeklyPrompt}
      poemPrompt={weeklyPrompt}
      userStats={userStats}
      recentSalonWorks={recentSalonWorks || []}
      isSignedIn={!!user}
      isRegistered={!!(dbUser && dbUser.whatsapp)}
    />
  );
}
