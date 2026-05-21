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

  // Get active weekly prompt
  const activePrompt = await Database.queryOne(`
    SELECT prompt_text as "promptText", id
    FROM prompts
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  return (
    <WriteClient
      activePrompt={activePrompt ? activePrompt.promptText : "Compose your draft here for the weekly Clubhouse selection cycle."}
      promptId={activePrompt ? activePrompt.id : null}
    />
  );
}
