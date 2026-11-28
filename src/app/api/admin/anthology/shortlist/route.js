import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';
import { Database } from '@/lib/db';
import { callGeminiProse } from '@/lib/heraldLore';

export const dynamic = 'force-dynamic';

const SUPERADMIN_EMAILS = ['umorgan2001@gmail.com', 'paperthoughts01@gmail.com'];
const MAX_CATEGORY_JURY_CHARS = 320000;

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
    citations[s.id] = `Selected for compelling narrative craft, complete thematic arc, and strong community resonance (${s.communityScore} signal pts).`;
  });

  poems.slice(0, 3).forEach((p, idx) => {
    poemPlacements[idx + 1] = p.id;
    citations[p.id] = `Celebrated for evocative imagery, rhythmic poise, and warm reception across The Living Salon (${p.communityScore} signal pts).`;
  });

  return { storyPlacements, poemPlacements, citations };
}

/**
 * Assemble candidate payloads with full manuscript body_text and peer review praise/highlights,
 * stopping cleanly only if combined payload approaches the safe prompt size ceiling.
 */
function buildCategoryJuryPayload(items, reviewsBySub, commentsBySub, categoryLabel) {
  const packet = [];
  let charBudget = 0;

  for (const item of items) {
    const fullText = (item.full_text || item.logline || '').trim();
    const subReviews = (reviewsBySub[item.id] || []).slice(0, 8).map((r) => ({
      helpful: Boolean(r.is_helpful),
      pacing: r.pacing_score,
      technical: r.technical_score,
      standoutQuote: r.highwater_response || null,
      mirror: r.mirror_response ? r.mirror_response.slice(0, 260) : null,
      constructive: r.pivot_response ? r.pivot_response.slice(0, 260) : null,
    }));
    const readerComments = (commentsBySub[item.id] || []).slice(0, 6);

    const entry = {
      id: item.id,
      category: categoryLabel,
      title: item.title,
      genre: item.genre,
      communityScore: item.communityScore,
      helpfulReviews: item.helpful_reviews,
      reviewsCount: item.reviews_count,
      avgRating: item.avg_rating,
      ratingCount: item.rating_count,
      likesCount: item.likes_count,
      tipsAmount: item.tips_amount,
      peerReviews: subReviews,
      salonComments: readerComments,
      fullManuscript: fullText,
    };

    const entrySize = JSON.stringify(entry).length;
    if (packet.length >= 3 && charBudget + entrySize > MAX_CATEGORY_JURY_CHARS) {
      break;
    }
    packet.push(entry);
    charBudget += entrySize;
  }

  return packet;
}

/**
 * Run a dedicated full-manuscript Gemini evaluation for one category (Stories or Poetry).
 */
async function evaluateCategoryWithGemini({ monthYear, categoryLabel, candidates, reviewsBySub, commentsBySub }) {
  if (!candidates || candidates.length === 0) return null;

  const packet = buildCategoryJuryPayload(candidates, reviewsBySub, commentsBySub, categoryLabel);
  const categoryTitle = categoryLabel === 'poem' ? 'Poetry & Verses' : 'Short Stories & Prose';

  const systemPrompt = `You are the Senior Literary Jury Advisor for Paper Thoughts ("The Living Anthology", issue ${monthYear}), judging the ${categoryTitle} division.
You are given the COMPLETE text ("fullManuscript") of every shortlisted candidate—read every piece from opening line to ending—alongside reader peer critiques, standout quotes, ratings, likes, and Leaves tipped.
Evaluate holistically:
1. Full narrative/poetic arc, structural resolution & ending impact
2. Originality of voice, sensory imagery, emotional truth & sentence/stanza craft
3. Reader consensus (helpful critiques, peer praise quotes, Salon ratings & Leaves tipped)

Do NOT publish automatically — you are preparing an editable Top 3 shortlist draft for the Chief Editor.
Return STRICT JSON only (no markdown fences) with this exact shape:
{
  "placements": { "1": number|null, "2": number|null, "3": number|null },
  "citations": { "<id>": "1-2 sentence specific literary praise referencing the craft of the piece" },
  "rationale": "1-2 sentence category jury summary explaining why these finalists stood out"
}
Rules: Use only IDs present in the candidate list, do not duplicate any ID, and leave unused slots null if fewer than 3 candidates exist.`;

  const aiRaw = await callGeminiProse(systemPrompt, `Full-Text Candidates (${categoryTitle}):\n${JSON.stringify(packet)}`, {
    temperature: 0.35,
    maxOutputTokens: 2200,
    timeoutMs: 28000,
  });

  return parseJsonResponse(aiRaw);
}

/**
 * POST /api/admin/anthology/shortlist
 * Hybrid Full-Manuscript AI + Community Signal Jury: suggests editable Top 3 Short Stories,
 * Top 3 Poems, and draft Editor Citations without auto-publishing to monthly_anthology_entries.
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
         COALESCE(s.body_text, '') AS full_text,
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

    const subIds = rows.map((r) => r.id);
    const [reviewRows, commentRows] = await Promise.all([
      Database.query(
        `SELECT submission_id, pacing_score, technical_score, is_helpful, highwater_response, mirror_response, pivot_response
         FROM peer_reviews
         WHERE submission_id = ANY($1)
         ORDER BY is_helpful DESC, created_at DESC`,
        [subIds]
      ).catch(() => []),
      Database.query(
        `SELECT submission_id, content
         FROM submission_comments
         WHERE submission_id = ANY($1)
         ORDER BY created_at DESC`,
        [subIds]
      ).catch(() => []),
    ]);

    const reviewsBySub = {};
    for (const r of reviewRows) {
      if (!reviewsBySub[r.submission_id]) reviewsBySub[r.submission_id] = [];
      reviewsBySub[r.submission_id].push(r);
    }

    const commentsBySub = {};
    for (const c of commentRows) {
      if (!commentsBySub[c.submission_id]) commentsBySub[c.submission_id] = [];
      if (c.content) commentsBySub[c.submission_id].push(c.content.slice(0, 220));
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

    const [storyEval, poemEval] = await Promise.all([
      evaluateCategoryWithGemini({
        monthYear,
        categoryLabel: 'story',
        candidates: stories.slice(0, 15),
        reviewsBySub,
        commentsBySub,
      }),
      evaluateCategoryWithGemini({
        monthYear,
        categoryLabel: 'poem',
        candidates: poems.slice(0, 15),
        reviewsBySub,
        commentsBySub,
      }),
    ]);

    const storyIds = new Set(stories.map((s) => s.id));
    const poemIds = new Set(poems.map((p) => p.id));

    let aiPowered = false;
    const finalStoryPlacements = { ...fallback.storyPlacements };
    const finalPoemPlacements = { ...fallback.poemPlacements };
    const finalCitations = { ...fallback.citations };
    const rationaleParts = [];

    if (storyEval?.placements) {
      aiPowered = true;
      const usedStoryIds = new Set();
      [1, 2, 3].forEach((rank) => {
        const candidateId = parseInt(storyEval.placements?.[String(rank)] ?? storyEval.placements?.[rank], 10);
        if (storyIds.has(candidateId) && !usedStoryIds.has(candidateId)) {
          finalStoryPlacements[rank] = candidateId;
          usedStoryIds.add(candidateId);
        }
      });
      if (storyEval.citations && typeof storyEval.citations === 'object') {
        Object.entries(storyEval.citations).forEach(([idKey, cite]) => {
          const parsedId = parseInt(idKey, 10);
          if (storyIds.has(parsedId) && typeof cite === 'string' && cite.trim()) {
            finalCitations[parsedId] = cite.trim().slice(0, 320);
          }
        });
      }
      if (typeof storyEval.rationale === 'string' && storyEval.rationale.trim()) {
        rationaleParts.push(`Prose Jury: ${storyEval.rationale.trim()}`);
      }
    }

    if (poemEval?.placements) {
      aiPowered = true;
      const usedPoemIds = new Set();
      [1, 2, 3].forEach((rank) => {
        const candidateId = parseInt(poemEval.placements?.[String(rank)] ?? poemEval.placements?.[rank], 10);
        if (poemIds.has(candidateId) && !usedPoemIds.has(candidateId)) {
          finalPoemPlacements[rank] = candidateId;
          usedPoemIds.add(candidateId);
        }
      });
      if (poemEval.citations && typeof poemEval.citations === 'object') {
        Object.entries(poemEval.citations).forEach(([idKey, cite]) => {
          const parsedId = parseInt(idKey, 10);
          if (poemIds.has(parsedId) && typeof cite === 'string' && cite.trim()) {
            finalCitations[parsedId] = cite.trim().slice(0, 320);
          }
        });
      }
      if (typeof poemEval.rationale === 'string' && poemEval.rationale.trim()) {
        rationaleParts.push(`Poetry Jury: ${poemEval.rationale.trim()}`);
      }
    }

    const rationale = rationaleParts.length > 0
      ? rationaleParts.join(' | ')
      : 'Ranked by weighted Community Signal (Helpful Reviews, Salon Ratings, Likes & Leaves Tipped). Adjust any placement or citation before publishing.';

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
