import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember, logActivity, createNotification } from '@/lib/round-table';

// PATCH - Reorder tasks batch update
export async function PATCH(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { tasks, draggedTaskId, oldStatus, newStatus } = await req.json();

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ success: false, error: 'Tasks list is required' }, { status: 400 });
    }

    await Database.transaction(async (client) => {
      for (const item of tasks) {
        await client.query(`
          UPDATE crew_tasks 
          SET position = $1, status = $2, updated_at = NOW()
          WHERE id = $3
        `, [item.position, item.status, item.id]);
      }
    });

    // If a specific task was dragged and its status changed, log it and notify
    if (draggedTaskId && oldStatus && newStatus && oldStatus !== newStatus) {
      const task = await Database.queryOne('SELECT title, review_department_id FROM crew_tasks WHERE id = $1', [draggedTaskId]);
      
      await logActivity(caller.id, 'status_changed', 'task', draggedTaskId, {
        taskTitle: task?.title,
        from: oldStatus,
        to: newStatus
      });

      // Notify review department if review is requested
      if (newStatus === 'review' && task?.review_department_id) {
        const reviewers = await Database.query(`
          SELECT cmd.crew_member_id FROM crew_member_departments cmd
          WHERE cmd.department_id = $1
        `, [task.review_department_id]);

        for (const reviewer of reviewers) {
          if (reviewer.crew_member_id !== caller.id) {
            await createNotification(
              reviewer.crew_member_id,
              'review_requested',
              'Review Requested',
              `Task "${task.title}" is awaiting review from your department.`,
              `/round-table/tasks?task=${draggedTaskId}`
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/round-table/tasks/reorder error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
