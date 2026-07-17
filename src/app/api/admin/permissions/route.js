import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

const SUPERADMIN_EMAILS = ["umorgan2001@gmail.com", "paperthoughts01@gmail.com"];

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

    // Only Superadmin is authorized to modify permissions
    const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
    const isSuperadmin = SUPERADMIN_EMAILS.includes(email);
    if (!isSuperadmin) {
      return NextResponse.json({ success: false, error: 'Access denied: Superadmin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, permissions } = body;

    if (!userId || !Array.isArray(permissions)) {
      return NextResponse.json({ success: false, error: 'Invalid payload: userId and permissions array are required.' }, { status: 400 });
    }

    // Sanitize permissions to only allow seeded ones
    const allowedPermissions = ['moderate_submissions', 'manage_chapter_events', 'view_sales_logs', 'community_manager'];
    const sanitizedPermissions = permissions.filter(p => allowedPermissions.includes(p));

    // Ensure the new community_manager permission is seeded in the database
    await Database.query(`
      INSERT INTO permissions (permission_key) 
      VALUES ('community_manager') 
      ON CONFLICT (permission_key) DO NOTHING
    `);

    // Update inside a transaction
    await Database.transaction(async (client) => {
      // 1. Clear existing user permissions
      await client.query(`
        DELETE FROM user_permissions WHERE user_id = $1
      `, [userId]);

      // 2. Insert new ones if present
      if (sanitizedPermissions.length > 0) {
        await client.query(`
          INSERT INTO user_permissions (user_id, permission_id)
          SELECT $1, id FROM permissions 
          WHERE permission_key = ANY($2::text[])
        `, [userId, sanitizedPermissions]);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User permissions updated successfully.',
      permissions: sanitizedPermissions
    });

  } catch (error) {
    console.error('Failed to update admin permissions:', error);
    return NextResponse.json({ success: false, error: error.message || 'Operation failed' }, { status: 500 });
  }
}
