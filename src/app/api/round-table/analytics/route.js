import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember } from '@/lib/round-table';

export async function GET(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 1. Task Velocity: completed per week over the last 8 weeks
    const velocity = await Database.query(`
      SELECT date_trunc('week', updated_at) as week, COUNT(*) as count
      FROM crew_tasks
      WHERE status = 'done' AND updated_at >= NOW() - INTERVAL '8 weeks'
      GROUP BY week
      ORDER BY week ASC
    `);

    // 2. Department Workload: open tasks by department
    const workload = await Database.query(`
      SELECT d.id, d.name as name, d.color,
             COUNT(CASE WHEN t.status != 'done' THEN 1 END) as open_tasks,
             COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
             COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
             COUNT(CASE WHEN t.status = 'review' THEN 1 END) as review_tasks,
             COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_tasks
      FROM crew_departments d
      LEFT JOIN crew_tasks t ON t.department_id = d.id
      GROUP BY d.id, d.name, d.color
      ORDER BY name ASC
    `);

    // 3. Member Productivity Leaderboard
    const productivity = await Database.query(`
      SELECT cm.id as crew_member_id, u.full_name as name, u.email, COUNT(*) as completed_count
      FROM crew_task_assignees cta
      JOIN crew_members cm ON cm.id = cta.crew_member_id
      JOIN users u ON u.id = cm.user_id
      JOIN crew_tasks t ON t.id = cta.task_id
      WHERE t.status = 'done'
      GROUP BY cm.id, u.full_name, u.email
      ORDER BY completed_count DESC
      LIMIT 10
    `);

    // 4. Overdue Tasks list
    const overdue = await Database.query(`
      SELECT t.id, t.title, t.priority, t.due_date, d.name as department_name, d.color as department_color
      FROM crew_tasks t
      LEFT JOIN crew_departments d ON d.id = t.department_id
      WHERE t.status != 'done' AND t.due_date < CURRENT_DATE
      ORDER BY t.due_date ASC
      LIMIT 10
    `);

    // 5. Bottlenecks: Tasks stuck in Review longest
    const bottlenecks = await Database.query(`
      SELECT t.id, t.title, d.name as department_name, d.color as department_color,
             EXTRACT(EPOCH FROM (NOW() - t.updated_at))/86400 as days_in_review
      FROM crew_tasks t
      LEFT JOIN crew_departments d ON d.id = t.department_id
      WHERE t.status = 'review'
      ORDER BY days_in_review DESC
      LIMIT 10
    `);

    // 6. Generic CRM Metrics Summary
    const summary = await Database.queryOne(`
      SELECT 
        COUNT(CASE WHEN status != 'done' THEN 1 END) as open_tasks,
        COUNT(CASE WHEN status = 'done' AND updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as completed_this_week,
        COUNT(CASE WHEN status = 'review' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) as overdue_count
      FROM crew_tasks
    `);

    return NextResponse.json({
      success: true,
      data: {
        velocity,
        workload,
        productivity,
        overdue,
        bottlenecks,
        summary
      }
    });
  } catch (error) {
    console.error("GET /api/round-table/analytics error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
