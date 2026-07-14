import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser, isCrewMember } from '@/lib/permissions';
import { Database } from '@/lib/db';


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

    // Try fetching profile from Google Apps Script
    let gasProfile = null;
    const gasUrl = process.env.GAS_WEBAPP_URL;
    
    if (gasUrl) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'getProfile', email: emailAddress }),
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });

        if (response.ok) {
          const rawResponse = await response.text();
          try {
            const result = JSON.parse(rawResponse);
            if (result.success && result.profile) {
              gasProfile = result.profile;
            }
          } catch (parseError) {
            console.error("Failed to parse GAS profile response:", parseError);
          }
        }
      } catch (gasErr) {
        console.error("GAS profile fetch failed:", gasErr);
      }
    }

    // Build a unified profile — GAS profile as base, DB stats merged on top
    // If GAS fails, we still return a minimal profile from the DB so the user
    // is recognized as a member in the Bookstore and can use leaves.
    const profile = gasProfile || {};
    
    // Always set the email (GAS might not include it)
    profile.email = emailAddress;
    profile.name = profile.name || dbUser?.full_name || user.firstName || 'Member';

    // Merge DB stats
    if (dbUser) {
      profile.spendableLeaves = parseInt(dbUser.spendable_leaves || 0);
      profile.lifetimeLeaves = parseInt(dbUser.lifetime_leaves || 0);
      profile.lkid = dbUser.lk_id || profile.lkid || 'Guest';
      profile.tier = profile.tier || (parseFloat(dbUser.milestone_tokens || 0) >= 10.0 ? 'Keeper' : 'Reader');
      
      // Merge chapter details from local database if GAS hasn't populated it
      if (!profile.chapter && dbUser.chapter_id) {
        const chap = await Database.queryOne('SELECT name FROM chapters WHERE id = $1', [dbUser.chapter_id]);
        if (chap) {
          profile.chapter = chap.name.includes('Abuja') ? 'Abuja' : chap.name;
        }
      }
      profile.onboarded = dbUser.onboarded || false;
      profile.isCrewMember = await isCrewMember(user.id);
      profile.avatarUrl = dbUser.avatar_url || null;
      profile.archetype = dbUser.reader_archetype || null;
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("/api/me unexpected error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}
