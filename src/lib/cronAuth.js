/**
 * Shared authentication and batch-cycle utilities for Vercel/external cron endpoints.
 */
export function isCronAuthorized(request) {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) return true;

  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev_secret';
  const querySecret = searchParams.get('secret') || searchParams.get('key');

  return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
}

export function getLastSaturdayStart(now = new Date()) {
  const currentDay = now.getUTCDay();
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) {
    daysSinceSaturday += 7;
  }
  const lastSaturday = new Date(now);
  lastSaturday.setUTCDate(now.getUTCDate() - daysSinceSaturday);
  lastSaturday.setUTCHours(0, 0, 0, 0);
  return lastSaturday;
}
