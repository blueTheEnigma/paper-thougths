import { Database } from './db';
import { isCrewMember } from './permissions';
import { redirect } from 'next/navigation';
import { sendEmail } from './email';

export const DEPARTMENTS = [
  { name: 'Marketing', color: '#F59E0B', icon: 'megaphone' },
  { name: 'Design', color: '#8B5CF6', icon: 'palette' },
  { name: 'Content & Editorial', color: '#3B82F6', icon: 'pen-tool' },
  { name: 'Events & Community', color: '#10B981', icon: 'calendar-heart' },
  { name: 'Bookstore & Sales', color: '#EF4444', icon: 'shopping-bag' },
  { name: 'Operations', color: '#6B7280', icon: 'settings' }
];

function resolveUserIdFilter(identifier) {
  const parsed = parseInt(identifier, 10);
  if (!isNaN(parsed) && String(parsed) === String(identifier).trim()) {
    return { field: 'id', value: parsed };
  }
  return { field: 'clerk_id', value: identifier };
}

export async function getCrewMember(userIdentifier) {
  if (!userIdentifier) return null;
  
  const { field, value } = resolveUserIdFilter(userIdentifier);
  
  try {
    // 1. Get user details from users table
    const dbUser = await Database.queryOne(`
      SELECT id, email, full_name, lk_id FROM users WHERE ${field} = $1
    `, [value]);

    if (!dbUser) return null;

    // 2. Check if user is superadmin
    const superadminEmails = [
      (process.env.SUPERADMIN_EMAIL || "umorgan2001@gmail.com").toLowerCase(),
      "paperthoughts01@gmail.com"
    ];
    const isSuper = dbUser.email && superadminEmails.includes(dbUser.email.toLowerCase());

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

export async function requireCrewAccess(userIdentifier) {
  const isMember = await isCrewMember(userIdentifier);
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

    // Dispatch email notification for high-priority events
    if (type === 'task_assigned' || type === 'review_requested') {
      const recipient = await Database.queryOne(`
        SELECT u.email, u.full_name 
        FROM crew_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.id = $1
      `, [recipientId]);

      if (recipient && recipient.email) {
        const subject = type === 'task_assigned' 
          ? `[The Round Table] Task Assigned: ${title}`
          : `[The Round Table] Review Requested: ${title}`;
          
        const introText = type === 'task_assigned'
          ? `You have been assigned a new task on the Crew Kanban board:`
          : `Your review has been requested for a task on the Crew Kanban board:`;

        await sendEmail({
          to: recipient.email,
          subject: subject,
          html: `
            <div style="font-family: sans-serif; color: #2C1A0E; background-color: #FAF7F2; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(44,26,14,0.12); border-radius: 16px;">
              <h2 style="color: #5C1A2E; font-family: serif; margin-bottom: 16px;">Hello, ${recipient.full_name || 'Crew Member'}</h2>
              <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                ${introText}
              </p>
              <div style="background-color: #FAF7F2; border-left: 4px solid #5C1A2E; padding: 12px 16px; margin: 20px 0; font-style: italic;">
                <strong>${title}</strong><br/>
                ${body || 'No description provided.'}
              </div>
              <div style="margin: 32px 0; text-align: center;">
                <a href="https://paperthoughts.org${link || '/round-table/tasks'}" style="background-color: #5C1A2E; color: #FAF7F2; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(92,26,46,0.25);">
                  View Task on Kanban Board
                </a>
              </div>
              <hr style="border: 0; border-top: 1px solid rgba(44,26,14,0.08); margin: 28px 0;" />
              <p style="font-size: 10px; color: rgba(44,26,14,0.5); font-style: italic; line-height: 1.4; text-align: center;">
                This notification was dispatched automatically by The Round Table CRM.
              </p>
            </div>
          `
        }).catch(err => console.error('Failed to dispatch crew email notification:', err));
      }
    }

    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}
