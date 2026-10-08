import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import { restoreReturnerMembership } from '@/lib/governance';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const result = await restoreReturnerMembership(dbUser.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to restore returner membership:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to restore sanctuary access',
    }, { status: 400 });
  }
}
