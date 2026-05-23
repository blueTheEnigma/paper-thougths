import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { synthesizeWeeklyReviews } from '@/services/reviewSynthesizer';

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

export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // Authorization check
    if (!isDev && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Friday Recap cron (Synthesis, Laurel, Streaks)...');

    // 1. Fetch all active submissions
    const activeSubmissions = await Database.query(`
      SELECT id, title, genre, logline, body_text 
      FROM submissions 
      WHERE batch_status = 'active_batch'
    `);

    console.log(`Found ${activeSubmissions.length} active submissions to process.`);

    const synthesisResults = [];
    const laurelCandidates = [];

    // 2. Synthesize each active submission and compute quote density for Laurel
    for (const sub of activeSubmissions) {
      try {
        // Run synthesis (saves to DB and sets status to 'archived')
        const summary = await synthesizeWeeklyReviews(sub.id);
        synthesisResults.push({ id: sub.id, success: !!summary });
        
        // Fetch human reviews for quote density calculation
        const reviews = await Database.query(`
          SELECT highwater_response FROM peer_reviews WHERE submission_id = $1
        `, [sub.id]);

        const quoteCount = calculateQuoteDensity(reviews, sub.body_text);
        laurelCandidates.push({ id: sub.id, quoteCount });
      } catch (err) {
        console.error(`Error in synthesis for submission ${sub.id}:`, err);
        synthesisResults.push({ id: sub.id, success: false, error: err.message });
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

    // 4. Audit Streaks (Saturday 12:00 AM to Friday 12:00 PM)
    console.log('Auditing member active streaks...');
    const allUsers = await Database.query(`SELECT id, writing_streak FROM users`);
    const streakUpdates = [];

    // Calculate current batch cycle range (past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const u of allUsers) {
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
                writing_streak = $1
            WHERE id = $2
          `, [newStreak, u.id]);
        } else {
          await Database.query(`
            UPDATE users 
            SET writing_streak = $1
            WHERE id = $2
          `, [newStreak, u.id]);
        }
      } else {
        // Reset streak if inactive
        await Database.query(`
          UPDATE users 
          SET writing_streak = 0
          WHERE id = $1
        `, [u.id]);
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
      synthesisCount: synthesisResults.length,
      synthesisResults,
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
