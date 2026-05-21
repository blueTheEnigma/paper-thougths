import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import WriteClient from './WriteClient';

export const metadata = {
  title: "Offline Writer Workspace",
  description: "Compose and save offline-capable drafts for the weekly prompt. Syncs automatically when online.",
};

export default async function WritePage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/dashboard/write');
  }

  const dbUser = await syncOrCreateUser(user);
  if (!dbUser) {
    redirect('/dashboard');
  }

  // Get active story prompt
  const storyPrompt = await Database.queryOne(`
    SELECT prompt_text as "promptText", id
    FROM prompts
    WHERE prompt_type = 'story'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  // Get active poem prompt
  const poemPrompt = await Database.queryOne(`
    SELECT prompt_text as "promptText", id
    FROM prompts
    WHERE prompt_type = 'poem'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  return (
    <WriteClient
      storyPrompt={storyPrompt ? storyPrompt.promptText : "Write a short scene about discovering an ancient, dust-covered book in an unexpected place."}
      storyPromptId={storyPrompt ? storyPrompt.id : null}
      poemPrompt={poemPrompt ? poemPrompt.promptText : "Write a poem about the quiet chaos of a rainy afternoon in a bookstore."}
      poemPromptId={poemPrompt ? poemPrompt.id : null}
    />
  );
}
