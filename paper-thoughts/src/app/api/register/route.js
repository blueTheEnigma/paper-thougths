import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.GAS_WEBAPP_URL;
    
    console.log('Attempting registration with GAS URL:', gasUrl ? `${gasUrl.substring(0, 30)}...` : 'MISSING');

    if (!gasUrl) {
      console.error('GAS_WEBAPP_URL is not defined in environment variables');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // Explicitly mapping fields for clarity and backend security
    const payload = {
      fullName: body.fullName,
      instagram: body.instagram,
      whatsapp: body.whatsapp,
      email: body.email,
      chapter: body.chapter,
      referral: body.referral,
      consent: body.consent
    };

    console.log('Sending payload to GAS...');
    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('GAS responded with status:', response.status);

    const rawResponse = await response.text();

    if (!response.ok) {
      console.error('GAS Error Response:', rawResponse);
      return NextResponse.json({ success: false, error: `Backend returned ${response.status}` }, { status: response.status });
    }

    try {
      const result = JSON.parse(rawResponse);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw response:', rawResponse);
      return NextResponse.json({ success: false, error: 'Malformed response from backend' }, { status: 500 });
    }
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process registration' }, { status: 500 });
  }
}
