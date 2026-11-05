import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser, isCrewMember } from '@/lib/permissions';
import { Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const emailAddress = user.primaryEmailAddress?.emailAddress;
    
    if (!emailAddress) {
      return NextResponse.json({ success: false, error: 'No email address found for user' }, { status: 400 });
    }

    // Always sync/create the user in the local database first
    let dbUser = null;
    try {
      dbUser = await syncOrCreateUser(user);
    } catch (dbErr) {
      console.error("Failed to sync user to DB in /api/me:", dbErr);
    }

    // Build the member profile directly from PostgreSQL (Sanctuary Source of Truth)
    const profile = {
      email: emailAddress,
      name: dbUser?.full_name || user.firstName || 'Member',
      chapter: 'Other'
    };

    // Merge DB stats and membership credentials
    if (dbUser) {
      profile.id = dbUser.id;
      profile.fullName = dbUser.full_name;
      profile.alias = dbUser.alias || null;
      profile.birthday = dbUser.birthday ? new Date(dbUser.birthday).toISOString().split('T')[0] : null;
      profile.whatsapp = dbUser.whatsapp || null;
      profile.instagram = dbUser.instagram || null;
      profile.preferredGenres = dbUser.preferred_genres || [];
      profile.spendableLeaves = parseInt(dbUser.spendable_leaves || 0, 10);
      profile.lifetimeLeaves = parseInt(dbUser.lifetime_leaves || 0, 10);
      profile.lkid = dbUser.lk_id || 'Guest';
      profile.tier = parseFloat(dbUser.milestone_tokens || 0) >= 10.0 ? 'Keeper' : 'Reader';
      
      // Resolve chapter details from local database
      if (dbUser.chapter_id) {
        const chap = await Database.queryOne('SELECT name FROM chapters WHERE id = $1', [dbUser.chapter_id]);
        if (chap) {
          profile.chapter = chap.name.includes('Abuja') ? 'Abuja' : chap.name;
        }
      }
      
      profile.onboarded = dbUser.onboarded || false;
      profile.isCrewMember = await isCrewMember(user.id);
      profile.avatarUrl = dbUser.avatar_url || null;
      profile.archetype = dbUser.reader_archetype || null;
      profile.foundingBadge = dbUser.founding_badge || null;
      profile.membershipStatus = dbUser.membership_status || 'active';
      profile.probationStrikes = parseInt(dbUser.probation_strikes_this_year || 0, 10);
      profile.consecutiveBotmMisses = parseInt(dbUser.consecutive_botm_misses || 0, 10);
      profile.silverBullets = parseInt(dbUser.silver_bullets || 0, 10);
      profile.sabbaticalUntil = dbUser.sabbatical_until ? new Date(dbUser.sabbatical_until).toISOString().split('T')[0] : null;
      profile.sabbaticalType = dbUser.sabbatical_type || null;
      profile.evictedAt = dbUser.evicted_at ? new Date(dbUser.evicted_at).toISOString() : null;
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("/api/me unexpected error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}
