import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember, logActivity, createNotification } from '@/lib/round-table';

// GET - Fetch tasks with filters
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

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const labelId = searchParams.get('labelId');

    const params = [];
    let paramIndex = 1;
    const conditions = [];

    // Filter by department
    if (departmentId) {
      conditions.push(`t.department_id = $${paramIndex++}`);
      params.push(parseInt(departmentId));
    }

    // Filter by assignee
    if (assigneeId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM crew_task_assignees cta 
        WHERE cta.task_id = t.id AND cta.crew_member_id = $${paramIndex++}
      )`);
      params.push(parseInt(assigneeId));
    }

    // Filter by priority
    if (priority) {
      conditions.push(`t.priority = $${paramIndex++}`);
      params.push(priority);
    }

    // Filter by status
    if (status) {
      conditions.push(`t.status = $${paramIndex++}`);
      params.push(status);
    }

    // Filter by label
    if (labelId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM crew_task_labels ctl 
        WHERE ctl.task_id = t.id AND ctl.label_id = $${paramIndex++}
      )`);
      params.push(parseInt(labelId));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
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
      ${whereClause}
      ORDER BY t.status, t.position ASC
    `;

    const tasks = await Database.query(query, params);

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("GET /api/round-table/tasks error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create task
export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { 
      title, description, status = 'todo', priority = 'medium', 
      departmentId, reviewDepartmentId, dueDate, 
      assigneeIds, labelIds 
    } = await req.json();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const taskId = await Database.transaction(async (client) => {
      // 1. Get next position in column
      const posRes = await client.query(`
        SELECT COALESCE(MAX(position), 0) as max_pos FROM crew_tasks WHERE status = $1
      `, [status]);
      const nextPos = posRes.rows[0].max_pos + 1;

      // 2. Insert task
      const taskRes = await client.query(`
        INSERT INTO crew_tasks (title, description, status, priority, department_id, review_department_id, created_by, due_date, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [title, description, status, priority, departmentId || null, reviewDepartmentId || null, caller.id, dueDate || null, nextPos]);

      const id = taskRes.rows[0].id;

      // 3. Add assignees
      if (assigneeIds && assigneeIds.length > 0) {
        for (const assigneeId of assigneeIds) {
          await client.query(`
            INSERT INTO crew_task_assignees (task_id, crew_member_id)
            VALUES ($1, $2)
          `, [id, assigneeId]);
        }
      }

      // 4. Add labels
      if (labelIds && labelIds.length > 0) {
        for (const lblId of labelIds) {
          await client.query(`
            INSERT INTO crew_task_labels (task_id, label_id)
            VALUES ($1, $2)
          `, [id, lblId]);
        }
      }

      return id;
    });

    // Write activity log
    await logActivity(caller.id, 'task_created', 'task', taskId, { taskTitle: title });

    // Send notifications to assignees
    if (assigneeIds && assigneeIds.length > 0) {
      for (const assigneeId of assigneeIds) {
        if (assigneeId !== caller.id) {
          await createNotification(
            assigneeId,
            'task_assigned',
            'New Task Assigned',
            `You have been assigned the task: "${title}"`,
            `/round-table/tasks?task=${taskId}`
          );
        }
      }
    }

    return NextResponse.json({ success: true, taskId });
  } catch (error) {
    console.error("POST /api/round-table/tasks error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
