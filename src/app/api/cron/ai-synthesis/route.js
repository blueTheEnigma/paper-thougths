import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a master literary editor. Combine the attached raw critique nodes into a single, cohesive, highly professional feedback JSON object. You must explicitly respond with a valid JSON document matching this structure:
{
  "intent_metrics": {"title_weight": X, "trope_weight": Y, "logline_weight": Z},
  "structural_metrics": {"pacing": A, "technical": B},
  "synthesized_mirror": "Clear paragraph summarizing audience theme extraction...",
  "synthesized_highwater": "Concise summary of universally praised lines or prose details...",
  "synthesized_pivot": "A strategic, itemized 3-step action plan to guide the author's rewrite..."
}
Do not wrap the JSON output in markdown formatting code blocks (such as \`\`\`json) or include any conversational intro/outro text. Return only the raw stringified JSON.`;

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

// Map-Reduce AI Synthesis Cron
export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // Authorization Check
    if (!isDev && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Friday AI Review Synthesis batch cycle...');

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

    // 1. Fetch archived submissions that have at least one peer review but no AI report yet (joined with user for emails)
    const activeSubmissions = await Database.query(`
      SELECT DISTINCT s.id, s.title, s.genre, s.logline, s.body_text,
             u.email as "authorEmail", u.full_name as "authorName"
      FROM submissions s
      JOIN peer_reviews r ON r.submission_id = s.id
      JOIN users u ON s.author_id = u.id
      WHERE s.batch_status = 'archived'
        AND NOT EXISTS (
          SELECT 1 FROM submission_ai_reports rep 
          WHERE rep.submission_id = s.id
        )
    `);

    if (activeSubmissions.length === 0) {
      console.log('No archived submissions with reviews found for synthesis.');
      return NextResponse.json({ success: true, message: 'No submissions found with reviews to synthesize.' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const results = [];

    for (const submission of activeSubmissions) {
      console.log(`Processing synthesis for submission ID ${submission.id}: "${submission.title}"...`);
      
      // 2. Map Phase: Query all raw reviews for this submission
      const reviews = await Database.query(`
        SELECT intent_source, pacing_score, technical_score, 
               mirror_text, highwater_text, pivot_text,
               pacing_rating, mirror_response, highwater_response, pivot_response
        FROM peer_reviews 
        WHERE submission_id = $1
      `, [submission.id]);

      // Calculate aggregated metrics
      const totalReviews = reviews.length;
      
      // Intent source ratios (weights)
      let titleCount = 0, tropeCount = 0, loglineCount = 0;
      reviews.forEach(r => {
        if (r.intent_source === 'title') titleCount++;
        else if (r.intent_source === 'trope') tropeCount++;
        else if (r.intent_source === 'logline') loglineCount++;
        // Fallback checks from previous structure if fields are empty
        else titleCount++; 
      });

      const title_weight = totalReviews > 0 ? Math.round((titleCount / totalReviews) * 100) : 34;
      const trope_weight = totalReviews > 0 ? Math.round((tropeCount / totalReviews) * 100) : 33;
      const logline_weight = totalReviews > 0 ? Math.round((loglineCount / totalReviews) * 100) : 33;

      // Structural scores averages (1-5 range)
      let totalPacingScore = 0, totalTechnicalScore = 0;
      let validPacingCount = 0, validTechnicalCount = 0;

      reviews.forEach(r => {
        if (r.pacing_score >= 1 && r.pacing_score <= 5) {
          totalPacingScore += r.pacing_score;
          validPacingCount++;
        }
        if (r.technical_score >= 1 && r.technical_score <= 5) {
          totalTechnicalScore += r.technical_score;
          validTechnicalCount++;
        }
      });

      const avgPacing = validPacingCount > 0 ? Math.round(totalPacingScore / validPacingCount) : 3;
      const avgTechnical = validTechnicalCount > 0 ? Math.round(totalTechnicalScore / validTechnicalCount) : 3;

      // Group text fragments for LLM context
      const reviewTextNodes = reviews.map((r, i) => {
        const mirror = r.mirror_text || r.mirror_response || '';
        const highwater = r.highwater_text || r.highwater_response || '';
        const pivot = r.pivot_text || r.pivot_response || '';
        return `Reviewer #${i + 1}:\n- The Mirror: "${mirror.trim()}"\n- High-Water Mark: "${highwater.trim()}"\n- Constructive Pivot: "${pivot.trim()}"`;
      }).join('\n\n');

      let summaryData = null;

      if (geminiKey && geminiKey !== 'MISSING' && geminiKey !== '') {
        try {
          const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
          
          const promptContent = `SYSTEM INSTRUCTION:\n${SYSTEM_PROMPT}\n\nMANUSCRIPT METADATA:\nTitle: "${submission.title}"\nGenre: ${submission.genre}\nLogline: "${submission.logline}"\n\nRAW HUMAN REVIEWS:\n${reviewTextNodes}`;

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

          if (!response.ok) {
            throw new Error(`Gemini API returned status ${response.status}`);
          }

          const apiJson = await response.json();
          const responseText = apiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          
          summaryData = JSON.parse(responseText.trim());
        } catch (err) {
          console.error(`Gemini synthesis failed for submission ${submission.id}. Using local fallback:`, err);
          summaryData = generateLocalSynthesisFallback(submission, reviews, title_weight, trope_weight, logline_weight, avgPacing, avgTechnical);
        }
      } else {
        console.log(`GEMINI_API_KEY is not defined. Using local synthesis for submission ${submission.id}...`);
        summaryData = generateLocalSynthesisFallback(submission, reviews, title_weight, trope_weight, logline_weight, avgPacing, avgTechnical);
      }

      // 3. Reduce Phase: Save summary report and archive the submission
      await Database.transaction(async (client) => {
        // Save to AI reports
        await client.query(`
          INSERT INTO submission_ai_reports (
            submission_id, intent_metrics, structural_metrics, 
            synthesized_mirror, synthesized_highwater, synthesized_pivot
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (submission_id) DO UPDATE SET
            intent_metrics = EXCLUDED.intent_metrics,
            structural_metrics = EXCLUDED.structural_metrics,
            synthesized_mirror = EXCLUDED.synthesized_mirror,
            synthesized_highwater = EXCLUDED.synthesized_highwater,
            synthesized_pivot = EXCLUDED.synthesized_pivot,
            created_at = NOW()
        `, [
          submission.id,
          JSON.stringify(summaryData.intent_metrics || { title_weight, trope_weight, logline_weight }),
          JSON.stringify(summaryData.structural_metrics || { pacing: avgPacing, technical: avgTechnical }),
          summaryData.synthesized_mirror || "Theme comprehension synthesis could not be compiled.",
          summaryData.synthesized_highwater || "Standout line consensus was not established.",
          summaryData.synthesized_pivot || "Constructive critique consensus was not established."
        ]);

        // Archive submission status
        await client.query(`
          UPDATE submissions 
          SET batch_status = 'archived',
              llm_editorial_summary = $1
          WHERE id = $2
        `, [JSON.stringify(summaryData), submission.id]);
      });

      // 4. Dispatch transactional email notification to the author via Resend
      if (submission.authorEmail) {
        await sendEmail({
          to: submission.authorEmail,
          subject: `Your Manuscript Feedback Report for "${submission.title}" is ready!`,
          html: `
            <div style="font-family: sans-serif; color: #2C1A0E; background-color: #FAF7F2; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(44,26,14,0.12); border-radius: 16px;">
              <h2 style="color: #5C1A2E; font-family: serif; margin-bottom: 16px;">Greetings, ${submission.authorName || 'Writer'}</h2>
              <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                The weekly review synthesis cycle has concluded. The collective community reviews for your manuscript, 
                <strong>"${submission.title}"</strong>, have been successfully aggregated.
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                Your customized, three-dimensional feedback report (incorporating click-intent metrics, pacing/technical scores, and your rewrites action plan) is now available on your dashboard.
              </p>
              <div style="margin: 32px 0; text-align: center;">
                <a href="https://paperthoughts.org/dashboard" style="background-color: #5C1A2E; color: #FAF7F2; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(92,26,46,0.25);">
                  View Feedback Report
                </a>
              </div>
              <hr style="border: 0; border-top: 1px solid rgba(44,26,14,0.08); margin: 28px 0;" />
              <p style="font-size: 10px; color: rgba(44,26,14,0.5); font-style: italic; line-height: 1.4; text-align: center;">
                This notification was dispatched automatically by the Paper Thoughts Archive ledger.
              </p>
            </div>
          `
        });
      }

      results.push({ submissionId: submission.id, title: submission.title, status: 'synthesized' });
    }

    console.log('Friday review synthesis completed successfully:', results);
    return NextResponse.json({ success: true, message: 'Friday reviews synthesized successfully.', data: results });

  } catch (error) {
    console.error('Friday AI review synthesis failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Synthesis failed' }, { status: 500 });
  }
}

// Local mock summarization fallback logic
function generateLocalSynthesisFallback(submission, reviews, tw, trw, lw, pacing, technical) {
  const mirrors = reviews.map(r => r.mirror_text || r.mirror_response || '').filter(Boolean);
  const highwaters = reviews.map(r => r.highwater_text || r.highwater_response || '').filter(Boolean);
  const pivots = reviews.map(r => r.pivot_text || r.pivot_response || '').filter(Boolean);

  return {
    intent_metrics: { title_weight: tw, trope_weight: trw, logline_weight: lw },
    structural_metrics: { pacing, technical },
    synthesized_mirror: mirrors.length > 0
      ? `The consensus reading of "${submission.title}" indicates that the audience perceived themes around: ${mirrors[0].substring(0, 150)}.`
      : "The community interpreted the core themes of the piece as a reflection of narrative growth.",
    synthesized_highwater: highwaters.length > 0
      ? `Readers universally praised specific prose details and client elements: "${highwaters[0].substring(0, 120)}".`
      : "Prose details and standout dialogue lines received strong positive feedback.",
    synthesized_pivot: pivots.length > 0
      ? `Revision plan: 1. Address narrative pacing. 2. Tighten character arcs. 3. Adjust the transition timing around the climax: "${pivots[0].substring(0, 100)}".`
      : "Revision plan: 1. Balance the pacing of the introduction. 2. Build stronger tension in scene transitions. 3. Clear up character dialogue beats."
  };
}

// Support GET requests in development for testing
export async function GET(request) {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    return NextResponse.json({ success: false, error: 'Method Not Allowed' }, { status: 405 });
  }
  return POST(request);
}
