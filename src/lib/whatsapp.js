// Meta WhatsApp Cloud API Dispatcher for Paper Thoughts
// Formats Nigerian mobile numbers and dispatches WhatsApp DM notifications

/**
 * Clean and format Nigerian mobile numbers to international 234 standard.
 * e.g., "08031234567" -> "2348031234567"
 * "09012345678" -> "2349012345678"
 * "+2348031234567" -> "2348031234567"
 */
export function formatNigerianPhone(phone) {
  if (!phone) return null;
  const digitsOnly = phone.toString().replace(/\D/g, '');
  if (!digitsOnly) return null;

  // Standard 11-digit Nigerian local number starting with 0
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `234${digitsOnly.slice(1)}`;
  }
  // 13-digit number starting with 234
  if (digitsOnly.length === 13 && digitsOnly.startsWith('234')) {
    return digitsOnly;
  }
  // 10-digit number missing leading 0
  if (digitsOnly.length === 10 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('8') || digitsOnly.startsWith('9'))) {
    return `234${digitsOnly}`;
  }

  return digitsOnly;
}

/**
 * Send a WhatsApp DM message via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppMessage({ to, text }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.warn('Skipping WhatsApp send: WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.');
    return null;
  }

  const formattedPhone = formatNigerianPhone(to);
  if (!formattedPhone) {
    console.warn(`Skipping WhatsApp send: Invalid phone number [${to}]`);
    return null;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { preview_url: true, body: text }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `WhatsApp API error ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Failed to send WhatsApp DM to [${formattedPhone}]:`, error);
    return null;
  }
}
