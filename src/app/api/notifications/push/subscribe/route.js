import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser } from '@/lib/permissions';
import { savePushSubscription } from '@/lib/pushNotifications';

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

    const body = await request.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ success: false, error: 'Invalid push subscription payload' }, { status: 400 });
    }

    const saved = await savePushSubscription(dbUser.id, subscription, userAgent || request.headers.get('user-agent') || '');

    return NextResponse.json({
      success: true,
      message: 'Push subscription successfully registered with Paper Thoughts Sanctuary',
      id: saved.id
    });
  } catch (err) {
    console.error('POST /api/notifications/push/subscribe error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
