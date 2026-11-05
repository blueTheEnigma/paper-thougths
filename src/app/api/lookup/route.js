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

    // Direct PostgreSQL lookup for instant match by LK-ID, Email, Name, or Handle
    const cleanQ = query.replace(/^@/, '');
    const dbUser = await Database.queryOne(`
      SELECT u.id, u.full_name as name, u.lk_id as lkid, u.email, u.instagram, c.name as chapter
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE UPPER(u.lk_id) = UPPER($1)
         OR LOWER(u.email) = LOWER($1)
         OR LOWER(TRIM(u.full_name)) = LOWER(TRIM($1))
         OR (u.instagram IS NOT NULL AND LOWER(u.instagram) = LOWER($2))
         OR (u.alias IS NOT NULL AND LOWER(u.alias) = LOWER($2))
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
        chapter: dbUser.chapter || 'Other'
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Member not found in Sanctuary Ledger. Please check spelling or join the club.' 
    }, { status: 404 });

  } catch (error) {
    console.error('Lookup processing failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process lookup' }, { status: 500 });
  }
}
