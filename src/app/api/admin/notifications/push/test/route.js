import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser, getUserPermissions } from '@/lib/permissions';
import { broadcastPushNotification, sendPushNotification } from '@/lib/pushNotifications';

const SUPERADMIN_EMAILS = ["umorgan2001@gmail.com", "paperthoughts01@gmail.com"];

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
    const isSuperadmin = SUPERADMIN_EMAILS.includes(email);
    const permissions = await getUserPermissions(clerkUser.id);

    if (!isSuperadmin && !permissions.includes('community_manager') && !permissions.includes('manage_crucible')) {
      return NextResponse.json({ success: false, error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: pushBody, link, userId, broadcast } = body;

    let result;
    if (broadcast) {
      result = await broadcastPushNotification({
        title: title || 'Paper Thoughts Test Broadcast 📣',
        body: pushBody || 'This is a test notification from the Sanctuary Control Room.',
        link: link || 'https://www.paperthoughts.org/village'
      });
    } else {
      const dbUser = await syncOrCreateUser(clerkUser);
      const targetUserId = userId || dbUser.id;
      result = await sendPushNotification(targetUserId, {
        title: title || 'Paper Thoughts Test Notification 🔔',
        body: pushBody || 'Testing native lock-screen delivery for your device.',
        link: link || 'https://www.paperthoughts.org/dashboard'
      });
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (err) {
    console.error('POST /api/admin/notifications/push/test error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
