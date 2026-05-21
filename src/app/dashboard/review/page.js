import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
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

  return <ReviewClient />;
}
