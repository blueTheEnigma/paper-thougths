import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { isCronAuthorized, getLastSaturdayStart } from '@/lib/cronAuth';
import { callGeminiProse, getWeeklyLaurelBroadcast } from '@/lib/heraldLore';
import { sendHeraldGroupBroadcast } from '@/lib/herald';

export const dynamic = 'force-dynamic';

function cleanText(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateQuoteDensity(reviews, bodyText) {
  const cleanedBody = cleanText(bodyText);
  if (!cleanedBody) return 0;

  let validQuoteCount = 0;
  for (const r of reviews) {
    const quote = r.highwater_response ? r.highwater_response.trim() : '';
    if (!quote || quote.length < 12) continue;
    const cleanedQuote = cleanText(quote);
    if (cleanedQuote && cleanedBody.includes(cleanedQuote)) {
      validQuoteCount++;
    } else {
      const sentences = quote.split(/[.!?\n]+/).map(s => cleanText(s)).filter(s => s.length > 15);
      if (sentences.some(s => cleanedBody.includes(s))) validQuoteCount++;
    }
  }
  return validQuoteCount;
}

function getFridayOfCurrentCycle() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  const friday = new Date(now);
  friday.setUTCDate(now.getUTCDate() - diff);
  friday.setUTCHours(0, 0, 0, 0);
  return friday;
}

export async function GET(request) {
  return POST(request);
}

export async function POST(request) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Friday Recap cron (Hybrid Weekly Laurel & Vectorized Streak Audit)...');

    const lastSaturday = getLastSaturdayStart();
    const cycleThreshold = new Date(lastSaturday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const currentCycleFriday = getFridayOfCurrentCycle().toISOString().split('T')[0];

    // 1. Fetch eligible Laurel candidates from recent submissions that haven't already won Laurel
    const candidates = await Database.query(`
      SELECT s.id, s.title, s.genre, s.logline, s.body_text,
             COALESCE(s.pen_name, u.full_name, 'Anonymous Scribe') as pen_name,
             (SELECT COUNT(*)::int FROM submission_likes sl WHERE sl.submission_id = s.id) as likes_count,
             (SELECT COUNT(*)::int FROM submission_ratings sr WHERE sr.submission_id = s.id) as rating_count,
             (SELECT COALESCE(AVG(sr.rating), 0)::float FROM submission_ratings sr WHERE sr.submission_id = s.id) as avg_rating
      FROM submissions s
      JOIN users u ON u.id = s.author_id
      WHERE COALESCE(s.has_laurel, FALSE) = FALSE
        AND s.batch_status IN ('active_batch', 'archived')
        AND s.created_at >= $1
      ORDER BY s.created_at DESC
      LIMIT 30
    `, [cycleThreshold]);

    let crownedLaurelId = null;
    let crownedReason = '';
    let crownedMeta = null;

    if (candidates.length > 0) {
      const candidateIds = candidates.map(c => c.id);
      const [allReviews, tipRows] = await Promise.all([
        Database.query(`
          SELECT submission_id, highwater_response, mirror_response, pivot_response, pacing_score, technical_score, is_helpful
          FROM peer_reviews
          WHERE submission_id = ANY($1)
        `, [candidateIds]),
        Database.query(`
          SELECT submission_id, COALESCE(SUM(amount), 0)::int AS tips_amount
          FROM submission_tips
          WHERE submission_id = ANY($1)
          GROUP BY submission_id
        `, [candidateIds]).catch(() => [])
      ]);
      const tipsBySub = Object.fromEntries(tipRows.map(t => [t.submission_id, parseInt(t.tips_amount || 0, 10)]));

      const scored = candidates.map(sub => {
        const subReviews = allReviews.filter(r => r.submission_id === sub.id);
        const quoteCount = calculateQuoteDensity(subReviews, sub.body_text);
        const avgCraft = subReviews.length > 0
          ? subReviews.reduce((acc, r) => acc + ((r.pacing_score || 3) + (r.technical_score || 3)) / 2, 0) / subReviews.length
          : 0;
        const tipsAmount = tipsBySub[sub.id] || 0;

        // Hybrid Weighted Score: quotes + peer review depth + Salon star ratings + likes + tips
        const signalScore =
          (quoteCount * 4) +
          (subReviews.length * 2) +
          avgCraft +
          (parseFloat(sub.avg_rating || 0) * 1.5) +
          (parseInt(sub.rating_count || 0, 10) * 0.8) +
          (parseInt(sub.likes_count || 0, 10) * 1.0) +
          (tipsAmount * 0.3);

        return {
          ...sub,
          quoteCount,
          tipsAmount,
          reviewCount: subReviews.length,
          reviewsData: subReviews,
          signalScore
        };
      }).sort((a, b) => b.signalScore - a.signalScore);

      // Evaluate top 6 weekly candidates thoroughly using FULL manuscript text + peer reviews
      let winner = scored[0];
      const topShortlist = scored.slice(0, Math.min(6, scored.length));

      if (topShortlist.length > 1) {
        const juryInput = topShortlist.map(c => ({
          id: c.id,
          title: c.title,
          genre: c.genre,
          logline: c.logline,
          fullManuscript: (c.body_text || c.logline || '').trim(),
          peerQuotes: (c.reviewsData || []).map(r => r.highwater_response).filter(Boolean).slice(0, 5),
          metrics: { reviews: c.reviewCount, quotes: c.quoteCount, likes: c.likes_count, rating: c.avg_rating, tips: c.tipsAmount }
        }));

        const juryRaw = await callGeminiProse(
          `You are the Senior Literary Judge of Paper Thoughts. Read each candidate's COMPLETE "fullManuscript" from beginning to end alongside peer reader quotes and engagement metrics. Select the 1 most accomplished work this week based on craft, vivid imagery, voice, ending payoff, and resonance. Respond ONLY with raw JSON: { "winnerId": <number>, "citation": "<1 crisp celebratory sentence>" }`,
          JSON.stringify(juryInput),
          { temperature: 0.2, maxOutputTokens: 400, timeoutMs: 18000 }
        );

        if (juryRaw) {
          try {
            const parsed = JSON.parse(juryRaw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
            const matched = topShortlist.find(c => c.id === parsed.winnerId);
            if (matched) {
              winner = matched;
              crownedReason = parsed.citation || '';
            }
          } catch {
            // Keep quantitative top winner cleanly
          }
        }
      }

      if (winner && (winner.signalScore > 0 || scored.length > 0)) {
        crownedLaurelId = winner.id;
        crownedMeta = winner;
        if (!crownedReason) {
          crownedReason = winner.quoteCount > 0
            ? `Praised by readers with ${winner.quoteCount} standout line citation(s) and ${winner.reviewCount} peer critique(s).`
            : `Led this cycle's community & craft shortlist (${winner.reviewCount} reviews, ${winner.likes_count} Salon likes).`;
        }

        await Database.query(`
          UPDATE submissions SET has_laurel = true WHERE id = $1
        `, [crownedLaurelId]);

        await sendHeraldGroupBroadcast({
          text: getWeeklyLaurelBroadcast({
            title: winner.title,
            genre: winner.genre,
            penName: winner.pen_name,
            reason: crownedReason
          }),
          idempotencyKey: `weekly_laurel_${currentCycleFriday}`,
          ritualType: 'weekly_laurel'
        }).catch(err => console.error('[Friday Recap] Herald broadcast error:', err.message));
      }
    }

    // 2. Bulk Vectorized Weekly Streak Audit (fast single-pass SQL instead of 164-user N+1 loop!)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const streakAuditResult = await Database.transaction(async (client) => {
      // Increment streak for users active via submission or review in the past 7 days
      const activeRes = await client.query(`
        UPDATE users u
        SET writing_streak = COALESCE(u.writing_streak, 0) + 1,
            milestone_tokens = CASE
              WHEN (COALESCE(u.writing_streak, 0) + 1) % 4 = 0 THEN COALESCE(u.milestone_tokens, 0) + 2.5
              ELSE COALESCE(u.milestone_tokens, 0)
            END,
            streak_audited_week = $1
        WHERE (u.streak_audited_week IS NULL OR u.streak_audited_week::date != $1::date)
          AND (
            EXISTS (SELECT 1 FROM submissions s WHERE s.author_id = u.id AND s.created_at >= $2)
            OR EXISTS (SELECT 1 FROM peer_reviews pr WHERE pr.reviewer_id = u.id AND pr.created_at >= $2)
          )
        RETURNING id
      `, [currentCycleFriday, sevenDaysAgo]);

      // Reset streak to 0 for inactive users
      const resetRes = await client.query(`
        UPDATE users u
        SET writing_streak = 0,
            streak_audited_week = $1
        WHERE (u.streak_audited_week IS NULL OR u.streak_audited_week::date != $1::date)
          AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.author_id = u.id AND s.created_at >= $2)
          AND NOT EXISTS (SELECT 1 FROM peer_reviews pr WHERE pr.reviewer_id = u.id AND pr.created_at >= $2)
        RETURNING id
      `, [currentCycleFriday, sevenDaysAgo]);

      return { incremented: activeRes.rows.length, reset: resetRes.rows.length };
    });

    return NextResponse.json({
      success: true,
      crownedLaurelId,
      crownedTitle: crownedMeta?.title || null,
      crownedReason: crownedReason || null,
      streakAudit: streakAuditResult
    });
  } catch (error) {
    console.error('Friday Recap failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Recap failed' }, { status: 500 });
  }
}
