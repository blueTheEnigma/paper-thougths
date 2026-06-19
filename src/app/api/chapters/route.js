import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const chapters = await Database.query('SELECT name FROM chapters ORDER BY name');
    return NextResponse.json({ 
      success: true, 
      chapters: chapters.map(c => c.name) 
    });
  } catch (error) {
    console.error('GET /api/chapters failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve chapters' }, { status: 500 });
  }
}
