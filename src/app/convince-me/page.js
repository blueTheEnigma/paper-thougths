import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import ConvinceMeClient from './ConvinceMeClient';

export const metadata = {
  title: "The Convince-Me Salon - Paper Thoughts Book Pitch Arena",
  description: "Pitch your literary obsessions. Convince the community. Crown the next Community Book of the Month on Paper Thoughts.",
};

export default async function ConvinceMePage() {
  const clerkUser = await currentUser();
  let dbUser = null;
  if (clerkUser) {
    dbUser = await syncOrCreateUser(clerkUser);
  }

  const currentUserData = dbUser ? {
    id: dbUser.id,
    name: dbUser.full_name || 'Book Lover',
    avatarUrl: dbUser.avatar_url || null,
    archetype: dbUser.reader_archetype || null,
    spendableLeaves: dbUser.spendable_leaves || 0
  } : null;

  return (
    <ConvinceMeClient currentUser={currentUserData} />
  );
}
