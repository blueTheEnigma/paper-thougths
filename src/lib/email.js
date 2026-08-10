// Direct REST API integration with Brevo (Sendinblue) & Resend (zero-dependency, edge-compatible)
export async function sendEmail({ to, subject, html }) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  const senderName = process.env.EMAIL_SENDER_NAME || 'Paper Thoughts';
  const senderEmail = process.env.EMAIL_SENDER_ADDRESS || 'notifications@paperthoughts.org';

  // 1. Try Brevo (Sendinblue) REST API if BREVO_API_KEY is configured (300 free emails/day)
  if (brevoApiKey) {
    try {
      const recipientArray = (Array.isArray(to) ? to : [to]).map(e => (typeof e === 'string' ? { email: e } : e));
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: recipientArray,
          subject: subject,
          htmlContent: html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Brevo API returned status ${res.status}`);
      }
      return { id: data.messageId || 'brevo_success', provider: 'brevo' };
    } catch (error) {
      console.error('Brevo email send error:', error);
      // Fall through to Resend fallback if configured
    }
  }

  // 2. Fallback to Resend REST API if RESEND_API_KEY is configured
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || `${senderName} <onboarding@resend.dev>`;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
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
      return { id: data.id, provider: 'resend' };
    } catch (error) {
      console.error('Failed to send transactional email via Resend:', error);
      return null;
    }
  }

  console.warn('Skipping email send: Neither BREVO_API_KEY nor RESEND_API_KEY is defined in environment.');
  return null;
}
