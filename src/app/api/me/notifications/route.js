import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const notifications = await Database.query(`
      SELECT id, type, title, body, link, is_read, created_at
      FROM user_notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('GET /api/me/notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, notificationId, markAll } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    if (markAll) {
      await Database.query(`
        UPDATE user_notifications
        SET is_read = TRUE
        WHERE user_id = $1
      `, [userId]);
    } else if (notificationId) {
      await Database.query(`
        UPDATE user_notifications
        SET is_read = TRUE
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/me/notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
