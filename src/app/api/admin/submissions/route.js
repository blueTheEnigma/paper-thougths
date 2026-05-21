import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

export async function PATCH(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    // Auth verification: must be superadmin or have moderate_submissions permission
    const isSuperadmin = clerkUser.primaryEmailAddress?.emailAddress === SUPERADMIN_EMAIL;
    const canModerate = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !canModerate) {
      return NextResponse.json({ success: false, error: 'Access denied: Insufficient privileges.' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId, status } = body;

    const allowedStatuses = ['queued', 'active_batch', 'archived', 'draft'];
    if (!submissionId || !status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid submission ID or status.' }, { status: 400 });
    }

    // Update status in PostgreSQL database
    const updated = await Database.queryOne(`
      UPDATE submissions 
      SET batch_status = $1 
      WHERE id = $2
      RETURNING id, title, batch_status
    `, [status, submissionId]);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Submission status updated to '${status}' successfully.`,
      submission: updated
    });

  } catch (error) {
    console.error('Moderation status update failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Operation failed' }, { status: 500 });
  }
}
