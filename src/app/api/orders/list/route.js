import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await Database.query(`
      SELECT 
        o.id,
        o.order_id as "orderId",
        o.created_at as "date",
        o.status,
        COALESCE(u.full_name, o.guest_name, 'Guest Reader') as "name",
        COALESCE(u.lk_id, 'Guest') as "lkid",
        o.items,
        o.subtotal,
        o.discount,
        o.total,
        o.leaves_spent as "leavesUsed",
        o.sales_rep as "salesRep"
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Failed to fetch orders from PostgreSQL:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
