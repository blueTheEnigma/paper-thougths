import webpush from 'web-push';
import { Database } from './db.js';

// Configure VAPID details if keys exist
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@paperthoughts.org';

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    console.error('Failed to configure Web Push VAPID:', err);
  }
}

/**
 * Save or update a client's Web Push subscription
 */
export async function savePushSubscription(userId, subscription, userAgent = '') {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new Error('Invalid Push Subscription payload');
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  return await Database.queryOne(`
    INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (endpoint) DO UPDATE 
    SET user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
    RETURNING id, user_id, endpoint, created_at
  `, [userId, endpoint, p256dh, auth, userAgent]);
}

/**
 * Remove a specific device subscription
 */
export async function deletePushSubscription(endpoint) {
  return await Database.queryOne(`
    DELETE FROM user_push_subscriptions
    WHERE endpoint = $1
    RETURNING id, endpoint
  `, [endpoint]);
}

/**
 * Send a Web Push notification to a specific user across all registered devices
 */
export async function sendPushNotification(userId, { title, body, link, icon, badge, tag }) {
  if (!publicKey || !privateKey) {
    console.warn('Web Push VAPID keys not configured; skipping push notification.');
    return { success: false, reason: 'VAPID unconfigured' };
  }

  const subscriptions = await Database.query(`
    SELECT id, endpoint, p256dh, auth
    FROM user_push_subscriptions
    WHERE user_id = $1
  `, [userId]);

  if (subscriptions.length === 0) {
    return { success: true, delivered: 0, reason: 'No registered devices' };
  }

  const payload = JSON.stringify({
    title: title || 'Paper Thoughts',
    body: body || 'New notification in the Sanctuary.',
    link: link || 'https://www.paperthoughts.org/village',
    icon: icon || '/apple-icon',
    badge: badge || '/icon',
    tag: tag || 'pt-notification',
    timestamp: Date.now()
  });

  let delivered = 0;
  let expiredEndpoints = [];

  for (const sub of subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(pushSub, payload);
      delivered++;
    } catch (err) {
      console.warn(`Web push error for device ${sub.id}:`, err.statusCode || err.message);
      // If 404 or 410, subscription is expired or unsubscribed on browser side
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  }

  // Clean up any stale/expired endpoints
  if (expiredEndpoints.length > 0) {
    await Database.query(`
      DELETE FROM user_push_subscriptions
      WHERE endpoint = ANY($1::text[])
    `, [expiredEndpoints]);
  }

  return { success: true, delivered, cleaned: expiredEndpoints.length };
}

/**
 * Broadcast a Web Push notification to all active subscribers
 */
export async function broadcastPushNotification({ title, body, link, icon, badge, tag }) {
  if (!publicKey || !privateKey) {
    return { success: false, reason: 'VAPID unconfigured' };
  }

  const subscriptions = await Database.query(`
    SELECT id, endpoint, p256dh, auth
    FROM user_push_subscriptions
  `);

  if (subscriptions.length === 0) {
    return { success: true, delivered: 0 };
  }

  const payload = JSON.stringify({
    title: title || 'Paper Thoughts',
    body: body || 'New Sanctuary broadcast.',
    link: link || 'https://www.paperthoughts.org/village',
    icon: icon || '/apple-icon',
    badge: badge || '/icon',
    tag: tag || 'pt-broadcast',
    timestamp: Date.now()
  });

  let delivered = 0;
  let expiredEndpoints = [];

  for (const sub of subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(pushSub, payload);
      delivered++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    await Database.query(`
      DELETE FROM user_push_subscriptions
      WHERE endpoint = ANY($1::text[])
    `, [expiredEndpoints]);
  }

  return { success: true, delivered, cleaned: expiredEndpoints.length };
}
