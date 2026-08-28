import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import GalleryClient from './GalleryClient';

export const metadata = {
  title: "The Living Salon - Paper Thoughts Reading Gallery",
  description: "Explore manuscripts, poems, and stories from Paper Thoughts authors. Read freely, leave leaves, and connect with storytellers.",
};

export default async function VillageGalleryPage() {
  const clerkUser = await currentUser();
  let dbUser = null;
  if (clerkUser) {
    dbUser = await syncOrCreateUser(clerkUser);
  }

  const currentUserData = dbUser ? {
    id: dbUser.id,
    name: dbUser.full_name || 'Reader',
    avatarUrl: dbUser.avatar_url || null,
    archetype: dbUser.reader_archetype || null,
    spendableLeaves: dbUser.spendable_leaves || 0
  } : null;

  return (
    <GalleryClient currentUser={currentUserData} />
  );
}
