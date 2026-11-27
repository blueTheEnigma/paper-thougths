import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import PatronClient from './PatronClient';

export const metadata = {
  title: 'Literary Fund & Patronage - Paper Thoughts',
  description:
    'Support Paper Thoughts writers, fund community anthologies, buy & gift Paper Leaves bundles, or contribute to the Literary Fund.',
};

export default async function PatronPage() {
  let dbUser = null;
  try {
    const user = await currentUser();
    if (user) {
      dbUser = await syncOrCreateUser(user);
    }
  } catch {
    // Publicly accessible for friends and outside patrons
  }

  const paystackPublicKey =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || '';

  const initialUser = dbUser
    ? {
        id: dbUser.id,
        name: dbUser.full_name || 'Kindred Patron',
        email: dbUser.email || '',
        spendableLeaves: parseInt(dbUser.spendable_leaves || 0, 10),
        isPatron: Boolean(dbUser.is_patron),
      }
    : null;

  return <PatronClient paystackPublicKey={paystackPublicKey} initialUser={initialUser} />;
}
