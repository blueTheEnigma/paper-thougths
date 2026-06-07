import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember, logActivity, createNotification } from '@/lib/round-table';

// GET - Fetch comments for a task
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

    const comments = await Database.query(`
      SELECT tc.id, tc.body, tc.created_at,
             u.full_name as author_name, u.email as author_email, cm.role as author_role
      FROM crew_comments tc
      JOIN crew_members cm ON cm.id = tc.author_id
      JOIN users u ON u.id = cm.user_id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
    `, [id]);

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("GET /api/round-table/tasks/[id]/comments error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Add a comment to a task
export async function POST(req, { params }) {
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

    const { body } = await req.json();
    if (!body || body.trim() === '') {
      return NextResponse.json({ success: false, error: 'Comment body is required' }, { status: 400 });
    }

    const commentRes = await Database.queryOne(`
      INSERT INTO crew_comments (task_id, author_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, created_at
    `, [id, caller.id, body]);

    const task = await Database.queryOne('SELECT title, created_by FROM crew_tasks WHERE id = $1', [id]);
    await logActivity(caller.id, 'comment_added', 'task', id, { taskTitle: task?.title });

    // Send notifications to assignees and creator
    const notificationList = new Set();
    
    // Add task creator
    if (task && task.created_by !== caller.id) {
      notificationList.add(task.created_by);
    }

    // Add other assignees
    const assignees = await Database.query('SELECT crew_member_id FROM crew_task_assignees WHERE task_id = $1', [id]);
    for (const assignee of assignees) {
      if (assignee.crew_member_id !== caller.id) {
        notificationList.add(assignee.crew_member_id);
      }
    }

    // Send notifications
    for (const recipientId of notificationList) {
      await createNotification(
        recipientId,
        'comment_added',
        'New Comment Added',
        `${caller.fullName} commented on task "${task?.title || 'task'}"`,
        `/round-table/tasks?task=${id}`
      );
    }

    return NextResponse.json({ 
      success: true, 
      comment: {
        id: commentRes.id,
        body,
        created_at: commentRes.created_at,
        author_name: caller.fullName,
        author_email: caller.email,
        author_role: caller.role
      } 
    });
  } catch (error) {
    console.error("POST /api/round-table/tasks/[id]/comments error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
