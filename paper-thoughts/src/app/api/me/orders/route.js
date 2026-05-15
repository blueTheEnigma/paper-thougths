import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 400 });
    }

    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const payload = {
      action: 'getMemberOrders',
      email: email
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
