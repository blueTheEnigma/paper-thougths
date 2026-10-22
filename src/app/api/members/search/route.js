import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, members: [] });
    }

    const cleanQ = q.replace(/^@/, '');
    const searchPattern = `%${cleanQ}%`;

    const members = await Database.query(`
      SELECT 
        u.id,
        u.full_name as "fullName",
        u.lk_id as "lkId",
        u.email,
        c.name as "chapterName"
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE u.full_name ILIKE $1
         OR u.lk_id ILIKE $1
         OR u.email ILIKE $1
         OR (u.instagram IS NOT NULL AND u.instagram ILIKE $1)
      ORDER BY
        CASE
          WHEN UPPER(COALESCE(u.lk_id, '')) = UPPER($2) THEN 1
          WHEN LOWER(TRIM(COALESCE(u.full_name, ''))) = LOWER(TRIM($2)) THEN 2
          WHEN u.full_name ILIKE $3 THEN 3
          ELSE 4
        END,
        u.full_name ASC
      LIMIT 8
    `, [searchPattern, cleanQ, `${cleanQ}%`]);

    return NextResponse.json({
      success: true,
      members: members.map(m => ({
        id: m.id,
        fullName: m.fullName || 'Anonymous Kin',
        lkId: m.lkId || null,
        chapter: m.chapterName || null,
        emailHint: m.email ? `${m.email.substring(0, 3)}...${m.email.split('@')[1] ? '@' + m.email.split('@')[1] : ''}` : null
      }))
    });
  } catch (error) {
    console.error('Member search error:', error);
    return NextResponse.json({ success: false, error: 'Failed to search members' }, { status: 500 });
  }
}
