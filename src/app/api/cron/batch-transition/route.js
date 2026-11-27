import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { isCronAuthorized } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return POST(request);
}

export async function POST(request) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Batch Drop lifecycle transitions...');

    const currentCycleMonth = new Date().toISOString().slice(0, 7);

    const result = await Database.transaction(async (client) => {
      // 1. Archive active submissions ONLY if:
      //    a) They have reached >= 3 peer critiques, OR
      //    b) Their cycle month has ended (older than current YYYY-MM calendar month)
      // Works with < 3 reviews remain in active_batch throughout the current month!
      const archiveRes = await client.query(`
        UPDATE submissions
        SET batch_status = 'archived'
        WHERE batch_status = 'active_batch'
          AND (
            id IN (
              SELECT submission_id
              FROM peer_reviews
              GROUP BY submission_id
              HAVING COUNT(*) >= 3
            )
            OR COALESCE(cycle_month, to_char(created_at, 'YYYY-MM')) < $1
          )
        RETURNING id
      `, [currentCycleMonth]);
      const archivedIds = archiveRes.rows.map(r => r.id);

      // 2. Remaining active_batch manuscripts roll over seamlessly in Critique Corner
      const rolloverRes = await client.query(`
        SELECT id FROM submissions WHERE batch_status = 'active_batch'
      `);
      const rolloverIds = rolloverRes.rows.map(r => r.id);

      // 3. Activate any queued submissions for the new week
      const activateRes = await client.query(`
        UPDATE submissions
        SET batch_status = 'active_batch'
        WHERE batch_status = 'queued'
        RETURNING id
      `);
      const activatedIds = activateRes.rows.map(r => r.id);

      return {
        archivedCount: archivedIds.length,
        archivedIds,
        activatedCount: activatedIds.length,
        activatedIds,
        rolloverCount: rolloverIds.length,
        rolloverIds
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Batch Drop transition executed successfully (kept < 3 review pieces active for current month).',
      data: result
    });
  } catch (error) {
    console.error('Batch Drop transition failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Batch Drop failed' }, { status: 500 });
  }
}
