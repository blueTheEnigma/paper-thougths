import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const data = await req.json();
    
    const payload = {
      action: 'finalizeOrder',
      orderId: data.orderId
    };

    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to finalize order' }, { status: 500 });
  }
}
