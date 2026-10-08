import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, getUserPermissions } from '@/lib/permissions';
import { 
  getCrucibleData, 
  evictMember, 
  pardonMember, 
  grantSabbatical, 
  endSabbatical, 
  adjudicateReturnerPetition, 
  runMonthlyGovernanceAudit 
} from '@/lib/crucible';

const SUPERADMIN_EMAILS = ["umorgan2001@gmail.com", "paperthoughts01@gmail.com"];

async function checkCrucibleAuthorization(clerkUser) {
  if (!clerkUser) return false;
  const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
  if (SUPERADMIN_EMAILS.includes(email)) return true;

  const dbUser = await syncOrCreateUser(clerkUser);
  if (!dbUser) return false;

  const permissions = await getUserPermissions(clerkUser.id);
  if (permissions.includes('manage_crucible') || permissions.includes('community_manager') || permissions.includes('manage_chapter_events')) {
    return true;
  }

  // Check crew role
  const cm = await Database.queryOne(`
    SELECT 1 FROM crew_members cm
    LEFT JOIN crew_member_departments cmd ON cmd.crew_member_id = cm.id
    LEFT JOIN crew_departments cd ON cd.id = cmd.department_id
    WHERE cm.user_id = $1 
      AND cm.is_active = TRUE 
      AND (cd.name = 'Events & Community' OR cm.role = 'admin')
  `, [dbUser.id]);

  return !!cm;
}

export async function GET() {
  try {
    const clerkUser = await currentUser();
    const authorized = await checkCrucibleAuthorization(clerkUser);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const data = await getCrucibleData();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('GET /api/admin/crucible error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    const authorized = await checkCrucibleAuthorization(clerkUser);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, reason, resetStrikes, grantSilverBullet, durationMonths, sabbaticalType, subAction } = body;

    let result = null;

    switch (action) {
      case 'evict':
        if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        result = await evictMember(userId, clerkUser.id, reason || 'Accumulated 3 probation strikes');
        break;

      case 'pardon':
        if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        result = await pardonMember(userId, resetStrikes ?? true, grantSilverBullet ?? false);
        break;

      case 'sabbatical':
        if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        result = await grantSabbatical(userId, durationMonths || 1, sabbaticalType || 'general');
        break;

      case 'end_sabbatical':
        if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        result = await endSabbatical(userId);
        break;

      case 'adjudicate_returner':
        if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        result = await adjudicateReturnerPetition(userId, subAction || 'approve');
        break;

      case 'audit':
        result = await runMonthlyGovernanceAudit();
        break;

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Return updated crucible state so client UI can seamlessly sync
    const refreshedData = await getCrucibleData();

    return NextResponse.json({
      success: true,
      result,
      data: refreshedData
    });
  } catch (err) {
    console.error('POST /api/admin/crucible error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
