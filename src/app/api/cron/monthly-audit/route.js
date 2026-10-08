import { NextResponse } from 'next/server';
import { runMonthlyGovernanceAudit } from '@/lib/crucible';

export async function GET(request) {
  return handleAudit(request);
}

export async function POST(request) {
  return handleAudit(request);
}

async function handleAudit(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify bearer token if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const auditResults = await runMonthlyGovernanceAudit();

    return NextResponse.json({
      success: true,
      message: 'Monthly Paper Thoughts Crucible Governance Audit executed successfully',
      ...auditResults
    });
  } catch (err) {
    console.error('CRON monthly-audit error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
