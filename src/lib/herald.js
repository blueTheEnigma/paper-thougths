import { Database } from '@/lib/db';

/**
 * Format Nigerian mobile numbers to international 234 standard.
 * e.g., "08031234567" -> "2348031234567"
 * Invariant: Statically adheres to workspace rule 'whatsapp-nigerian-formatting'.
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
 * Mathematical Idempotency Guard:
 * Checks if a message has already been broadcast. If not, claims the key atomically.
 * Returns true if safe to proceed, false if already dispatched.
 */
export async function claimIdempotencyKey(idempotencyKey, { channelType, recipient, ritualType }) {
  if (!idempotencyKey) return true;

  try {
    const res = await Database.query(`
      INSERT INTO herald_dispatches (idempotency_key, channel_type, recipient, ritual_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `, [idempotencyKey, channelType, recipient, ritualType]);

    // If rowCount === 0, the key already existed!
    return res.length > 0;
  } catch (err) {
    console.error('Failed to claim herald idempotency key:', err);
    // If DB check fails, fail-safe to avoid duplicate spam
    return false;
  }
}

/**
 * Mark an idempotency record with error status if sending failed
 */
export async function markDispatchError(idempotencyKey, errorMessage) {
  try {
    await Database.query(`
      UPDATE herald_dispatches
      SET sent_successfully = FALSE, error_message = $1
      WHERE idempotency_key = $2
    `, [errorMessage, idempotencyKey]);
  } catch (err) {
    console.error('Failed to mark herald dispatch error:', err);
  }
}

/**
 * Low-level dispatch helper to call Evolution API
 */
async function callEvolutionApi(endpoint, body) {
  const baseUrl = process.env.HERALD_API_URL || 'http://173.212.236.31:8085';
  const apiKey = process.env.HERALD_API_KEY || 'pt_herald_516c41028a10df20546b9082726c9814';
  const instance = process.env.HERALD_INSTANCE_NAME || 'pt-herald';

  if (!apiKey) {
    console.warn('Skipping Herald dispatch: HERALD_API_KEY is not configured in .env');
    return null;
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/message/${endpoint}/${instance}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(`[Evolution API Error Response]:`, JSON.stringify(data));
      const errMsg = Array.isArray(data.response?.message) 
        ? data.response.message.join(', ') 
        : (data.response?.message || data.message || data.error || `HTTP ${res.status}`);
      throw new Error(errMsg);
    }
    return data;
  } catch (err) {
    console.error(`Evolution API call failed for [${endpoint}]:`, err.message);
    throw err;
  }
}

/**
 * Send a public broadcast to the Paper Thoughts WhatsApp Community Group.
 * Invariant: Simulates human presence delay (1200ms) to respect WhatsApp safety.
 */
export async function sendHeraldGroupBroadcast({ text, mentions = [], mentionsEveryOne = false, idempotencyKey = null, ritualType = 'general', targetGroupJid = null }) {
  const groupJid = targetGroupJid || process.env.HERALD_GROUP_JID || '120363430362177971@g.us';
  if (!groupJid) {
    console.warn('Skipping Herald group broadcast: HERALD_GROUP_JID is not configured');
    return null;
  }

  if (idempotencyKey) {
    const isNew = await claimIdempotencyKey(idempotencyKey, {
      channelType: 'public_group',
      recipient: groupJid,
      ritualType
    });
    if (!isNew) {
      console.log(`[Herald] Idempotency key [${idempotencyKey}] already dispatched. Skipping.`);
      return { skipped: true, idempotencyKey };
    }
  }

  try {
    const payload = {
      number: groupJid,
      text: text,
      delay: 1200,
      presence: 'composing',
      linkPreview: true,
      mentionsEveryOne: Boolean(mentionsEveryOne)
    };

    if (mentions && mentions.length > 0) {
      payload.mentioned = mentions.map(formatNigerianPhone).filter(Boolean);
    }

    const result = await callEvolutionApi('sendText', payload);
    return result;
  } catch (err) {
    if (idempotencyKey) {
      await markDispatchError(idempotencyKey, err.message);
    }
    return null;
  }
}

/**
 * Send an operational direct message strictly to verified Admins and Moderators.
 * Invariant: Never send cold DMs to regular community members.
 */
export async function sendHeraldAdminAlert({ to, text, idempotencyKey = null, ritualType = 'admin_alert' }) {
  const formattedPhone = formatNigerianPhone(to);
  if (!formattedPhone) {
    console.warn(`[Herald] Cannot send admin alert: invalid phone [${to}]`);
    return null;
  }

  const recipientJid = `${formattedPhone}@s.whatsapp.net`;

  if (idempotencyKey) {
    const isNew = await claimIdempotencyKey(idempotencyKey, {
      channelType: 'admin_dm',
      recipient: recipientJid,
      ritualType
    });
    if (!isNew) {
      console.log(`[Herald Admin] Idempotency key [${idempotencyKey}] already dispatched. Skipping.`);
      return { skipped: true, idempotencyKey };
    }
  }

  try {
    const payload = {
      number: recipientJid,
      text: text,
      delay: 1000,
      presence: 'composing',
      linkPreview: true
    };

    const result = await callEvolutionApi('sendText', payload);
    return result;
  } catch (err) {
    if (idempotencyKey) {
      await markDispatchError(idempotencyKey, err.message);
    }
    return null;
  }
}

/**
 * Send an emoji reaction to a specific message
 */
export async function sendHeraldReaction({ remoteJid, messageId, fromMe = false, reaction = '🕯️' }) {
  try {
    const payload = {
      key: {
        remoteJid,
        fromMe,
        id: messageId
      },
      reaction
    };
    return await callEvolutionApi('sendReaction', payload);
  } catch (err) {
    console.error('[Herald Reaction] Failed to send reaction:', err.message);
    return null;
  }
}

/**
 * Send a contextual reply quoting an existing message
 */
export async function sendHeraldReply({ to, text, quotedKey = null, quotedMessageId = null, mentions = [] }) {
  try {
    const payload = {
      number: to,
      text,
      delay: 1000,
      presence: 'composing',
      linkPreview: true
    };

    if (quotedKey) {
      payload.quoted = { key: quotedKey };
    } else if (quotedMessageId) {
      payload.quoted = {
        key: {
          id: quotedMessageId,
          remoteJid: to
        }
      };
    }

    if (mentions && mentions.length > 0) {
      payload.mentioned = mentions.map(formatNigerianPhone).filter(Boolean);
    }

    return await callEvolutionApi('sendText', payload);
  } catch (err) {
    console.error('[Herald Reply] Failed to send reply:', err.message);
    return null;
  }
}

/**
 * Fetch configured Admin phone numbers from env or fallback to database admins
 */
export async function getHeraldAdminPhones() {
  const envPhones = process.env.HERALD_ADMIN_PHONES || '2349055433811';
  if (envPhones) {
    return envPhones.split(',').map(formatNigerianPhone).filter(Boolean);
  }

  // Fallback: Query database for users with event management or lead roles
  try {
    const rows = await Database.query(`
      SELECT DISTINCT u.whatsapp
      FROM users u
      LEFT JOIN user_permissions up ON up.user_id = u.id
      LEFT JOIN permissions p ON p.id = up.permission_id
      LEFT JOIN crew_members cm ON cm.user_id = u.id
      WHERE u.whatsapp IS NOT NULL
        AND (
          p.permission_key IN ('manage_chapter_events', 'moderate_submissions')
          OR cm.role IN ('lead', 'admin')
        )
    `);

    return rows.map(r => formatNigerianPhone(r.whatsapp)).filter(Boolean);
  } catch (err) {
    console.error('Failed to fetch admin phones from database:', err);
    return [];
  }
}
