import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember } from '@/lib/round-table';

// GET - Fetch crew member notifications
export async function GET(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const notifications = await Database.query(`
      SELECT * FROM crew_notifications 
      WHERE recipient_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [caller.id]);

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("GET /api/round-table/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Mark notifications as read
export async function PATCH(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { action, notificationId } = await req.json();

    if (action === 'read_all') {
      await Database.query(`
        UPDATE crew_notifications SET is_read = TRUE WHERE recipient_id = $1
      `, [caller.id]);
    } else if (notificationId) {
      await Database.query(`
        UPDATE crew_notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2
      `, [notificationId, caller.id]);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action parameters' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/round-table/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
