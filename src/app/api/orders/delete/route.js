import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const deleted = await Database.queryOne(`
      DELETE FROM orders 
      WHERE order_id = $1 OR id::text = $1
      RETURNING id, order_id
    `, [String(orderId)]);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order removed from Archive Ledger.' });
  } catch (error) {
    console.error('Failed to delete order in PostgreSQL:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete order' }, { status: 500 });
  }
}
