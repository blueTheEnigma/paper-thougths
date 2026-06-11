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

    const result = await Database.transaction(async (client) => {
      // 1. Archive any remaining active_batch submissions
      const archiveRes = await client.query(`
        UPDATE submissions 
        SET batch_status = 'archived' 
        WHERE batch_status = 'active_batch'
        RETURNING id
      `);

      // 2. Activate the queued submissions for the new week
      const activateRes = await client.query(`
        UPDATE submissions 
        SET batch_status = 'active_batch' 
        WHERE batch_status = 'queued'
        RETURNING id
      `);

      return {
        archivedCount: archiveRes.rowCount,
        archivedIds: archiveRes.rows.map(r => r.id),
        activatedCount: activateRes.rowCount,
        activatedIds: activateRes.rows.map(r => r.id)
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
