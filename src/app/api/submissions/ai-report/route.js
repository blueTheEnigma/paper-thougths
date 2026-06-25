import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export async function GET(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const submissionIdStr = searchParams.get('submissionId');

    if (!submissionIdStr) {
      return NextResponse.json({ success: false, error: 'Missing submissionId query parameter.' }, { status: 400 });
    }

    const submissionId = parseInt(submissionIdStr, 10);

    // 1. Fetch submission details to ensure this user is the author
    const submission = await Database.queryOne(`
      SELECT id, author_id, title, is_revised as "isRevised" 
      FROM submissions 
      WHERE id = $1
    `, [submissionId]);

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
    }

    if (submission.author_id !== dbUser.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized. You are not the author of this submission.' }, { status: 403 });
    }

    // 2. Fetch AI Report
    const report = await Database.queryOne(`
      SELECT intent_metrics as "intentMetrics", 
             structural_metrics as "structuralMetrics",
             synthesized_mirror as "synthesizedMirror",
             synthesized_highwater as "synthesizedHighwater",
             synthesized_pivot as "synthesizedPivot",
             created_at as "createdAt"
      FROM submission_ai_reports 
      WHERE submission_id = $1
    `, [submissionId]);

    if (!report) {
      return NextResponse.json({ success: false, error: 'No feedback report compiled for this submission yet.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report,
      submission: {
        id: submission.id,
        title: submission.title,
        isRevised: submission.isRevised
      }
    });

  } catch (error) {
    console.error('Failed to load AI report:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
