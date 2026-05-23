import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    // Developer fallback if keys are not fully setup yet
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || !audienceId) {
      console.warn('Resend keys are not fully configured. Simulating newsletter subscription in development mode.');
      return NextResponse.json({
        success: true,
        message: 'Welcome to the circle! (Development Mode: Subscription successfully simulated).'
      });
    }

    // Call Resend Audiences API to add contact
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        unsubscribed: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle the case where the email is already subscribed
      if (data.message && data.message.toLowerCase().includes('already exists')) {
        return NextResponse.json({ success: true, message: 'You are already subscribed to the dispatch!' });
      }
      throw new Error(data.message || `Resend returned code ${res.status}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome to the circle! You have been subscribed.'
    });

  } catch (error) {
    console.error('Failed to subscribe newsletter:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process subscription.' }, { status: 500 });
  }
}
