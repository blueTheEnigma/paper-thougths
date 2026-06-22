import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // Authorization check
    if (!isDev && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Saturday Batch Drop lifecycle transitions...');

    // Count the queued submissions
    const queuedCountRes = await Database.queryOne(`
      SELECT COUNT(*) as count 
      FROM submissions 
      WHERE batch_status = 'queued'
    `);
    const queuedCount = parseInt(queuedCountRes?.count || 0, 10);

    const result = await Database.transaction(async (client) => {
      // 1. Archive active submissions that have reached the threshold of >= 3 critiques
      const archiveRes = await client.query(`
        UPDATE submissions 
        SET batch_status = 'archived' 
        WHERE batch_status = 'active_batch'
          AND id IN (
            SELECT submission_id 
            FROM peer_reviews 
            GROUP BY submission_id 
            HAVING COUNT(*) >= 3
          )
        RETURNING id
      `);
      const archivedIds = archiveRes.rows.map(r => r.id);

      // 2. Identify remaining active submissions that are rolling over (excluding completed ones)
      const rolloverRes = await client.query(`
        SELECT id 
        FROM submissions 
        WHERE batch_status = 'active_batch'
      `);
      const rolloverIds = rolloverRes.rows.map(r => r.id);

      // 3. Activate the queued submissions for the new week (if any are queued)
      let activatedIds = [];
      if (queuedCount > 0) {
        const activateRes = await client.query(`
          UPDATE submissions 
          SET batch_status = 'active_batch' 
          WHERE batch_status = 'queued'
          RETURNING id
        `);
        activatedIds = activateRes.rows.map(r => r.id);
      }

      return {
        archivedCount: archivedIds.length,
        archivedIds,
        activatedCount: activatedIds.length,
        activatedIds,
        rolloverCount: rolloverIds.length,
        rolloverIds
      };
    });

    console.log('Batch drop transition complete:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Saturday Batch Drop transition executed successfully.',
      data: result
    });
  } catch (error) {
    console.error('Saturday Batch Drop transition failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Batch Drop failed' }, { status: 500 });
  }
}

// Support GET requests in development for manual testing
export async function GET(request) {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    return NextResponse.json({ success: false, error: 'Method Not Allowed' }, { status: 405 });
  }
  return POST(request);
}
