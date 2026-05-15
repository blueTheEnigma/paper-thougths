import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.GAS_WEBAPP_URL;
    
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const payload = {
      action: 'lookup',
      query: body.query
    };

    const response = await fetch(gasUrl, {
      method: 'POST',
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
    return NextResponse.json({ success: false, error: error.message || 'Failed to process lookup' }, { status: 500 });
  }
}
