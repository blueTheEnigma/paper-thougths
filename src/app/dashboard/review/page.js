import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncOrCreateUser } from '@/lib/permissions';
import ReviewClient from './ReviewClient';

export const metadata = {
  title: "Critique Queue - Paper Thoughts",
  description: "Provide feedback on anonymous peer submissions and earn tokens.",
};

export default async function ReviewPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/dashboard/review');
  }

  const dbUser = await syncOrCreateUser(user);
  if (dbUser?.membership_status === 'evicted') {
    redirect('/returners-crossing');
  }

  return <ReviewClient />;
}
