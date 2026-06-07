import { Database } from './db';
import { isCrewMember } from './permissions';
import { redirect } from 'next/navigation';

export const DEPARTMENTS = [
  { name: 'Marketing', color: '#F59E0B', icon: 'megaphone' },
  { name: 'Design', color: '#8B5CF6', icon: 'palette' },
  { name: 'Content & Editorial', color: '#3B82F6', icon: 'pen-tool' },
  { name: 'Events & Community', color: '#10B981', icon: 'calendar-heart' },
  { name: 'Bookstore & Sales', color: '#EF4444', icon: 'shopping-bag' },
  { name: 'Operations', color: '#6B7280', icon: 'settings' }
];

export async function getCrewMember(clerkId) {
  if (!clerkId) return null;
  
  try {
    // 1. Get user details from users table
    const dbUser = await Database.queryOne(`
      SELECT id, email, full_name, lk_id FROM users WHERE clerk_id = $1
    `, [clerkId]);

    if (!dbUser) return null;

    // 2. Check if user is superadmin
    const superadminEmail = (process.env.SUPERADMIN_EMAIL || "umorgan2001@gmail.com").toLowerCase();
    const isSuper = dbUser.email && dbUser.email.toLowerCase() === superadminEmail;

    // 3. Get crew member record
    let crewMember = await Database.queryOne(`
      SELECT id, role, is_active FROM crew_members 
      WHERE user_id = $1
    `, [dbUser.id]);

    // If they are superadmin but don't have a crew_members record, we auto-create one
    if (!crewMember && isSuper) {
      // Auto-create crew member record for superadmin
      crewMember = await Database.queryOne(`
        INSERT INTO crew_members (user_id, role)
        VALUES ($1, 'admin')
        RETURNING id, role, is_active
      `, [dbUser.id]);
    }

    if (!crewMember) return null;
    if (!crewMember.is_active) return null;

    // 4. Fetch their departments
    const depts = await Database.query(`
      SELECT d.id, d.name, d.color, d.icon 
      FROM crew_member_departments cmd
      JOIN crew_departments d ON d.id = cmd.department_id
      WHERE cmd.crew_member_id = $1
    `, [crewMember.id]);

    return {
      id: crewMember.id,
      userId: dbUser.id,
      fullName: dbUser.full_name,
      email: dbUser.email,
      lkId: dbUser.lk_id,
      role: crewMember.role,
      isSuperadmin: isSuper,
      departments: depts
    };
  } catch (error) {
    console.error("Error in getCrewMember:", error);
    return null;
  }
}

export async function requireCrewAccess(clerkId) {
  const isMember = await isCrewMember(clerkId);
  if (!isMember) {
    redirect('/dashboard');
  }
  return isMember;
}

export async function logActivity(actorId, action, entityType, entityId, metadata = {}) {
  try {
    await Database.query(`
      INSERT INTO crew_activity_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [actorId, action, entityType, entityId, JSON.stringify(metadata)]);
    return true;
  } catch (error) {
    console.error("Error logging activity:", error);
    return false;
  }
}

export async function createNotification(recipientId, type, title, body, link) {
  try {
    await Database.query(`
      INSERT INTO crew_notifications (recipient_id, type, title, body, link)
      VALUES ($1, $2, $3, $4, $5)
    `, [recipientId, type, title, body, link]);
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}
