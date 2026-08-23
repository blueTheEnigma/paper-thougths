import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Database } from '@/lib/db';
import { syncOrCreateUser, getUserPermissions } from '@/lib/permissions';
import AdminClient from './AdminClient';

export const metadata = {
  title: "Admin Control Center - Paper Thoughts",
  description: "Administrative console for managing literary batches, bookstore ledger, and chapter members.",
};

const SUPERADMIN_EMAILS = ["umorgan2001@gmail.com", "paperthoughts01@gmail.com"];

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
  const isSuperadmin = SUPERADMIN_EMAILS.includes(email);

  const communityManagerRes = await Database.queryOne(`
    SELECT 1 FROM crew_members cm
    LEFT JOIN crew_member_departments cmd ON cmd.crew_member_id = cm.id
    LEFT JOIN crew_departments cd ON cd.id = cmd.department_id
    WHERE cm.user_id = $1 
      AND cm.is_active = TRUE 
      AND (cd.name = 'Events & Community' OR cm.role = 'admin')
  `, [dbUser.id]);
  const isCommunityManager = !!communityManagerRes || permissions.includes('community_manager') || permissions.includes('manage_chapter_events');

  // If user has no admin permissions, isn't the superadmin, and isn't a community manager, bounce them back to dashboard
  if (permissions.length === 0 && !isSuperadmin && !isCommunityManager) {
    redirect('/dashboard');
  }

  // 2. Fetch Members Ledger (Lifetime Leaves)
  const membersRaw = await Database.query(`
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

  const members = membersRaw.map(m => ({
    ...m,
    milestoneTokens: parseFloat(m.milestoneTokens || 0),
    spendableLeaves: parseInt(m.spendableLeaves || 0),
    lifetimeLeaves: parseInt(m.lifetimeLeaves || 0),
    vouchersGifted: parseInt(m.vouchersGifted || 0),
    streak: parseInt(m.streak || 0)
  }));

  // 3. Fetch Submissions (For Batch Moderation & Social Quotes Vault)
  const submissions = await Database.query(`
    SELECT s.id, s.title, s.genre, s.logline, s.body_text as "bodyText", s.batch_status as status, 
           u.full_name as author, u.instagram as "authorInstagram", u.email as "authorEmail",
           c.name as chapter, s.has_laurel as laurel, s.created_at as date
    FROM submissions s
    JOIN users u ON u.id = s.author_id
    LEFT JOIN chapters c ON c.id = u.chapter_id
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
  const promptsRaw = await Database.query(`
    SELECT id, prompt_text as "promptText", prompt_type as "promptType", active_date as "activeDate", created_at as "date"
    FROM prompts
    ORDER BY active_date DESC, created_at DESC
  `);

  const prompts = promptsRaw.map(p => ({
    ...p,
    activeDate: p.activeDate ? (p.activeDate instanceof Date ? p.activeDate.toISOString().split('T')[0] : String(p.activeDate)) : null,
    date: p.date ? (p.date instanceof Date ? p.date.toISOString() : String(p.date)) : null
  }));

  // 7. Fetch Active Books of the Month
  const currentBotm = await Database.query(`
    SELECT id, title, author, image_url as "imageUrl", teaser, price, purchase_link as "purchaseLink", chapter_id as "chapterId"
    FROM book_of_the_month
    WHERE active = TRUE
    ORDER BY created_at DESC
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
    let bMonth = 0;
    let bDay = 1;
    let birthdayStr = null;

    if (member.birthday) {
      if (typeof member.birthday === 'string') {
        birthdayStr = member.birthday.split('T')[0];
      } else if (member.birthday instanceof Date) {
        birthdayStr = member.birthday.toISOString().split('T')[0];
      } else {
        birthdayStr = String(member.birthday).split('T')[0];
      }
      const parts = birthdayStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[1]) && !isNaN(parts[2])) {
        bMonth = parts[1] - 1;
        bDay = parts[2];
      }
    }

    const nextBday = new Date(today.getFullYear(), bMonth, bDay);
    if (nextBday < today) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = nextBday - today;
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...member,
      birthday: birthdayStr,
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
      isCommunityManager={isCommunityManager}
    />
  );
}
