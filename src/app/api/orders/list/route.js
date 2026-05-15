import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const payload = {
      action: 'getOrders'
    };

    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
