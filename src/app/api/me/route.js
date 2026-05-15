import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const emailAddress = user.primaryEmailAddress?.emailAddress;
    
    if (!emailAddress) {
      return NextResponse.json({ success: false, error: 'No email address found for user' }, { status: 400 });
    }

    const gasUrl = process.env.GAS_WEBAPP_URL;
    
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const payload = {
      action: 'getProfile',
      email: emailAddress
    };

    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Always fetch fresh profile
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
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}
