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

  // Get active story prompt (within 7 days)
  const storyPrompt = await Database.queryOne(`
    SELECT prompt_text as "promptText", id
    FROM prompts
    WHERE prompt_type = 'story'
      AND active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  // Get active poem prompt (within 7 days)
  const poemPrompt = await Database.queryOne(`
    SELECT prompt_text as "promptText", id
    FROM prompts
    WHERE prompt_type = 'poem'
      AND active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  return (
    <WriteClient
      storyPrompt={storyPrompt ? storyPrompt.promptText : "Write freely about any theme or subject that inspires you today."}
      storyPromptId={storyPrompt ? storyPrompt.id : null}
      poemPrompt={poemPrompt ? poemPrompt.promptText : "Write freely about any theme or subject that inspires you today."}
      poemPromptId={poemPrompt ? poemPrompt.id : null}
    />
  );
}
