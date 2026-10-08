import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const days = body.days === 60 ? 60 : 30; // 30 or 60 days
    const reason = body.reason && typeof body.reason === 'string' ? body.reason.trim() : 'Academic / Exam Sabbatical';

    // 1. Check if user already has an active sabbatical
    const userRow = await Database.queryOne(`
      SELECT sabbatical_until, sabbatical_requested_at, membership_status 
      FROM users 
      WHERE id = $1
    `, [dbUser.id]);

    const now = new Date();
    if (userRow?.sabbatical_until && new Date(userRow.sabbatical_until) > now) {
      return NextResponse.json({
        success: false,
        error: `You already have an active sabbatical until ${new Date(userRow.sabbatical_until).toLocaleDateString()}.`
      }, { status: 400 });
    }

    // 2. Check if user already took a sabbatical in this calendar year
    const currentYear = now.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
    if (userRow?.sabbatical_requested_at && new Date(userRow.sabbatical_requested_at) >= startOfYear) {
      return NextResponse.json({
        success: false,
        error: `Academic Sabbaticals are limited to once per calendar year. You have already utilized your sabbatical for ${currentYear}. Contact an administrator if you require an emergency extension.`
      }, { status: 400 });
    }

    // 3. Grant sabbatical
    const sabbaticalUntilDate = new Date();
    sabbaticalUntilDate.setDate(sabbaticalUntilDate.getDate() + days);

    await Database.query(`
      UPDATE users 
      SET sabbatical_until = $1,
          sabbatical_type = $2,
          sabbatical_requested_at = NOW()
      WHERE id = $3
    `, [sabbaticalUntilDate.toISOString().split('T')[0], reason, dbUser.id]);

    return NextResponse.json({
      success: true,
      sabbaticalUntil: sabbaticalUntilDate.toISOString().split('T')[0],
      days,
      message: `Academic Sabbatical granted for ${days} days until ${sabbaticalUntilDate.toLocaleDateString()}. Your review strikes and BOTM counters are safely frozen.`
    });

  } catch (error) {
    console.error('Failed to request sabbatical:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to request sabbatical'
    }, { status: 500 });
  }
}
