// Direct REST API integration with Resend (zero-dependency, edge-compatible)
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Skipping email send: RESEND_API_KEY is not defined in environment.');
    return null;
  }

  // Use the verified domain sender from env, falling back to Resend's dev sandbox sender
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Resend API returned status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error('Failed to send transactional email via Resend:', error);
    return null;
  }
}
