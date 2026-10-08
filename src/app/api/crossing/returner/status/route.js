import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import { getReturnerCrossingProgress } from '@/lib/governance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const progress = await getReturnerCrossingProgress(dbUser.id);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Failed to get returner status:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve returner status',
    }, { status: 500 });
  }
}
