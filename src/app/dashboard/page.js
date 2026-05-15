import { currentUser } from '@clerk/nextjs/server';
import DashboardClient from './DashboardClient';
import { getBooks } from '@/lib/data';

export const metadata = {
  title: "Dashboard",
  description: "Your personal Archive profile and literary journey.",
};

async function getArchiveData(email) {
  const gasUrl = process.env.GAS_WEBAPP_URL;
  if (!gasUrl) return { profile: null, orders: [] };

  try {
    const [profileRes, ordersRes] = await Promise.all([
      fetch(gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'getProfile', email }),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      }),
      fetch(gasUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'getMemberOrders', email }),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
    ]);

    // Robust JSON parsing
    let profile = null;
    let orders = [];

    if (profileRes.ok) {
      try {
        const data = await profileRes.json();
        if (data.success) profile = data.profile;
      } catch (e) { console.error("Profile JSON parse error"); }
    }

    if (ordersRes.ok) {
      try {
        const data = await ordersRes.json();
        if (data.success) orders = data.orders;
      } catch (e) { console.error("Orders JSON parse error"); }
    }

    return { profile, orders };
  } catch (e) {
    console.error("Dashboard data fetch failed", e);
    return { profile: null, orders: [] };
  }
}

export default async function DashboardPage() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!user || !email) {
    // If no user, redirect to sign-in (server-side)
    const { redirect } = await import('next/navigation');
    redirect('/sign-in?redirect_url=/dashboard');
  }

  const [archive, allBooks] = await Promise.all([
    getArchiveData(email),
    getBooks().catch(() => []) // Ensure allBooks is always an array
  ]);

  const { profile, orders } = archive;

  // Recommendation Engine
  let recommendations = [];
  if (orders && orders.length > 0) {
    // 1. Extract genres from previous orders
    // order.items is a string, so we'll do a fuzzy match against book titles
    const boughtItems = orders.flatMap(o => o.items.split(',').map(i => i.trim().toLowerCase()));
    const boughtBooks = allBooks.filter(b => boughtItems.some(bi => b.title.toLowerCase().includes(bi)));
    const favoriteGenres = [...new Set(boughtBooks.map(b => b.genre))];

    if (favoriteGenres.length > 0) {
      // 2. Recommend books in those genres that haven't been bought yet
      recommendations = allBooks
        .filter(b => favoriteGenres.includes(b.genre) && !boughtItems.some(bi => b.title.toLowerCase().includes(bi)))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    }
  }

  // Fallback to Featured/High Rated if no recommendations
  if (recommendations.length < 3) {
    const fallback = allBooks
      .filter(b => b.featured || b.rating >= 4.5)
      .filter(b => !recommendations.some(r => r.id === b.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4 - recommendations.length);
    recommendations = [...recommendations, ...fallback];
  }

  return (
    <DashboardClient 
      profile={profile} 
      initialOrders={orders} 
      recommendations={recommendations}
      userEmail={email}
    />
  );
}
