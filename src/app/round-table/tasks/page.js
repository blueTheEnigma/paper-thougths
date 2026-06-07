import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCrewMember } from '@/lib/round-table';
import { Database } from '@/lib/db';
import TaskBoard from './TaskBoard';

export const metadata = {
  title: "Kanban Task Board - Paper Thoughts CRM",
  description: "Manage tasks, review states, and coordinate department reviews.",
};

export default async function TasksPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/round-table/tasks');
  }

  const crewMember = await getCrewMember(user.id);
  if (!crewMember) {
    redirect('/dashboard');
  }

  // 1. Fetch initial tasks (default state: list all)
  const tasks = await Database.query(`
    SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.position, t.created_at,
           t.department_id, d.name as department_name, d.color as department_color, d.icon as department_icon,
           t.review_department_id, rd.name as review_department_name, rd.color as review_department_color, rd.icon as review_department_icon,
           COALESCE(
             (SELECT json_agg(json_build_object('id', cm.id, 'name', u.full_name, 'email', u.email))
              FROM crew_task_assignees cta
              JOIN crew_members cm ON cm.id = cta.crew_member_id
              JOIN users u ON u.id = cm.user_id
              WHERE cta.task_id = t.id),
             '[]'::json
           ) as assignees,
           COALESCE(
             (SELECT json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color))
              FROM crew_task_labels ctl
              JOIN crew_labels l ON l.id = ctl.label_id
              WHERE ctl.task_id = t.id),
             '[]'::json
           ) as labels,
           (SELECT COUNT(*) FROM crew_comments WHERE task_id = t.id) as comment_count,
           (SELECT COUNT(*) FROM crew_attachments WHERE task_id = t.id) as attachment_count
    FROM crew_tasks t
    LEFT JOIN crew_departments d ON d.id = t.department_id
    LEFT JOIN crew_departments rd ON rd.id = t.review_department_id
    ORDER BY t.status, t.position ASC
  `);

  // 2. Fetch crew members for drop-down filters
  const crewMembers = await Database.query(`
    SELECT cm.id as crew_member_id, u.full_name 
    FROM crew_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.is_active = TRUE
    ORDER BY u.full_name ASC
  `);

  // 3. Fetch departments for drop-down filters
  const departments = await Database.query(`
    SELECT * FROM crew_departments 
    ORDER BY name ASC
  `);

  return (
    <TaskBoard 
      initialTasks={tasks}
      departments={departments}
      crewMembers={crewMembers}
      currentCrewMember={crewMember}
    />
  );
}
