import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember, logActivity, createNotification } from '@/lib/round-table';

// GET - Fetch a single task with details
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch task details
    const task = await Database.queryOne(`
      SELECT t.*, 
             d.name as department_name, d.color as department_color, d.icon as department_icon,
             rd.name as review_department_name, rd.color as review_department_color, rd.icon as review_department_icon
      FROM crew_tasks t
      LEFT JOIN crew_departments d ON d.id = t.department_id
      LEFT JOIN crew_departments rd ON rd.id = t.review_department_id
      WHERE t.id = $1
    `, [id]);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // 2. Fetch assignees
    const assignees = await Database.query(`
      SELECT cm.id, u.full_name, u.email, u.lk_id
      FROM crew_task_assignees cta
      JOIN crew_members cm ON cm.id = cta.crew_member_id
      JOIN users u ON u.id = cm.user_id
      WHERE cta.task_id = $1
    `, [id]);

    // 3. Fetch labels
    const labels = await Database.query(`
      SELECT l.id, l.name, l.color
      FROM crew_task_labels ctl
      JOIN crew_labels l ON l.id = ctl.label_id
      WHERE ctl.task_id = $1
    `, [id]);

    // 4. Fetch comments
    const comments = await Database.query(`
      SELECT tc.id, tc.body, tc.created_at,
             u.full_name as author_name, u.email as author_email, cm.role as author_role
      FROM crew_comments tc
      LEFT JOIN crew_members cm ON cm.id = tc.author_id
      LEFT JOIN users u ON u.id = cm.user_id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
    `, [id]);

    // 5. Fetch attachments
    const attachments = await Database.query(`
      SELECT ca.id, ca.file_name, ca.file_path, ca.file_size, ca.mime_type, ca.created_at,
             u.full_name as uploader_name
      FROM crew_attachments ca
      LEFT JOIN crew_members cm ON cm.id = ca.uploaded_by
      LEFT JOIN users u ON u.id = cm.user_id
      WHERE ca.task_id = $1
      ORDER BY ca.created_at DESC
    `, [id]);

    // 6. Fetch activity logs for this task
    const activity = await Database.query(`
      SELECT al.*, u.full_name, u.email
      FROM crew_activity_log al
      LEFT JOIN crew_members cm ON cm.id = al.actor_id
      LEFT JOIN users u ON u.id = cm.user_id
      WHERE al.entity_type = 'task' AND al.entity_id = $1
      ORDER BY al.created_at DESC
      LIMIT 30
    `, [id]);

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        assignees,
        labels,
        comments,
        attachments,
        activity
      }
    });
  } catch (error) {
    console.error("GET /api/round-table/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update task details
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { 
      title, description, status, priority, 
      departmentId, reviewDepartmentId, dueDate, 
      assigneeIds, labelIds 
    } = await req.json();

    const oldTask = await Database.queryOne('SELECT * FROM crew_tasks WHERE id = $1', [id]);
    if (!oldTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    let newAssigneesToNotify = [];

    await Database.transaction(async (client) => {
      // 1. Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
        
        // If status changes, update position in the new column
        if (status !== oldTask.status) {
          const posRes = await client.query(`
            SELECT COALESCE(MAX(position), 0) as max_pos FROM crew_tasks WHERE status = $1
          `, [status]);
          const nextPos = posRes.rows[0].max_pos + 1;
          updates.push(`position = $${paramCount++}`);
          values.push(nextPos);
        }
      }
      if (priority !== undefined) {
        updates.push(`priority = $${paramCount++}`);
        values.push(priority);
      }
      if (departmentId !== undefined) {
        updates.push(`department_id = $${paramCount++}`);
        values.push(departmentId || null);
      }
      if (reviewDepartmentId !== undefined) {
        updates.push(`review_department_id = $${paramCount++}`);
        values.push(reviewDepartmentId || null);
      }
      if (dueDate !== undefined) {
        updates.push(`due_date = $${paramCount++}`);
        values.push(dueDate || null);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(id);
        await client.query(`
          UPDATE crew_tasks 
          SET ${updates.join(', ')} 
          WHERE id = $${paramCount}
        `, values);
      }

      // 2. Update assignees if provided
      if (assigneeIds !== undefined) {
        const oldAssigneesRes = await client.query('SELECT crew_member_id FROM crew_task_assignees WHERE task_id = $1', [id]);
        const oldAssigneeIds = oldAssigneesRes.rows.map(r => r.crew_member_id);

        await client.query('DELETE FROM crew_task_assignees WHERE task_id = $1', [id]);
        for (const assId of assigneeIds) {
          await client.query('INSERT INTO crew_task_assignees (task_id, crew_member_id) VALUES ($1, $2)', [id, assId]);
          if (!oldAssigneeIds.includes(assId) && assId !== caller.id) {
            newAssigneesToNotify.push(assId);
          }
        }
      }

      // 3. Update labels if provided
      if (labelIds !== undefined) {
        await client.query('DELETE FROM crew_task_labels WHERE task_id = $1', [id]);
        for (const lblId of labelIds) {
          await client.query('INSERT INTO crew_task_labels (task_id, label_id) VALUES ($1, $2)', [id, lblId]);
        }
      }
    });

    const currentTitle = title || oldTask.title;

    // Send notifications to newly assigned crew members
    if (newAssigneesToNotify.length > 0) {
      for (const assigneeId of newAssigneesToNotify) {
        await createNotification(
          assigneeId,
          'task_assigned',
          'New Task Assigned',
          `You have been assigned the task: "${currentTitle}"`,
          `/round-table/tasks?task=${id}`
        );
      }
    }

    // Log status change
    if (status && status !== oldTask.status) {
      await logActivity(caller.id, 'status_changed', 'task', id, {
        taskTitle: currentTitle,
        from: oldTask.status,
        to: status
      });

      // Special Behavior: Trigger notification for review department crew members
      if (status === 'review') {
        const activeReviewDeptId = reviewDepartmentId !== undefined ? reviewDepartmentId : oldTask.review_department_id;
        if (activeReviewDeptId) {
          const reviewers = await Database.query(`
            SELECT cmd.crew_member_id FROM crew_member_departments cmd
            WHERE cmd.department_id = $1
          `, [activeReviewDeptId]);

          for (const reviewer of reviewers) {
            if (reviewer.crew_member_id !== caller.id) {
              await createNotification(
                reviewer.crew_member_id,
                'review_requested',
                'Review Requested',
                `Task "${currentTitle}" is awaiting review from your department.`,
                `/round-table/tasks?task=${id}`
              );
            }
          }
        }
      }
    } else {
      await logActivity(caller.id, 'task_updated', 'task', id, { taskTitle: currentTitle });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/round-table/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const task = await Database.queryOne('SELECT * FROM crew_tasks WHERE id = $1', [id]);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Only creator or admin/lead can delete tasks
    if (task.created_by !== caller.id && caller.role !== 'admin' && caller.role !== 'lead' && !caller.isSuperadmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await Database.query('DELETE FROM crew_tasks WHERE id = $1', [id]);
    await logActivity(caller.id, 'task_deleted', 'task', id, { taskTitle: task.title });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/round-table/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
