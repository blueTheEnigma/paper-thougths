import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

// Clean text for exact quote comparison
function cleanText(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Check quote density using Option A (Exact Substring Match)
function calculateQuoteDensity(reviews, bodyText) {
  const cleanedBody = cleanText(bodyText);
  if (!cleanedBody) return 0;
  
  let validQuoteCount = 0;

  for (const r of reviews) {
    const quote = r.highwater_response ? r.highwater_response.trim() : '';
    if (!quote || quote.length < 12) continue; // Skip empty or extremely short inputs

    const cleanedQuote = cleanText(quote);
    if (cleanedQuote && cleanedBody.includes(cleanedQuote)) {
      validQuoteCount++;
    } else {
      // If the entire response didn't match, check if at least one substantial sentence in it matches
      const sentences = quote.split(/[.!?\n]+/)
        .map(s => cleanText(s))
        .filter(s => s.length > 15); // Require a sentence length of >15 characters to prevent false matching
        
      const hasMatch = sentences.some(s => cleanedBody.includes(s));
      if (hasMatch) {
        validQuoteCount++;
      }
    }
  }
  return validQuoteCount;
}

// Saturday 12:00 AM batch cycle start calculator (UTC aligned)
function getLastSaturdayStart() {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  let daysSinceSaturday = currentDay - 6;
  if (daysSinceSaturday < 0) {
    daysSinceSaturday += 7;
  }
  const lastSaturday = new Date(now);
  lastSaturday.setUTCDate(now.getUTCDate() - daysSinceSaturday);
  lastSaturday.setUTCHours(0, 0, 0, 0);
  return lastSaturday;
}

// Friday of current batch cycle start calculator (UTC aligned)
function getFridayOfCurrentCycle() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day >= 5 ? day - 5 : day + 2; // distance to the most recent Friday
  const friday = new Date(now);
  friday.setUTCDate(now.getUTCDate() - diff);
  friday.setUTCHours(0, 0, 0, 0);
  return friday;
}

export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // Authorization check
    if (!isDev && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Friday Recap cron (Laurel, Streaks)...');

    // Self-healing guard: Archive any active_batch submissions that should have been archived (created_at before last Saturday)
    const lastSaturday = getLastSaturdayStart();
    const selfHealRes = await Database.query(`
      UPDATE submissions
      SET batch_status = 'archived'
      WHERE batch_status = 'active_batch'
        AND created_at < $1
      RETURNING id
    `, [lastSaturday]);

    if (selfHealRes.length > 0) {
      console.log(`Self-healing: Archived ${selfHealRes.length} submissions from the previous cycle inline:`, selfHealRes.map(r => r.id));
    }

    // Calculate current batch cycle range (submissions active this week were created after lastSaturday - 7 days)
    const cycleThreshold = new Date(lastSaturday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    // 1. Fetch newly archived submissions (transitioned by batch-transition or self-healing)
    const activeSubmissions = await Database.query(`
      SELECT id, title, genre, logline, body_text 
      FROM submissions 
      WHERE batch_status = 'archived' AND created_at >= $1
    `, [cycleThreshold]);

    console.log(`Found ${activeSubmissions.length} newly archived submissions to process for Laurel.`);

    const laurelCandidates = [];

    // 2. Compute quote density for Laurel
    for (const sub of activeSubmissions) {
      try {
        // Fetch human reviews for quote density calculation
        const reviews = await Database.query(`
          SELECT highwater_response FROM peer_reviews WHERE submission_id = $1
        `, [sub.id]);

        const quoteCount = calculateQuoteDensity(reviews, sub.body_text);
        laurelCandidates.push({ id: sub.id, quoteCount });
      } catch (err) {
        console.error(`Error in Laurel computation for submission ${sub.id}:`, err);
      }
    }

    // 3. Crown the Weekly Laurel (highest quote density)
    let crownedLaurelId = null;
    if (laurelCandidates.length > 0) {
      // Sort by quote count descending
      laurelCandidates.sort((a, b) => b.quoteCount - a.quoteCount);
      const topCandidate = laurelCandidates[0];
      
      // Only crown if they have at least 1 valid quote density
      if (topCandidate.quoteCount > 0) {
        crownedLaurelId = topCandidate.id;
        await Database.query(`
          UPDATE submissions 
          SET has_laurel = true 
          WHERE id = $1
        `, [crownedLaurelId]);
        console.log(`Crowned Weekly Laurel for submission ID: ${crownedLaurelId} with ${topCandidate.quoteCount} valid quotes.`);
      }
    }

    // 4. Audit Streaks
    console.log('Auditing member active streaks with idempotency check...');
    const currentCycleFriday = getFridayOfCurrentCycle().toISOString().split('T')[0];
    
    const allUsers = await Database.query(`SELECT id, writing_streak, streak_audited_week FROM users`);
    const streakUpdates = [];

    for (const u of allUsers) {
      // Idempotency check: skip if already audited this cycle week
      const lastAuditedWeek = u.streak_audited_week ? new Date(u.streak_audited_week).toISOString().split('T')[0] : null;
      if (lastAuditedWeek === currentCycleFriday) {
        console.log(`User ${u.id} already audited for week ${currentCycleFriday}. Skipping.`);
        continue;
      }

      // Check if user submitted writing in the past week
      const subCheck = await Database.queryOne(`
        SELECT 1 FROM submissions 
        WHERE author_id = $1 AND created_at >= $2
        LIMIT 1
      `, [u.id, sevenDaysAgo]);

      // Check if user submitted a peer review in the past week
      const revCheck = await Database.queryOne(`
        SELECT 1 FROM peer_reviews 
        WHERE reviewer_id = $1 AND created_at >= $2
        LIMIT 1
      `, [u.id, sevenDaysAgo]);

      const isSubmittingMember = !!subCheck;
      const isReviewingMember = !!revCheck;
      const activeThisWeek = isSubmittingMember || isReviewingMember;

      let newStreak = 0;
      let streakBonusAwarded = false;

      if (activeThisWeek) {
        newStreak = parseInt(u.writing_streak || 0) + 1;
        
        // Award on 4th consecutive week milestone
        if (newStreak > 0 && newStreak % 4 === 0) {
          streakBonusAwarded = true;
          // 2.5 Milestone Tokens (no Leaves)
          await Database.query(`
            UPDATE users 
            SET milestone_tokens = milestone_tokens + 2.5,
                writing_streak = $1,
                streak_audited_week = $2
            WHERE id = $3
          `, [newStreak, currentCycleFriday, u.id]);
        } else {
          await Database.query(`
            UPDATE users 
            SET writing_streak = $1,
                streak_audited_week = $2
            WHERE id = $3
          `, [newStreak, currentCycleFriday, u.id]);
        }
      } else {
        // Reset streak if inactive
        await Database.query(`
          UPDATE users 
          SET writing_streak = 0,
              streak_audited_week = $1
          WHERE id = $2
        `, [currentCycleFriday, u.id]);
      }

      streakUpdates.push({
        userId: u.id,
        activeThisWeek,
        newStreak,
        streakBonusAwarded
      });
    }

    return NextResponse.json({
      success: true,
      crownedLaurelId,
      streakUpdatesCount: streakUpdates.length,
      streakUpdates
    });
  } catch (error) {
    console.error('Friday Recap failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Recap failed' }, { status: 500 });
  }
}

// Support GET requests in development for manual testing
export async function GET(request) {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    return NextResponse.json({ success: false, error: 'Method Not Allowed' }, { status: 405 });
  }
  return POST(request);
}
