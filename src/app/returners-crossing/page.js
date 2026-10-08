import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncOrCreateUser } from '@/lib/permissions';
import { getReturnerCrossingProgress } from '@/lib/governance';
import ReturnersCrossingClient from './ReturnersCrossingClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "The Returner's Crossing - Paper Thoughts",
  description: "The road back from exile. Walk the three gates of penance to restore your sanctuary standing.",
};

export default async function ReturnersCrossingPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/returners-crossing');
  }

  const dbUser = await syncOrCreateUser(user);
  if (!dbUser) {
    redirect('/sign-in');
  }

  const initialProgress = await getReturnerCrossingProgress(dbUser.id);

  return (
    <ReturnersCrossingClient 
      initialProgress={initialProgress} 
      userName={dbUser.full_name || 'Crosser'} 
    />
  );
}
