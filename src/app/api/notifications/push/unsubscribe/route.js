import { NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/pushNotifications';

export async function POST(request) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'Endpoint is required' }, { status: 400 });
    }

    await deletePushSubscription(endpoint);

    return NextResponse.json({
      success: true,
      message: 'Push subscription successfully removed'
    });
  } catch (err) {
    console.error('POST /api/notifications/push/unsubscribe error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
