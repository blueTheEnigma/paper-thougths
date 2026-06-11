import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const SYSTEM_PROMPT = `
You are the Chief AI Editorial Assistant for "Paper Thoughts".
Your task is to analyze the community's literary activity from the past 30 days and nominate winners for five monthly awards:
1. "Review of the Month" (most committed reviewer with the most detailed and constructive critiquing)
2. "Author of the Month" (the person who wrote genuinely loved prose pieces this month, wrote consistently, and is highly regarded based on the quality of peer reviews they received)
3. "Most Improved Author" (an author showing noticeable growth in narrative robustness, depth, and engagement)
4. "Poet of the Month" (the person who wrote outstanding poetry this month, demonstrating masterful poetic metrics and landing deeply with the community)
5. "Most Improved Poet" (a poet showing clear progression in poetic depth, structure, or critiquing quality)

CRITICAL RULES:
1. Select the winners ONLY from the provided candidate list.
2. Provide a short, inspiring, and professional editorial blurb (2-3 sentences) for each award, highlighting why they won. Keep the tone literary, encouraging, and sophisticated.
3. Respond ONLY with a valid, raw JSON object matching the exact schema requested below. Do not include markdown backticks or json indicators.

OUTPUT JSON SCHEMA:
{
  "review_of_the_month_user_id": integer or null,
  "review_of_the_month_text": "Reasoning blurb...",
  "author_of_the_month_user_id": integer or null,
  "author_of_the_month_text": "Reasoning blurb...",
  "most_improved_author_user_id": integer or null,
  "most_improved_author_text": "Reasoning blurb...",
  "poet_of_the_month_user_id": integer or null,
  "poet_of_the_month_text": "Reasoning blurb...",
  "most_improved_poet_user_id": integer or null,
  "most_improved_poet_text": "Reasoning blurb..."
}
`;

function getVotingMonthYear() {
  const now = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
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

    const currentMonthYear = getVotingMonthYear();
    console.log(`Running Monthly Honors for cycle: ${currentMonthYear}...`);

    // ─── 1. Tally Votes and Crown Winners ───
    const result = await Database.transaction(async (client) => {
      // Find winning General suggestion
      const genWinner = await client.query(`
        SELECT s.id, s.title, s.author, s.teaser, s.user_id, COUNT(v.id) as votes_count
        FROM botm_suggestions s
        LEFT JOIN botm_votes v ON v.suggestion_id = s.id
        WHERE s.month_year = $1 AND s.chapter_id IS NULL
        GROUP BY s.id
        ORDER BY votes_count DESC, s.created_at ASC
        LIMIT 1
      `, [currentMonthYear]);

      // Find winning Abuja suggestion
      const abjWinner = await client.query(`
        SELECT s.id, s.title, s.author, s.teaser, s.user_id, COUNT(v.id) as votes_count
        FROM botm_suggestions s
        LEFT JOIN botm_votes v ON v.suggestion_id = s.id
        WHERE s.month_year = $1 AND s.chapter_id = 3
        GROUP BY s.id
        ORDER BY votes_count DESC, s.created_at ASC
        LIMIT 1
      `, [currentMonthYear]);

      const genWinnerRow = genWinner.rows[0] || null;
      const abjWinnerRow = abjWinner.rows[0] || null;

      // Find current Bookies for General BOTM (before deactivation)
      const genBookie = await client.query(`
        SELECT r.user_id 
        FROM book_of_the_month_reviews r
        JOIN book_of_the_month b ON b.id = r.book_of_the_month_id
        WHERE b.active = TRUE AND b.chapter_id IS NULL AND r.is_bookie = TRUE
        LIMIT 1
      `);

      // Find current Bookies for Abuja BOTM (before deactivation)
      const abjBookie = await client.query(`
        SELECT r.user_id 
        FROM book_of_the_month_reviews r
        JOIN book_of_the_month b ON b.id = r.book_of_the_month_id
        WHERE b.active = TRUE AND b.chapter_id = 3 AND r.is_bookie = TRUE
        LIMIT 1
      `);

      const genBookieUserId = genBookie.rows[0]?.user_id || null;
      const abjBookieUserId = abjBookie.rows[0]?.user_id || null;

      // Award +50 leaves to Crowned Bookies
      if (genBookieUserId) {
        await client.query(`
          UPDATE users 
          SET spendable_leaves = spendable_leaves + 50,
              lifetime_leaves = lifetime_leaves + 50
          WHERE id = $1
        `, [genBookieUserId]);
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, 50, 'bonus', 'Crowned General Bookie leaf bonus for outstanding monthly reviews')
        `, [genBookieUserId]);
        console.log(`Awarded +50 leaves to General Bookie User ID: ${genBookieUserId}`);
      }

      if (abjBookieUserId) {
        await client.query(`
          UPDATE users 
          SET spendable_leaves = spendable_leaves + 50,
              lifetime_leaves = lifetime_leaves + 50
          WHERE id = $1
        `, [abjBookieUserId]);
        await client.query(`
          INSERT INTO leaf_transactions (user_id, amount, transaction_type, description)
          VALUES ($1, 50, 'bonus', 'Crowned Abuja Bookie leaf bonus for outstanding monthly reviews')
        `, [abjBookieUserId]);
        console.log(`Awarded +50 leaves to Abuja Bookie User ID: ${abjBookieUserId}`);
      }

      // Deactivate current active books
      await client.query(`
        UPDATE book_of_the_month 
        SET active = FALSE 
        WHERE active = TRUE
      `);

      // Crown General winner
      if (genWinnerRow) {
        await client.query(`
          INSERT INTO book_of_the_month (title, author, teaser, image_url, price, purchase_link, active, chapter_id)
          VALUES ($1, $2, $3, '/images/the_parlour_wife.png', '', '/bookstore', TRUE, NULL)
        `, [genWinnerRow.title, genWinnerRow.author, genWinnerRow.teaser]);
        console.log(`Crowned General BOTM: "${genWinnerRow.title}"`);
      }

      // Crown Abuja winner
      if (abjWinnerRow) {
        await client.query(`
          INSERT INTO book_of_the_month (title, author, teaser, image_url, price, purchase_link, active, chapter_id)
          VALUES ($1, $2, $3, '/images/the_parlour_wife.png', '', '/bookstore', TRUE, 3)
        `, [abjWinnerRow.title, abjWinnerRow.author, abjWinnerRow.teaser]);
        console.log(`Crowned Abuja BOTM: "${abjWinnerRow.title}"`);
      }

      return {
        genWinnerRow,
        abjWinnerRow,
        genBookieUserId,
        abjBookieUserId
      };
    });

    // ─── 2. Fetch candidates & reviews context for LLM honors selection ───
    const activeUsers = await Database.query(`
      SELECT u.id, u.full_name as "name", u.email,
             (SELECT COUNT(*) FROM submissions s WHERE s.author_id = u.id AND s.genre != 'Poetry' AND s.created_at >= NOW() - INTERVAL '30 days') as "storyCount",
             (SELECT COUNT(*) FROM submissions s WHERE s.author_id = u.id AND s.genre = 'Poetry' AND s.created_at >= NOW() - INTERVAL '30 days') as "poetryCount",
             (SELECT COUNT(*) FROM peer_reviews pr WHERE pr.reviewer_id = u.id AND pr.created_at >= NOW() - INTERVAL '30 days') as "peerReviewCount",
             (SELECT COUNT(*) FROM book_of_the_month_reviews bmr WHERE bmr.user_id = u.id AND bmr.created_at >= NOW() - INTERVAL '30 days') as "bookReviewCount"
      FROM users u
      WHERE u.clerk_id IS NOT NULL
      ORDER BY "peerReviewCount" DESC
    `);

    // Fetch review text fragments for context
    const rawPeerReviews = await Database.query(`
      SELECT reviewer_id, mirror_response, highwater_response, pivot_response
      FROM peer_reviews
      WHERE created_at >= NOW() - INTERVAL '30 days'
      LIMIT 40
    `);

    const rawBookReviews = await Database.query(`
      SELECT user_id, review_text
      FROM book_of_the_month_reviews
      WHERE created_at >= NOW() - INTERVAL '30 days'
      LIMIT 20
    `);

    const activeCandidates = activeUsers.map(u => {
      const peerSamples = rawPeerReviews
        .filter(r => r.reviewer_id === u.id)
        .map(r => `Critique: ${r.mirror_response.substring(0, 100)}... / constructive: ${r.pivot_response.substring(0, 100)}...`);
      const bookSamples = rawBookReviews
        .filter(r => r.user_id === u.id)
        .map(r => `Book Review: ${r.review_text.substring(0, 100)}...`);

      return {
        id: u.id,
        name: u.name,
        storiesSubmitted: parseInt(u.storyCount || 0),
        poemsSubmitted: parseInt(u.poetryCount || 0),
        peerReviews: parseInt(u.peerReviewCount || 0),
        bookReviews: parseInt(u.bookReviewCount || 0),
        samples: [...peerSamples, ...bookSamples].slice(0, 4)
      };
    }).filter(u => u.storiesSubmitted > 0 || u.poemsSubmitted > 0 || u.peerReviews > 0 || u.bookReviews > 0);

    let aiSelections = null;
    const geminiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const togetherKey = process.env.SERVERLESS_LLM_API_KEY;

    if (activeCandidates.length > 0) {
      if (geminiKey && geminiKey !== 'MISSING' && geminiKey !== '') {
        try {
          console.log("Generating monthly honors nominations using Gemini...");
          const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
          const promptContent = `SYSTEM INSTRUCTION:\n${SYSTEM_PROMPT}\n\nCANDIDATES DATA:\n${JSON.stringify(activeCandidates, null, 2)}`;

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: promptContent }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2
              }
            })
          });

          if (response.ok) {
            const apiJson = await response.json();
            const responseText = apiJson.candidates?.[0]?.content?.parts?.[0]?.text;
            aiSelections = JSON.parse(responseText.trim());
          } else {
            throw new Error(`Gemini status ${response.status}`);
          }
        } catch (err) {
          console.error("Gemini honors generation failed, falling back:", err);
        }
      }

      if (!aiSelections && togetherKey && togetherKey !== 'MISSING' && togetherKey !== '') {
        try {
          console.log("Generating monthly honors nominations using Together AI...");
          const response = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${togetherKey}`,
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

          if (response.ok) {
            const result = await response.json();
            aiSelections = JSON.parse(result.choices[0].message.content);
          }
        } catch (err) {
          console.error("Together AI honors generation failed, falling back:", err);
        }
      }
    }

    // Statistical Fallback if LLM fails or is unavailable
    if (!aiSelections) {
      console.log("Using statistical fallback for monthly honors...");
      aiSelections = generateStatisticalFallback(activeCandidates);
    }

    // ─── 3. Save and Publish Leaderboard ───
    const genBookieName = result.genBookieUserId ? (activeUsers.find(u => u.id === result.genBookieUserId)?.name || '') : '';
    const abjBookieName = result.abjBookieUserId ? (activeUsers.find(u => u.id === result.abjBookieUserId)?.name || '') : '';

    await Database.query(`
      INSERT INTO monthly_leaderboard (
        month_year,
        general_bookie_user_id, general_bookie_text,
        abuja_bookie_user_id, abuja_bookie_text,
        review_of_the_month_user_id, review_of_the_month_text,
        author_of_the_month_user_id, author_of_the_month_text,
        most_improved_author_user_id, most_improved_author_text,
        poet_of_the_month_user_id, poet_of_the_month_text,
        most_improved_poet_user_id, most_improved_poet_text,
        published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TRUE)
      ON CONFLICT (month_year) DO UPDATE SET
        general_bookie_user_id = EXCLUDED.general_bookie_user_id,
        general_bookie_text = EXCLUDED.general_bookie_text,
        abuja_bookie_user_id = EXCLUDED.abuja_bookie_user_id,
        abuja_bookie_text = EXCLUDED.abuja_bookie_text,
        review_of_the_month_user_id = EXCLUDED.review_of_the_month_user_id,
        review_of_the_month_text = EXCLUDED.review_of_the_month_text,
        author_of_the_month_user_id = EXCLUDED.author_of_the_month_user_id,
        author_of_the_month_text = EXCLUDED.author_of_the_month_text,
        most_improved_author_user_id = EXCLUDED.most_improved_author_user_id,
        most_improved_author_text = EXCLUDED.most_improved_author_text,
        poet_of_the_month_user_id = EXCLUDED.poet_of_the_month_user_id,
        poet_of_the_month_text = EXCLUDED.poet_of_the_month_text,
        most_improved_poet_user_id = EXCLUDED.most_improved_poet_user_id,
        most_improved_poet_text = EXCLUDED.most_improved_poet_text,
        published = TRUE,
        created_at = NOW()
    `, [
      currentMonthYear,
      result.genBookieUserId,
      result.genWinnerRow ? `Crowned General stream book reviewer for outstanding feedback on "${result.genWinnerRow.title}".` : 'No reviews active.',
      result.abjBookieUserId,
      result.abjWinnerRow ? `Crowned Abuja stream book reviewer for outstanding feedback on "${result.abjWinnerRow.title}".` : 'No reviews active.',
      aiSelections.review_of_the_month_user_id,
      aiSelections.review_of_the_month_text,
      aiSelections.author_of_the_month_user_id,
      aiSelections.author_of_the_month_text,
      aiSelections.most_improved_author_user_id,
      aiSelections.most_improved_author_text,
      aiSelections.poet_of_the_month_user_id,
      aiSelections.poet_of_the_month_text,
      aiSelections.most_improved_poet_user_id,
      aiSelections.most_improved_poet_text
    ]);

    // ─── 4. Dispatch transactional email notifications ───
    const winningUserIds = [
      aiSelections.review_of_the_month_user_id,
      aiSelections.author_of_the_month_user_id,
      aiSelections.most_improved_author_user_id,
      aiSelections.poet_of_the_month_user_id,
      aiSelections.most_improved_poet_user_id,
      result.genBookieUserId,
      result.abjBookieUserId
    ].filter(Boolean);

    const distinctWinningUserIds = [...new Set(winningUserIds)];
    for (const userId of distinctWinningUserIds) {
      const uDetails = activeUsers.find(u => u.id === userId);
      if (uDetails && uDetails.email) {
        try {
          await sendEmail({
            to: uDetails.email,
            subject: `Congratulations, ${uDetails.name}! You won a Monthly Honor!`,
            html: `
              <div style="font-family: sans-serif; color: #2C1A0E; background-color: #FAF7F2; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(44,26,14,0.12); border-radius: 16px;">
                <h2 style="color: #5C1A2E; font-family: serif; margin-bottom: 16px;">Greetings, ${uDetails.name}!</h2>
                <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                  We are thrilled to notify you that the Monthly Honors list has been compiled, and you have been crowned as one of the featured community members for the **${currentMonthYear}** cycle!
                </p>
                <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                  Your contribution has been recognized in our leaderboard archive for outstanding work, narrative support, or review depth. Check out your achievements directly in the Clubhouse dashboard!
                </p>
                <div style="margin: 32px 0; text-align: center;">
                  <a href="https://paperthoughts.org/dashboard" style="background-color: #5C1A2E; color: #FAF7F2; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(92,26,46,0.25);">
                    View Clubhouse Dashboard
                  </a>
                </div>
                <hr style="border: 0; border-top: 1px solid rgba(44,26,14,0.08); margin: 28px 0;" />
                <p style="font-size: 10px; color: rgba(44,26,14,0.5); font-style: italic; line-height: 1.4; text-align: center;">
                  This notification was dispatched automatically by the Paper Thoughts Archive.
                </p>
              </div>
            `
          });
        } catch (mailErr) {
          console.error(`Failed to send honors email to User ID ${userId}:`, mailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly honors and voting transitions complete.',
      data: {
        winners: aiSelections,
        crowns: result
      }
    });

  } catch (error) {
    console.error('Monthly Honors cron failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Honors generation failed' }, { status: 500 });
  }
}

// Statistical fallback selection when LLM is unavailable
function generateStatisticalFallback(candidates) {
  if (candidates.length === 0) {
    return {
      review_of_the_month_user_id: null,
      review_of_the_month_text: "No active critiques were found in this cycle to evaluate.",
      author_of_the_month_user_id: null,
      author_of_the_month_text: "No writing submissions were submitted in this cycle to evaluate.",
      most_improved_author_user_id: null,
      most_improved_author_text: "Not enough comparative data was found in this cycle.",
      poet_of_the_month_user_id: null,
      poet_of_the_month_text: "No poetry submissions were submitted in this cycle to evaluate.",
      most_improved_poet_user_id: null,
      most_improved_poet_text: "Not enough comparative poetry data was found in this cycle."
    };
  }

  const sortedByReviews = [...candidates].sort((a, b) => (b.peerReviews + b.bookReviews) - (a.peerReviews + a.bookReviews));
  const sortedByStories = [...candidates].sort((a, b) => b.storiesSubmitted - a.storiesSubmitted);
  const sortedByPoems = [...candidates].sort((a, b) => b.poemsSubmitted - a.poemsSubmitted);

  const topReviewer = sortedByReviews[0] || null;
  const topAuthor = sortedByStories[0] || null;
  const runnerUpAuthor = sortedByStories[1] || topAuthor;
  const topPoet = sortedByPoems[0] || null;
  const runnerUpPoet = sortedByPoems[1] || topPoet;

  return {
    review_of_the_month_user_id: topReviewer?.id || null,
    review_of_the_month_text: topReviewer 
      ? `${topReviewer.name} demonstrated outstanding dedication to peer review, completing ${topReviewer.peerReviews} thorough critiques and ${topReviewer.bookReviews} book reviews this cycle.`
      : "No reviews were available.",
    author_of_the_month_user_id: topAuthor?.id || null,
    author_of_the_month_text: topAuthor
      ? `${topAuthor.name} enriched the Clubhouse this month by submitting ${topAuthor.storiesSubmitted} original prose drafts to the Writers' Village.`
      : "No authors were available.",
    most_improved_author_user_id: runnerUpAuthor?.id || null,
    most_improved_author_text: runnerUpAuthor
      ? `${runnerUpAuthor.name} showed stellar growth and support this month, consistently engaging with and refining community drafts.`
      : "No improved authors were available.",
    poet_of_the_month_user_id: topPoet?.id || null,
    poet_of_the_month_text: topPoet
      ? `${topPoet.name} captured outstanding poetic focus this month, submitting ${topPoet.poemsSubmitted} poetic works.`
      : "No poets were available.",
    most_improved_poet_user_id: runnerUpPoet?.id || null,
    most_improved_poet_text: runnerUpPoet
      ? `${runnerUpPoet.name} showed outstanding growth in their poetic metrics and stanza structures.`
      : "No improved poets were available."
  };
}

// Support GET requests in development for manual testing
export async function GET(request) {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    return NextResponse.json({ success: false, error: 'Method Not Allowed' }, { status: 405 });
  }
  return POST(request);
}
