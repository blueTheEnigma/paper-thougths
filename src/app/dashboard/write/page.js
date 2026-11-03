import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import WriteClient from './WriteClient';

export const metadata = {
  title: "Offline Writer Workspace",
  description: "Compose and save offline-capable drafts for the weekly prompt. Syncs automatically when online.",
};

export default async function WritePage({ searchParams }) {
  const resolvedParams = await searchParams;
  const type = resolvedParams?.type;

  const user = await currentUser();
  if (!user) {
    const redirectPath = type ? `/dashboard/write?type=${type}` : '/dashboard/write';
    redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`);
  }

  const dbUser = await syncOrCreateUser(user);
  if (!dbUser) {
    redirect('/dashboard');
  }

  // If member is dormant / evicted, redirect to Returner's Crossing
  if (dbUser.membership_status === 'evicted') {
    redirect('/returners-crossing');
  }

  // Get active unified writing prompt (within 7 days, or latest active)
  const activePromptObj = await Database.queryOne(`
    SELECT prompt_text as "promptText", id
    FROM prompts
    WHERE active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `) || await Database.queryOne(`
    SELECT prompt_text as "promptText", id
    FROM prompts
    WHERE active_date IS NOT NULL
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  const activePromptText = activePromptObj ? activePromptObj.promptText : "Write freely about any theme or subject that inspires you today.";
  const activePromptId = activePromptObj ? activePromptObj.id : null;

  return (
    <WriteClient
      weeklyPrompt={activePromptText}
      weeklyPromptId={activePromptId}
      storyPrompt={activePromptText}
      storyPromptId={activePromptId}
      poemPrompt={activePromptText}
      poemPromptId={activePromptId}
    />
  );
}
