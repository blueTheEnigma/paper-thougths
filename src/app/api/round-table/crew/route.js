import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember, logActivity } from '@/lib/round-table';

// GET - List crew members or search candidates
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    if (search) {
      // Search users who are not active crew members
      const query = `
        SELECT u.id, u.full_name, u.email, u.lk_id
        FROM users u
        WHERE (u.full_name ILIKE $1 OR u.email ILIKE $1)
        AND u.id NOT IN (
          SELECT user_id FROM crew_members WHERE is_active = TRUE
        )
        LIMIT 10
      `;
      const candidates = await Database.query(query, [`%${search}%`]);
      return NextResponse.json({ success: true, candidates });
    }

    // Default: List active crew members with department details
    const crew = await Database.query(`
      SELECT cm.id as crew_member_id, cm.role, cm.is_active, cm.joined_at,
             u.id as user_id, u.full_name, u.email, u.lk_id,
             COALESCE(
               (SELECT json_agg(json_build_object('id', d.id, 'name', d.name, 'color', d.color, 'icon', d.icon))
                FROM crew_member_departments cmd
                JOIN crew_departments d ON d.id = cmd.department_id
                WHERE cmd.crew_member_id = cm.id),
               '[]'::json
             ) as departments
      FROM crew_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.is_active = TRUE
      ORDER BY cm.joined_at DESC
    `);

    // Fetch all departments for selection dropdowns
    const departments = await Database.query('SELECT * FROM crew_departments ORDER BY name ASC');

    return NextResponse.json({ success: true, crew, departments });
  } catch (error) {
    console.error("GET /api/round-table/crew error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Promote user to crew member
export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller || (caller.role !== 'admin' && caller.role !== 'lead' && !caller.isSuperadmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role, departmentIds } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const result = await Database.transaction(async (client) => {
      // 1. Insert or update crew member record
      let crewRes = await client.query(`
        INSERT INTO crew_members (user_id, role, is_active)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (user_id) DO UPDATE 
        SET role = EXCLUDED.role, is_active = TRUE
        RETURNING id
      `, [userId, role || 'member']);

      const crewMemberId = crewRes.rows[0].id;

      // 2. Clear existing departments
      await client.query(`
        DELETE FROM crew_member_departments WHERE crew_member_id = $1
      `, [crewMemberId]);

      // 3. Insert new departments
      if (departmentIds && departmentIds.length > 0) {
        for (const deptId of departmentIds) {
          await client.query(`
            INSERT INTO crew_member_departments (crew_member_id, department_id)
            VALUES ($1, $2)
          `, [crewMemberId, deptId]);
        }
      }

      return crewMemberId;
    });

    const promotedUser = await Database.queryOne('SELECT full_name FROM users WHERE id = $1', [userId]);
    await logActivity(caller.id, 'member_added', 'member', result, { name: promotedUser?.full_name });

    return NextResponse.json({ success: true, crewMemberId: result });
  } catch (error) {
    console.error("POST /api/round-table/crew error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update crew member role & departments
export async function PATCH(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller || (caller.role !== 'admin' && caller.role !== 'lead' && !caller.isSuperadmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { crewMemberId, role, departmentIds } = await req.json();

    if (!crewMemberId) {
      return NextResponse.json({ success: false, error: 'Crew Member ID is required' }, { status: 400 });
    }

    // Check if updating self role to avoid lockouts
    if (crewMemberId === caller.id && role && role !== caller.role) {
      return NextResponse.json({ success: false, error: 'You cannot change your own role' }, { status: 400 });
    }

    await Database.transaction(async (client) => {
      // 1. Update role if provided
      if (role) {
        await client.query(`
          UPDATE crew_members SET role = $1 WHERE id = $2
        `, [role, crewMemberId]);
      }

      // 2. Re-assign departments
      if (departmentIds) {
        await client.query(`
          DELETE FROM crew_member_departments WHERE crew_member_id = $1
        `, [crewMemberId]);

        if (departmentIds.length > 0) {
          for (const deptId of departmentIds) {
            await client.query(`
              INSERT INTO crew_member_departments (crew_member_id, department_id)
              VALUES ($1, $2)
            `, [crewMemberId, deptId]);
          }
        }
      }
    });

    const targetUser = await Database.queryOne(`
      SELECT u.full_name FROM crew_members cm 
      JOIN users u ON u.id = cm.user_id 
      WHERE cm.id = $1
    `, [crewMemberId]);

    await logActivity(caller.id, 'role_changed', 'member', crewMemberId, { 
      name: targetUser?.full_name,
      to: role 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/round-table/crew error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Deactivate crew member
export async function DELETE(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await getCrewMember(user.id);
    if (!caller || (caller.role !== 'admin' && caller.role !== 'lead' && !caller.isSuperadmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const crewMemberId = searchParams.get('crewMemberId');

    if (!crewMemberId) {
      return NextResponse.json({ success: false, error: 'Crew Member ID is required' }, { status: 400 });
    }

    if (parseInt(crewMemberId) === caller.id) {
      return NextResponse.json({ success: false, error: 'You cannot deactivate your own crew membership' }, { status: 400 });
    }

    await Database.query(`
      UPDATE crew_members SET is_active = FALSE WHERE id = $1
    `, [crewMemberId]);

    const targetUser = await Database.queryOne(`
      SELECT u.full_name FROM crew_members cm 
      JOIN users u ON u.id = cm.user_id 
      WHERE cm.id = $1
    `, [crewMemberId]);

    await logActivity(caller.id, 'member_deactivated', 'member', crewMemberId, { name: targetUser?.full_name });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/round-table/crew error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
