import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const gasUrl = process.env.GAS_WEBAPP_URL;
    
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const payload = {
      action: 'getEvents'
    };

    const response = await fetch(gasUrl, {
      method: 'POST', // We still use POST because GAS doPost handles it
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const rawResponse = await response.text();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Backend returned ${response.status}` }, { status: response.status });
    }

    try {
      const result = JSON.parse(rawResponse);
      return NextResponse.json(result);
    } catch (parseError) {
      return NextResponse.json({ success: false, error: 'Malformed response from backend' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch events' }, { status: 500 });
  }
}
