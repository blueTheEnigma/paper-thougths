import { Database } from '../lib/db';

/**
 * Synthesizes raw human reviews for a specific submission on Friday afternoon.
 * Combines Together AI serverless API calls with a local, rule-based mock fallback
 * in case the API key is missing or the request fails.
 */
export async function synthesizeWeeklyReviews(submissionId) {
  try {
    // 1. Fetch submission details and associated reviews
    const submission = await Database.queryOne(
      `SELECT id, title, genre, logline, body_text FROM submissions WHERE id = $1`, 
      [submissionId]
    );

    if (!submission) {
      console.error(`Submission ${submissionId} not found for synthesis.`);
      return null;
    }
    
    const reviews = await Database.query(
      `SELECT pacing_rating, strengths_array, mirror_response, highwater_response, pivot_response 
       FROM peer_reviews WHERE submission_id = $1`,
      [submissionId]
    );

    if (reviews.length === 0) {
      console.log(`No reviews found for submission ${submissionId}. Skipping synthesis.`);
      return null;
    }

    // 2. Format human responses into a clean text prompt context
    const formattedReviews = reviews.map((r, index) => `
      ### REVIEWER #${index + 1}
      - Pacing Assessment: ${r.pacing_rating}
      - Strong Elements Identified: ${(r.strengths_array || []).join(', ')}
      - Theme Comprehension (The Mirror): "${r.mirror_response}"
      - Standout Moment (The High-Water Mark): "${r.highwater_response}"
      - Revision Target (The Constructive Pivot): "${r.pivot_response}"
    `).join('\n');

    const targetWorkContext = `
      WORK TITLE: "${submission.title}"
      GENRE: ${submission.genre}
      ORIGINAL LOGLINE: "${submission.logline}"
    `;

    // 3. Trigger Synthesis (LLM vs Local Fallback)
    const apiKey = process.env.SERVERLESS_LLM_API_KEY;
    let cleanJsonSummary = null;

    if (apiKey && apiKey !== 'MISSING' && apiKey !== '') {
      console.log(`Sending reviews for submission ${submissionId} to Together AI LLM...`);
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
              { role: "user", content: `CONTEXT:\n${targetWorkContext}\n\nRAW HUMAN REVIEWS:\n${formattedReviews}` }
            ],
            response_format: { type: "json_object" }, 
            temperature: 0.3
          })
        });

        if (!response.ok) {
          throw new Error(`LLM API returned status ${response.status}`);
        }

        const result = await response.json();
        const responseContent = result.choices[0].message.content;
        cleanJsonSummary = JSON.parse(responseContent);
      } catch (llmError) {
        console.error("Together AI LLM request failed. Falling back to local rules synthesis:", llmError);
        cleanJsonSummary = generateLocalMockSynthesis(submission, reviews);
      }
    } else {
      console.log(`SERVERLESS_LLM_API_KEY is not defined. Using local rules synthesis for submission ${submissionId}...`);
      cleanJsonSummary = generateLocalMockSynthesis(submission, reviews);
    }

    // 4. Save summary output to db and archive the row
    await Database.query(
      `UPDATE submissions 
       SET llm_editorial_summary = $1, batch_status = 'archived' 
       WHERE id = $2`,
      [JSON.stringify(cleanJsonSummary), submissionId]
    );

    return cleanJsonSummary;
  } catch (error) {
    console.error(`Failed synthesis for submission ${submissionId}:`, error);
    throw error;
  }
}

/**
 * Local rules-based engine to generate structured summaries when Together AI is unavailable.
 * Analyzes quantitative ratings and combines text fields into a cohesive review schema.
 */
function generateLocalMockSynthesis(submission, reviews) {
  // Aggregate pacing
  const pacingCounts = {};
  reviews.forEach(r => {
    pacingCounts[r.pacing_rating] = (pacingCounts[r.pacing_rating] || 0) + 1;
  });
  const topPacing = Object.keys(pacingCounts).reduce((a, b) => pacingCounts[a] > pacingCounts[b] ? a : b, 'balanced');
  
  // Aggregate strengths
  const strengthsCounts = {};
  reviews.forEach(r => {
    (r.strengths_array || []).forEach(s => {
      strengthsCounts[s] = (strengthsCounts[s] || 0) + 1;
    });
  });
  const topStrengths = Object.keys(strengthsCounts)
    .sort((a, b) => strengthsCounts[b] - strengthsCounts[a])
    .slice(0, 2);

  // Collate comments
  const mirrorComments = reviews.map((r, i) => `#${i+1}: ${r.mirror_response.trim()}`).join('; ');
  const highwaters = reviews.map(r => r.highwater_response.trim()).filter(Boolean);
  const pivots = reviews.map(r => r.pivot_response.trim()).filter(Boolean);

  // Format quotes (shortest/cleanest valid quote)
  const lineOfTheWeek = highwaters.length > 0 
    ? highwaters.reduce((a, b) => a.length < b.length && a.length > 10 ? a : b) 
    : "No standout lines quoted.";

  // Action step template
  const actionStep = pivots.length > 0 
    ? `Address ${pivots[0].toLowerCase().replace(/^\w/, c => c.toLowerCase())}` 
    : "Refine pacing and strengthen narrative tension across the introduction.";

  return {
    core_resonance: `The community interpreted the themes of "${submission.title}" as: ${reviews[0]?.mirror_response.substring(0, 150)}... The consensus pacing was assessed as largely "${topPacing}".`,
    line_of_the_week: lineOfTheWeek.substring(0, 200),
    common_critiques: `Readers flagged weaknesses in pacing/tension. The strongest elements identified were: ${topStrengths.join(' and ')}.`,
    action_step: actionStep.substring(0, 250)
  };
}

const SYSTEM_PROMPT = `
You are the Chief AI Editorial Assistant for "Paper Thoughts". 
Your objective is to ingest raw, anonymized human reviews for a specific piece of creative writing, and synthesize them into a concise, encouraging, yet highly professional dashboard summary for the author.

CRITICAL RULES:
1. Do not evaluate, judge, or add your own critique. Your job is strictly to compile, group, and summarize the existing human consensus.
2. Maintain an encouraging, objective, and literary-focused tone. 
3. Never reveal reviewer names. Speak of the community collectively (e.g., "Several readers noted...", "The consensus shows...").
4. If opinions diverge, clearly highlight the split perspectives.
5. Respond ONLY with a raw, valid JSON object fitting the exact schema requested below. Do not include markdown backticks.

OUTPUT JSON SCHEMA:
{
  "core_resonance": "A 2-3 sentence summary of how the community collectively interpreted the piece's themes.",
  "line_of_the_week": "Extract the specific line, phrase, or stanza that was quoted or praised most consistently across 'The High-Water Mark' inputs. Do not alter the author's words.",
  "common_critiques": "A concise structural breakdown highlighting recurring weaknesses flagged by readers.",
  "action_step": "One direct, tactical revision assignment based on the most unified piece of feedback provided by the group. Start this sentence with an imperative action verb."
}
`;
