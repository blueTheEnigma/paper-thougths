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

    const updated = await Database.queryOne(`
      UPDATE orders 
      SET status = 'Paid' 
      WHERE order_id = $1 OR id::text = $1
      RETURNING *
    `, [String(orderId)]);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order marked as Paid successfully.' });
  } catch (error) {
    console.error('Failed to finalize order in PostgreSQL:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to finalize order' }, { status: 500 });
  }
}
