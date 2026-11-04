import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

const RESERVED_ALIASES = new Set([
  'admin', 'administrator', 'paperthoughts', 'pt', 'moderator', 'system',
  'sanctuary', 'crucible', 'herald', 'bookie', 'official', 'support',
  'bot', 'root', 'help', 'api', 'dashboard', 'archive', 'roundtable'
]);

function formatNigerianWhatsApp(phone) {
  if (!phone) return null;
  // Clean non-digits
  const digits = String(phone).replace(/\D/g, '');
  // Standard 11-digit Nigerian mobile starting with 0 -> prepend 234
  if (digits.length === 11 && digits.startsWith('0')) {
    return '234' + digits.substring(1);
  }
  return digits || phone;
}

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Failed to synchronize user session.' }, { status: 500 });
    }

    const body = await request.json();
    const { 
      alias, 
      chapter, 
      chapterId, 
      birthday, 
      whatsapp, 
      instagram, 
      preferredGenres, 
      referral 
    } = body;

    // 1. Validate Alias (* mandatory)
    if (!alias) {
      return NextResponse.json({ success: false, error: 'An Alias is required to consecrate your identity.' }, { status: 400 });
    }

    const cleanAlias = String(alias).replace(/^@+/, '').trim().toLowerCase();
    if (cleanAlias.length < 3 || cleanAlias.length > 25 || !/^[a-z0-9_]+$/.test(cleanAlias)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Alias must be between 3 and 25 characters and contain only letters, numbers, or underscores.' 
      }, { status: 400 });
    }

    if (RESERVED_ALIASES.has(cleanAlias)) {
      return NextResponse.json({ success: false, error: 'This alias is reserved by the Sanctuary.' }, { status: 400 });
    }

    // Check alias uniqueness
    const existingAlias = await Database.queryOne(`
      SELECT id FROM users WHERE LOWER(alias) = $1 AND id != $2
    `, [cleanAlias, dbUser.id]);

    if (existingAlias) {
      return NextResponse.json({ success: false, error: 'This alias is already taken. Please choose another.' }, { status: 400 });
    }

    // 2. Validate Birthday (* mandatory)
    if (!birthday) {
      return NextResponse.json({ success: false, error: 'Birthday is required for sanctuary milestone and honor conferral.' }, { status: 400 });
    }

    const parsedBirthday = new Date(birthday);
    if (isNaN(parsedBirthday.getTime())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid birthday date.' }, { status: 400 });
    }

    // 3. Resolve Chapter (* mandatory)
    let resolvedChapterId = null;
    if (chapterId && !isNaN(parseInt(chapterId))) {
      const chapRow = await Database.queryOne('SELECT id FROM chapters WHERE id = $1', [parseInt(chapterId)]);
      if (chapRow) resolvedChapterId = chapRow.id;
    }

    if (!resolvedChapterId && chapter) {
      const chapRow = await Database.queryOne('SELECT id FROM chapters WHERE LOWER(name) = LOWER($1)', [chapter.trim()]);
      if (chapRow) resolvedChapterId = chapRow.id;
    }

    if (!resolvedChapterId) {
      const defaultChap = await Database.queryOne("SELECT id FROM chapters WHERE name = 'Other'");
      resolvedChapterId = defaultChap?.id || 4;
    }

    // 4. Clean contact & social fields
    const formattedWhatsApp = formatNigerianWhatsApp(whatsapp);
    const cleanInstagram = instagram ? String(instagram).replace(/^@+/, '').trim() : null;

    // Check duplicate Instagram if provided
    if (cleanInstagram) {
      const existingInsta = await Database.queryOne(`
        SELECT id FROM users WHERE instagram = $1 AND id != $2
      `, [cleanInstagram, dbUser.id]);
      if (existingInsta) {
        return NextResponse.json({ success: false, error: 'This Instagram handle is already linked to another account.' }, { status: 400 });
      }
    }

    // 5. Execute Onboarding update in transaction
    await Database.transaction(async (client) => {
      let referrerId = dbUser.referred_by_id || null;

      // Resolve referral code if user doesn't already have a referrer
      if (!referrerId && referral) {
        const cleanRef = String(referral).replace(/^@+/, '').trim();
        const refUser = await client.query(`
          SELECT id FROM users 
          WHERE UPPER(lk_id) = UPPER($1) 
             OR LOWER(alias) = LOWER($1)
          LIMIT 1
        `, [cleanRef]);

        if (refUser.rows.length > 0 && refUser.rows[0].id !== dbUser.id) {
          referrerId = refUser.rows[0].id;

          // Apply referral token rewards (Anti-influencer cap: max 5 referrals)
          const refCountRes = await client.query('SELECT COUNT(*) as count FROM users WHERE referred_by_id = $1', [referrerId]);
          const currentCount = parseInt(refCountRes.rows[0]?.count || 0);

          if (currentCount < 5) {
            await client.query(`
              UPDATE users 
              SET milestone_tokens = milestone_tokens + 1.2 
              WHERE id = $1
            `, [referrerId]);
          }
        }
      }

      // Update the user's permanent profile & flip onboarded to TRUE
      await client.query(`
        UPDATE users 
        SET alias = $1,
            chapter_id = $2,
            birthday = $3,
            whatsapp = COALESCE($4, whatsapp),
            instagram = COALESCE($5, instagram),
            preferred_genres = $6,
            referred_by_id = COALESCE(referred_by_id, $7),
            onboarded = TRUE
        WHERE id = $8
      `, [
        cleanAlias,
        resolvedChapterId,
        parsedBirthday,
        formattedWhatsApp,
        cleanInstagram,
        preferredGenres || [],
        referrerId,
        dbUser.id
      ]);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Consecration complete. Welcome to the Sanctuary.',
      alias: cleanAlias
    });

  } catch (error) {
    console.error('Error in /api/me/onboard POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to complete onboarding ritual.' 
    }, { status: 500 });
  }
}
