import { currentUser } from '@clerk/nextjs/server';
import DashboardClient from './DashboardClient';
import { getBooks } from '@/lib/data';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const metadata = {
  title: "Dashboard",
  description: "Your personal Archive profile and literary journey.",
};

function getLastSaturdayStart() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) {
    daysSinceSaturday += 7;
  }
  
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - daysSinceSaturday);
  lastSaturday.setHours(0, 0, 0, 0);
  return lastSaturday;
}

async function getLocalArchiveData(clerkUser) {
  if (!clerkUser) return { profile: null, orders: [] };

  try {
    // 1. Sync Clerk user profile to PostgreSQL
    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      console.error("Clerk user sync failed.");
      return { profile: null, orders: [] };
    }

    // 2. Fetch full user details with chapter name
    const profileRow = await Database.queryOne(`
      SELECT u.*, c.name as chapter_name
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE u.id = $1
    `, [dbUser.id]);

    if (!profileRow) {
      return { profile: null, orders: [] };
    }

    // 3. Fetch user orders from PostgreSQL orders table
    const ordersRaw = await Database.query(`
      SELECT order_id as "orderId", created_at as date, items, total, status
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [dbUser.id]);

    // Format orders for frontend compatibility
    const orders = ordersRaw.map(o => ({
      orderId: o.orderId,
      date: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
      items: o.items,
      total: parseFloat(o.total || 0).toLocaleString(),
      status: o.status
    }));

    // 4. Map DB user profile to client expected props
    // We calculate the tier based on milestone tokens or custom status
    const profile = {
      id: profileRow.id,
      lkid: profileRow.lk_id || 'Guest',
      name: profileRow.full_name || 'Anonymous',
      email: profileRow.email,
      instagram: profileRow.instagram || '',
      whatsapp: profileRow.whatsapp || '',
      birthday: profileRow.birthday ? new Date(profileRow.birthday).toISOString().split('T')[0] : null,
      chapter: profileRow.chapter_name || 'Other',
      tier: parseFloat(profileRow.milestone_tokens || 0.0) >= 10.0 ? 'Keeper' : 'Reader',
      milestoneTokens: parseFloat(profileRow.milestone_tokens || 0.0),
      spendableLeaves: parseInt(profileRow.spendable_leaves || 0),
      lifetimeLeaves: parseInt(profileRow.lifetime_leaves || 0),
      bookVouchersGifted: parseInt(profileRow.book_vouchers_gifted || 0),
      streak: parseInt(profileRow.writing_streak || 0),
      lastSubmissionDate: profileRow.last_submission_date ? new Date(profileRow.last_submission_date).toISOString().split('T')[0] : null,
      events: 0, // In standard DB, count event RSVPs. Set to 0 or count if events exist
      referrals: 0,
      permissions: [],
      weeklyReviews: 0
    };

    // Calculate actual referrals count
    const referralsCount = await Database.queryOne(`
      SELECT COUNT(*) as count FROM users WHERE referred_by_id = $1
    `, [dbUser.id]);
    profile.referrals = parseInt(referralsCount?.count || 0);

    // Fetch user permissions list
    const permissions = await Database.query(`
      SELECT p.permission_key FROM user_permissions up
      JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = $1
    `, [dbUser.id]);
    profile.permissions = permissions.map(p => p.permission_key);

    // Calculate weekly reviews count
    const lastSaturday = getLastSaturdayStart();
    const weeklyReviewsCount = await Database.queryOne(`
      SELECT COUNT(*) as count 
      FROM peer_reviews 
      WHERE reviewer_id = $1 AND created_at >= $2
    `, [dbUser.id, lastSaturday]);
    profile.weeklyReviews = parseInt(weeklyReviewsCount?.count || 0);

    return { profile, orders };
  } catch (e) {
    console.error("Dashboard database fetch failed:", e);
    return { profile: null, orders: [] };
  }
}

export default async function DashboardPage() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!user || !email) {
    const { redirect } = await import('next/navigation');
    redirect('/sign-in?redirect_url=/dashboard');
  }

  const [archive, allBooks] = await Promise.all([
    getLocalArchiveData(user),
    getBooks().catch(() => [])
  ]);

  const { profile, orders } = archive;

  // Curated Recommendation Engine
  let recommendations = [];
  if (orders && orders.length > 0 && allBooks.length > 0) {
    const boughtItems = orders.flatMap(o => o.items.split(',').map(i => i.trim().toLowerCase()));
    const boughtBooks = allBooks.filter(b => boughtItems.some(bi => b.title.toLowerCase().includes(bi)));
    const favoriteGenres = [...new Set(boughtBooks.map(b => b.genre))];

    if (favoriteGenres.length > 0) {
      recommendations = allBooks
        .filter(b => favoriteGenres.includes(b.genre) && !boughtItems.some(bi => b.title.toLowerCase().includes(bi)))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    }
  }

  // Fallback to Featured/High Rated if no recommendations
  if (recommendations.length < 3 && allBooks.length > 0) {
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
