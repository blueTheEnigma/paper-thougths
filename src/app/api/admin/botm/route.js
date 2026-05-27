import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

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

    const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
    const isSuperadmin = email === SUPERADMIN_EMAIL.toLowerCase();
    const canModerate = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !canModerate) {
      return NextResponse.json({ success: false, error: 'Access denied: Insufficient privileges.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, author, imageUrl, teaser, price, purchaseLink, chapterId } = body;

    if (!title || !author || !imageUrl || !teaser) {
      return NextResponse.json({ success: false, error: 'Missing required fields: title, author, imageUrl, or teaser.' }, { status: 400 });
    }

    const cleanChapterId = chapterId ? parseInt(chapterId, 10) : null;

    // Set existing books of the month for this chapter to inactive and insert the new active one
    const newBotm = await Database.transaction(async (client) => {
      if (cleanChapterId === null) {
        await client.query(`
          UPDATE book_of_the_month
          SET active = FALSE
          WHERE chapter_id IS NULL
        `);
      } else {
        await client.query(`
          UPDATE book_of_the_month
          SET active = FALSE
          WHERE chapter_id = $1
        `, [cleanChapterId]);
      }

      const res = await client.query(`
        INSERT INTO book_of_the_month (title, author, image_url, teaser, price, purchase_link, active, chapter_id)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
        RETURNING id, title, author, image_url as "imageUrl", teaser, price, purchase_link as "purchaseLink", active, chapter_id as "chapterId"
      `, [title, author, imageUrl, teaser, price || '0', purchaseLink || '/bookstore', cleanChapterId]);

      return res.rows[0];
    });

    return NextResponse.json({
      success: true,
      message: 'Book of the Month updated successfully.',
      botm: newBotm
    });

  } catch (error) {
    console.error('Book of the Month update failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Operation failed' }, { status: 500 });
  }
}
