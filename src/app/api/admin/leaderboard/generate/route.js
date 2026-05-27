import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

const SYSTEM_PROMPT = `
You are the Chief AI Editorial Assistant for "Paper Thoughts".
Your task is to analyze the community's literary activity from the past 30 days and nominate winners for three monthly awards:
1. "Review of the Month" (most consistent, detailed, and in-depth critiquing)
2. "Author of the Month" (excellent stories/poems submitted, highly active)
3. "Most Improved Author" (someone showing noticeable progress in their writing or critique quality)

You will be provided with a JSON list of active users, their stats (submissions count, peer review count, book review count), and samples of their reviews and critiques.

CRITICAL RULES:
1. Select the winners ONLY from the provided user list.
2. Provide a short, inspiring, and professional editorial blurb (2-3 sentences) for each award, highlighting why they won. Keep the tone literary, encouraging, and sophisticated.
3. Respond ONLY with a valid, raw JSON object matching the exact schema requested below. Do not include markdown backticks.

OUTPUT JSON SCHEMA:
{
  "review_of_the_month_user_id": integer or null,
  "review_of_the_month_text": "Reasoning blurb...",
  "author_of_the_month_user_id": integer or null,
  "author_of_the_month_text": "Reasoning blurb...",
  "most_improved_author_user_id": integer or null,
  "most_improved_author_text": "Reasoning blurb..."
}
`;

export async function POST(request) {
  try {
    // 1. Authorize Admin
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
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { monthYear } = body; // e.g. "May 2026"
    if (!monthYear) {
      return NextResponse.json({ success: false, error: 'Missing monthYear parameter.' }, { status: 400 });
    }

    // 2. Fetch Active Books & Bookies
    // Find active General Book
    const generalBook = await Database.queryOne(`
      SELECT id, title FROM book_of_the_month WHERE active = TRUE AND chapter_id IS NULL LIMIT 1
    `);
    // Find active Abuja Book
    const abujaBook = await Database.queryOne(`
      SELECT id, title FROM book_of_the_month WHERE active = TRUE AND chapter_id = 3 LIMIT 1
    `);

    let generalBookieUser = null;
    let abujaBookieUser = null;

    if (generalBook) {
      generalBookieUser = await Database.queryOne(`
        SELECT u.id, u.full_name as "name"
        FROM book_of_the_month_reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.book_of_the_month_id = $1 AND r.is_bookie = TRUE
        LIMIT 1
      `, [generalBook.id]);
    }

    if (abujaBook) {
      abujaBookieUser = await Database.queryOne(`
        SELECT u.id, u.full_name as "name"
        FROM book_of_the_month_reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.book_of_the_month_id = $1 AND r.is_bookie = TRUE
        LIMIT 1
      `, [abujaBook.id]);
    }

    // 3. Fetch User Activity Stats and text samples from the past 30 days
    const activeUsers = await Database.query(`
      SELECT u.id, u.full_name as "name",
             (SELECT COUNT(*) FROM submissions s WHERE s.author_id = u.id AND s.created_at >= NOW() - INTERVAL '30 days') as "submissionCount",
             (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.reviewer_id = u.id AND pr.created_at >= NOW() - INTERVAL '30 days') as "peerReviewCount",
             (SELECT COUNT(*) FROM book_of_the_month_reviews bmr WHERE bmr.user_id = u.id AND bmr.created_at >= NOW() - INTERVAL '30 days') as "bookReviewCount"
      FROM users u
      WHERE u.clerk_id IS NOT NULL
      ORDER BY "peerReviewCount" DESC, "submissionCount" DESC
    `);

    // Fetch review samples for context
    const rawPeerReviews = await Database.query(`
      SELECT reviewer_id, mirror_response, highwater_response, pivot_response
      FROM peer_reviews
      WHERE created_at >= NOW() - INTERVAL '30 days'
      LIMIT 30
    `);

    const rawBookReviews = await Database.query(`
      SELECT user_id, review_text
      FROM book_of_the_month_reviews
      WHERE created_at >= NOW() - INTERVAL '30 days'
      LIMIT 20
    `);

    // Filter users who have at least some activity
    const activeCandidates = activeUsers.map(u => {
      const peerSamples = rawPeerReviews
        .filter(r => r.reviewer_id === u.id)
        .map(r => `Critique: ${r.mirror_response.substring(0, 80)}... / constructive: ${r.pivot_response.substring(0, 80)}...`);
      const bookSamples = rawBookReviews
        .filter(r => r.user_id === u.id)
        .map(r => `Book Review: ${r.review_text.substring(0, 100)}...`);

      return {
        id: u.id,
        name: u.name,
        submissions: parseInt(u.submissionCount || 0),
        peerReviews: parseInt(u.peerReviewCount || 0),
        bookReviews: parseInt(u.bookReviewCount || 0),
        samples: [...peerSamples, ...bookSamples].slice(0, 3)
      };
    }).filter(u => u.submissions > 0 || u.peerReviews > 0 || u.bookReviews > 0);

    // 4. Run LLM request or fallback
    const apiKey = process.env.SERVERLESS_LLM_API_KEY;
    let aiSelections = null;

    if (activeCandidates.length > 0 && apiKey && apiKey !== 'MISSING' && apiKey !== '') {
      try {
        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `CONTEXT ACTIVE CANDIDATES:\n${JSON.stringify(activeCandidates, null, 2)}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          })
        });

        if (!response.ok) {
          throw new Error(`LLM API status ${response.status}`);
        }

        const result = await response.json();
        aiSelections = JSON.parse(result.choices[0].message.content);
      } catch (err) {
        console.error("Together AI Leaderboard request failed, using fallback:", err);
        aiSelections = generateLocalLeaderboardFallback(activeCandidates);
      }
    } else {
      aiSelections = generateLocalLeaderboardFallback(activeCandidates);
    }

    // Assemble final response combining AI nominations and DB-driven Bookies
    return NextResponse.json({
      success: true,
      monthYear,
      generalBookie: generalBookieUser ? { id: generalBookieUser.id, name: generalBookieUser.name, bookTitle: generalBook.title } : null,
      abujaBookie: abujaBookieUser ? { id: abujaBookieUser.id, name: abujaBookieUser.name, bookTitle: abujaBook.title } : null,
      nominations: {
        reviewOfTheMonth: {
          userId: aiSelections.review_of_the_month_user_id,
          name: activeUsers.find(u => u.id === aiSelections.review_of_the_month_user_id)?.name || 'N/A',
          text: aiSelections.review_of_the_month_text || 'No review highlights selected.'
        },
        authorOfTheMonth: {
          userId: aiSelections.author_of_the_month_user_id,
          name: activeUsers.find(u => u.id === aiSelections.author_of_the_month_user_id)?.name || 'N/A',
          text: aiSelections.author_of_the_month_text || 'No author highlights selected.'
        },
        mostImprovedAuthor: {
          userId: aiSelections.most_improved_author_user_id,
          name: activeUsers.find(u => u.id === aiSelections.most_improved_author_user_id)?.name || 'N/A',
          text: aiSelections.most_improved_author_text || 'No improved author highlights selected.'
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard generation failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate leaderboard.' }, { status: 500 });
  }
}

/**
 * Fallback to pick candidates based on statistical activity when Together AI is down.
 */
function generateLocalLeaderboardFallback(candidates) {
  if (candidates.length === 0) {
    return {
      review_of_the_month_user_id: null,
      review_of_the_month_text: "No active critiques were found in this cycle to evaluate.",
      author_of_the_month_user_id: null,
      author_of_the_month_text: "No writing submissions were submitted in this cycle to evaluate.",
      most_improved_author_user_id: null,
      most_improved_author_text: "Not enough comparative data was found in this cycle."
    };
  }

  // Review of the Month: Person with the most critiques/reviews
  const topReviewer = [...candidates].sort((a, b) => (b.peerReviews + b.bookReviews) - (a.peerReviews + a.bookReviews))[0];
  // Author of the Month: Person with the most submissions
  const topAuthor = [...candidates].sort((a, b) => b.submissions - a.submissions)[0];
  // Most Improved: Person with next highest activity or secondary reviewer
  const runnerUp = [...candidates].sort((a, b) => (b.peerReviews + b.submissions) - (a.peerReviews + a.submissions))[1] || topReviewer;

  return {
    review_of_the_month_user_id: topReviewer?.id || null,
    review_of_the_month_text: topReviewer 
      ? `${topReviewer.name} demonstrated outstanding dedication to peer review, completing ${topReviewer.peerReviews} thorough critiques and ${topReviewer.bookReviews} book reviews this cycle.`
      : "No reviews were available.",
    author_of_the_month_user_id: topAuthor?.id || null,
    author_of_the_month_text: topAuthor
      ? `${topAuthor.name} enriched the Clubhouse this month by submitting ${topAuthor.submissions} original manuscripts to the Writers' Village.`
      : "No authors were available.",
    most_improved_author_user_id: runnerUp?.id || null,
    most_improved_author_text: runnerUp
      ? `${runnerUp.name} showed stellar growth and support this month, consistently engaging with and refining community drafts.`
      : "No improved authors were available."
  };
}
