import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { getCrewMember } from '@/lib/round-table';

// GET - List activity log timeline
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
    const actorId = searchParams.get('actorId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    const params = [];
    let paramIndex = 1;
    const conditions = [];

    if (actorId) {
      conditions.push(`al.actor_id = $${paramIndex++}`);
      params.push(parseInt(actorId));
    }
    if (action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(action);
    }
    if (entityType) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      params.push(entityType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM crew_activity_log al
      ${whereClause}
    `;
    const countRes = await Database.queryOne(countQuery, params);
    const total = parseInt(countRes?.total || 0);

    // Fetch activity items
    params.push(limit);
    const limitParamIndex = paramIndex++;
    params.push(offset);
    const offsetParamIndex = paramIndex++;

    const dataQuery = `
      SELECT al.*, u.full_name, u.email
      FROM crew_activity_log al
      LEFT JOIN crew_members cm ON cm.id = al.actor_id
      LEFT JOIN users u ON u.id = cm.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const activities = await Database.query(dataQuery, params);

    return NextResponse.json({ 
      success: true, 
      activities,
      pagination: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error("GET /api/round-table/activity error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
