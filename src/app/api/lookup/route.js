import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = (body.query || '').trim();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Please enter a name, email, or handle.' }, { status: 400 });
    }

    // 1. Direct PostgreSQL check for instant match by LK-ID, Email, Name, or Instagram
    const cleanQ = query.replace(/^@/, '');
    try {
      const dbUser = await Database.queryOne(`
        SELECT u.id, u.full_name as name, u.lk_id as lkid, u.email, u.instagram, c.name as chapter
        FROM users u
        LEFT JOIN chapters c ON c.id = u.chapter_id
        WHERE UPPER(u.lk_id) = UPPER($1)
           OR LOWER(u.email) = LOWER($1)
           OR LOWER(TRIM(u.full_name)) = LOWER(TRIM($1))
           OR (u.instagram IS NOT NULL AND LOWER(u.instagram) = LOWER($2))
           OR u.full_name ILIKE $3
        ORDER BY
          CASE
            WHEN UPPER(COALESCE(u.lk_id, '')) = UPPER($1) THEN 1
            WHEN LOWER(TRIM(COALESCE(u.full_name, ''))) = LOWER(TRIM($1)) THEN 2
            WHEN LOWER(COALESCE(u.email, '')) = LOWER($1) THEN 3
            ELSE 4
          END
        LIMIT 1
      `, [query, cleanQ, `%${cleanQ}%`]);

      if (dbUser && dbUser.lkid) {
        return NextResponse.json({
          success: true,
          name: dbUser.name,
          lkid: dbUser.lkid,
          email: dbUser.email,
          chapter: dbUser.chapter
        });
      }
    } catch (dbErr) {
      console.warn('PostgreSQL lookup fallback to GAS:', dbErr);
    }

    // 2. Fallback to Google Apps Script ledger if not found in Postgres
    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Member not found. Check spelling or sign up.' }, { status: 404 });
    }

    const payload = {
      action: 'lookup',
      query: query
    };

    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const rawResponse = await response.text();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Backend returned ${response.status}` }, { status: response.status });
    }

    try {
      const result = JSON.parse(rawResponse);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed response from backend' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to process lookup' }, { status: 500 });
  }
}
