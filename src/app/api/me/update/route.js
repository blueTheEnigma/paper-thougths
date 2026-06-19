import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const body = await request.json();
    const { fullName, instagram, whatsapp, chapter, birthday, preferredGenres } = body;

    if (!fullName || !whatsapp) {
      return NextResponse.json({ success: false, error: 'Full name and WhatsApp number are required.' }, { status: 400 });
    }

    const cleanInstagram = instagram ? instagram.replace('@', '').trim() : null;

    // Check duplicate instagram for other users
    if (cleanInstagram) {
      const existingUser = await Database.queryOne(`
        SELECT id FROM users 
        WHERE instagram = $1 AND id != $2
      `, [cleanInstagram, dbUser.id]);
      
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'This Instagram handle is already registered.' }, { status: 400 });
      }
    }

    // Resolve chapter name to chapter_id
    let chapterRow = await Database.queryOne(`
      SELECT id FROM chapters WHERE LOWER(name) = LOWER($1)
    `, [chapter || 'Other']);

    if (!chapterRow) {
      chapterRow = await Database.queryOne(`SELECT id FROM chapters WHERE name = 'Other'`);
    }

    // Update user profile in database
    await Database.query(`
      UPDATE users 
      SET full_name = $1,
          instagram = $2,
          whatsapp = $3,
          chapter_id = $4,
          birthday = $5,
          preferred_genres = $6
      WHERE id = $7
    `, [
      fullName, 
      cleanInstagram, 
      whatsapp, 
      chapterRow.id, 
      birthday ? new Date(birthday) : null, 
      preferredGenres || [], 
      dbUser.id
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully!' 
    });

  } catch (error) {
    console.error('POST /api/me/update failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
