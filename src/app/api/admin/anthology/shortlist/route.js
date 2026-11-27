import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';
import { Database } from '@/lib/db';
import { callGeminiProse } from '@/lib/heraldLore';

export const dynamic = 'force-dynamic';

const SUPERADMIN_EMAILS = ['umorgan2001@gmail.com', 'paperthoughts01@gmail.com'];

/**
 * Determine whether a submission belongs to Poetry vs Prose/Short Story.
 */
function isPoetrySubmission(sub) {
  const combined = `${sub.genre || ''}`.toLowerCase();
  return combined.includes('poem') || combined.includes('poetry') || combined.includes('verse');
}

/**
 * Extract JSON object from an LLM text response cleanly.
 */
function parseJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  try {
    return JSON.parse(cleaned.slice(startIdx, endIdx + 1));
  } catch {
    return null;
  }
}

/**
 * Build deterministic community-signal shortlist & default literary citations as a fallback
 * when Gemini is unavailable or omits a slot.
 */
function buildFallbackShortlist(stories, poems) {
  const storyPlacements = { 1: null, 2: null, 3: null };
  const poemPlacements = { 1: null, 2: null, 3: null };
  const citations = {};

  stories.slice(0, 3).forEach((s, idx) => {
    storyPlacements[idx + 1] = s.id;
    citations[s.id] = `Selected for compelling narrative craft, strong community resonance (${s.communityScore} signal pts), and emotional clarity.`;
  });

  poems.slice(0, 3).forEach((p, idx) => {
    poemPlacements[idx + 1] = p.id;
    citations[p.id] = `Celebrated for evocative imagery, rhythmic poise, and warm reception across The Living Salon (${p.communityScore} signal pts).`;
  });

  return { storyPlacements, poemPlacements, citations };
}

/**
 * POST /api/admin/anthology/shortlist
 * Hybrid AI + Community Signal Jury: suggests editable Top 3 Short Stories, Top 3 Poems,
 * and draft Editor Citations without auto-publishing to monthly_anthology_entries.
 */
export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(user);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = (dbUser.email || '').toLowerCase();
    const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail);
    const canModerate = isSuperAdmin || (await hasPermission(dbUser.id, 'moderate_submissions'));
    if (!canModerate) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const monthYear = body?.monthYear || new Date().toISOString().slice(0, 7);
    const allEligible = Boolean(body?.allEligible);

    const rows = await Database.query(
      `SELECT
         s.id,
         s.title,
         s.genre,
         s.pen_name,
         s.logline,
         LEFT(COALESCE(s.body_text, ''), 1200) AS excerpt,
         s.cycle_month,
         u.full_name AS author_name,
         COALESCE((SELECT COUNT(*)::int FROM submission_likes sl WHERE sl.submission_id = s.id), 0) AS likes_count,
         COALESCE((SELECT COUNT(*)::int FROM submission_ratings sr WHERE sr.submission_id = s.id), 0) AS rating_count,
         COALESCE((SELECT ROUND(AVG(sr.rating)::numeric, 2) FROM submission_ratings sr WHERE sr.submission_id = s.id), 0)::float AS avg_rating,
         COALESCE((SELECT COUNT(*)::int FROM peer_reviews pr WHERE pr.submission_id = s.id), 0) AS reviews_count,
         COALESCE((SELECT COUNT(*)::int FROM peer_reviews pr WHERE pr.submission_id = s.id AND pr.is_helpful = TRUE), 0) AS helpful_reviews,
         COALESCE((SELECT SUM(st.amount)::int FROM submission_tips st WHERE st.submission_id = s.id), 0) AS tips_amount,
         COALESCE((SELECT COUNT(*)::int FROM submission_tips st WHERE st.submission_id = s.id), 0) AS tips_count
       FROM submissions s
       JOIN users u ON u.id = s.author_id
       WHERE s.batch_status IN ('active_batch', 'archived')
         AND ($1::boolean = TRUE OR s.cycle_month = $2 OR COALESCE(s.cycle_month, '') = '')
       ORDER BY s.created_at DESC
       LIMIT 80`,
      [allEligible, monthYear]
    );

    if (!rows.length) {
      return NextResponse.json({
        success: false,
        error: `No eligible manuscripts found for cycle ${monthYear}.`,
      }, { status: 400 });
    }

    const enriched = rows.map((r) => {
      const communityScore = Number(
        (
          (r.helpful_reviews || 0) * 5 +
          (r.reviews_count || 0) * 1.5 +
          (r.avg_rating || 0) * (r.rating_count || 0) * 2 +
          (r.likes_count || 0) * 2 +
          (r.tips_amount || 0) * 0.4
        ).toFixed(1)
      );
      return {
        ...r,
        isPoetry: isPoetrySubmission(r),
        communityScore,
      };
    });

    const stories = enriched
      .filter((r) => !r.isPoetry)
      .sort((a, b) => b.communityScore - a.communityScore);
    const poems = enriched
      .filter((r) => r.isPoetry)
      .sort((a, b) => b.communityScore - a.communityScore);

    const fallback = buildFallbackShortlist(stories, poems);

    const topForJury = [
      ...stories.slice(0, 12).map((s) => ({
        id: s.id,
        category: 'story',
        title: s.title,
        genre: s.genre,
        communityScore: s.communityScore,
        helpfulReviews: s.helpful_reviews,
        avgRating: s.avg_rating,
        ratingCount: s.rating_count,
        likesCount: s.likes_count,
        tipsAmount: s.tips_amount,
        excerpt: (s.excerpt || s.logline || '').replace(/\s+/g, ' ').slice(0, 700),
      })),
      ...poems.slice(0, 12).map((p) => ({
        id: p.id,
        category: 'poem',
        title: p.title,
        genre: p.genre,
        communityScore: p.communityScore,
        helpfulReviews: p.helpful_reviews,
        avgRating: p.avg_rating,
        ratingCount: p.rating_count,
        likesCount: p.likes_count,
        tipsAmount: p.tips_amount,
        excerpt: (p.excerpt || p.logline || '').replace(/\s+/g, ' ').slice(0, 700),
      })),
    ];

    const systemPrompt = `You are the Literary Jury Advisor for Paper Thoughts ("The Living Anthology", issue ${monthYear}).
Evaluate both writing craft (voice, imagery, narrative tension, originality) from each excerpt AND weighted Community Signal (helpful reviews, star ratings, likes, and Leaves tipped).
Do NOT publish anything automatically — you are preparing an editable shortlist draft for the Chief Editor.
Return STRICT JSON only (no markdown fences) with this exact shape:
{
  "storyPlacements": { "1": number|null, "2": number|null, "3": number|null },
  "poemPlacements": { "1": number|null, "2": number|null, "3": number|null },
  "citations": { "<id>": "1-2 sentence literary praise suitable for the Laureate card" },
  "rationale": "2-sentence overview for the Chief Editor explaining why these finalists rose to the top"
}
Rules: Use only submission IDs present in the candidate list, place story candidates only in storyPlacements and poem candidates only in poemPlacements, and never duplicate an ID.`;

    const userPrompt = `Candidates JSON:\n${JSON.stringify(topForJury)}`;
    const aiRaw = await callGeminiProse(systemPrompt, userPrompt, {
      temperature: 0.4,
      maxOutputTokens: 1600,
      timeoutMs: 12000,
    });

    const parsed = parseJsonResponse(aiRaw);
    const storyIds = new Set(stories.map((s) => s.id));
    const poemIds = new Set(poems.map((p) => p.id));

    let aiPowered = false;
    let finalStoryPlacements = { ...fallback.storyPlacements };
    let finalPoemPlacements = { ...fallback.poemPlacements };
    let finalCitations = { ...fallback.citations };
    let rationale = 'Ranked by weighted Community Signal (Helpful Reviews, Salon Ratings, Likes & Leaves Tipped). Adjust any placement or citation before publishing.';

    if (parsed && (parsed.storyPlacements || parsed.poemPlacements)) {
      aiPowered = true;
      const usedStoryIds = new Set();
      [1, 2, 3].forEach((rank) => {
        const candidateId = parseInt(parsed.storyPlacements?.[String(rank)] ?? parsed.storyPlacements?.[rank], 10);
        if (storyIds.has(candidateId) && !usedStoryIds.has(candidateId)) {
          finalStoryPlacements[rank] = candidateId;
          usedStoryIds.add(candidateId);
        }
      });

      const usedPoemIds = new Set();
      [1, 2, 3].forEach((rank) => {
        const candidateId = parseInt(parsed.poemPlacements?.[String(rank)] ?? parsed.poemPlacements?.[rank], 10);
        if (poemIds.has(candidateId) && !usedPoemIds.has(candidateId)) {
          finalPoemPlacements[rank] = candidateId;
          usedPoemIds.add(candidateId);
        }
      });

      if (parsed.citations && typeof parsed.citations === 'object') {
        Object.entries(parsed.citations).forEach(([idKey, cite]) => {
          const parsedId = parseInt(idKey, 10);
          if ((storyIds.has(parsedId) || poemIds.has(parsedId)) && typeof cite === 'string' && cite.trim()) {
            finalCitations[parsedId] = cite.trim().slice(0, 320);
          }
        });
      }

      if (typeof parsed.rationale === 'string' && parsed.rationale.trim()) {
        rationale = parsed.rationale.trim();
      }
    }

    return NextResponse.json({
      success: true,
      aiPowered,
      storyPlacements: finalStoryPlacements,
      poemPlacements: finalPoemPlacements,
      citations: finalCitations,
      rationale,
      evaluatedCount: enriched.length,
    });
  } catch (error) {
    console.error('Error generating AI anthology shortlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate anthology shortlist.' },
      { status: 500 }
    );
  }
}
