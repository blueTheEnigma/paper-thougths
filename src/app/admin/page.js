import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Database } from '@/lib/db';
import { syncOrCreateUser, getUserPermissions } from '@/lib/permissions';
import AdminClient from './AdminClient';

export const metadata = {
  title: "Admin Control Center - Paper Thoughts",
  description: "Administrative console for managing literary batches, bookstore ledger, and chapter members.",
};

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/admin');
  }

  // 1. Sync User and fetch permissions
  const dbUser = await syncOrCreateUser(user);
  if (!dbUser) {
    redirect('/dashboard');
  }

  const permissions = await getUserPermissions(user.id);
  const email = (user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
  const isSuperadmin = email === SUPERADMIN_EMAIL.toLowerCase();

  // If user has no admin permissions and isn't the superadmin, bounce them back to dashboard
  if (permissions.length === 0 && !isSuperadmin) {
    redirect('/dashboard');
  }

  // 2. Fetch Members Ledger (Lifetime Leaves)
  const members = await Database.query(`
    SELECT u.id, u.full_name as name, u.email, u.lk_id as lkid, 
           u.milestone_tokens as "milestoneTokens", u.spendable_leaves as "spendableLeaves", 
           u.lifetime_leaves as "lifetimeLeaves", u.book_vouchers_gifted as "vouchersGifted", 
           u.writing_streak as streak, c.name as chapter,
           COALESCE(
             (SELECT json_agg(p.permission_key) 
              FROM user_permissions up 
              JOIN permissions p ON p.id = up.permission_id 
              WHERE up.user_id = u.id), 
             '[]'::json
           ) as permissions
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    ORDER BY u.lifetime_leaves DESC, u.created_at ASC
  `);

  // 3. Fetch Submissions (For Batch Moderation)
  const submissions = await Database.query(`
    SELECT s.id, s.title, s.genre, s.logline, s.batch_status as status, 
           u.full_name as author, s.has_laurel as laurel, s.created_at as date
    FROM submissions s
    JOIN users u ON u.id = s.author_id
    ORDER BY s.created_at DESC
  `);

  // 4. Fetch Bookstore Sales Logs (Recent 50 Orders)
  const orders = await Database.query(`
    SELECT o.order_id as "orderId", o.created_at as date, o.items, o.total, 
           o.status, o.guest_name as "guestName", u.full_name as "customerName", 
           u.lk_id as lkid, o.subtotal, o.discount, o.sales_rep as "salesRep"
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
    LIMIT 50
  `);

  // 5. Fetch Chapter Pools
  const chapterPools = await Database.query(`
    SELECT cp.id, cp.current_leaves_balance as balance, cp.target_leaves_limit as limit, 
           c.name as "chapterName"
    FROM chapter_pools cp
    JOIN chapters c ON c.id = cp.chapter_id
    ORDER BY c.name ASC
  `);

  // 6. Fetch Weekly Prompts
  const prompts = await Database.query(`
    SELECT id, prompt_text as "promptText", active_date as "activeDate", created_at as "date"
    FROM prompts
    ORDER BY active_date DESC, created_at DESC
  `);

  // 7. Fetch Active Book of the Month
  const currentBotm = await Database.queryOne(`
    SELECT id, title, author, image_url as "imageUrl", teaser, price, purchase_link as "purchaseLink"
    FROM book_of_the_month
    WHERE active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  `);

  // 8. Fetch upcoming birthdays (next 30 days)
  const allUsersWithBirthdays = await Database.query(`
    SELECT u.id, u.full_name as name, u.email, u.whatsapp, u.birthday, c.name as chapter
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    WHERE u.birthday IS NOT NULL
  `);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBirthdays = allUsersWithBirthdays.map(member => {
    const bdayDate = new Date(member.birthday);
    const nextBday = new Date(today.getFullYear(), bdayDate.getMonth(), bdayDate.getDate());
    if (nextBday < today) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = nextBday - today;
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...member,
      birthday: member.birthday ? new Date(member.birthday).toISOString().split('T')[0] : null,
      daysUntil
    };
  })
  .filter(member => member.daysUntil <= 30)
  .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <AdminClient 
      initialMembers={members}
      initialSubmissions={submissions}
      initialOrders={orders}
      initialPools={chapterPools}
      initialPrompts={prompts}
      initialBotm={currentBotm}
      initialBirthdays={upcomingBirthdays}
      userPermissions={permissions}
      isSuperadmin={isSuperadmin}
    />
  );
}
