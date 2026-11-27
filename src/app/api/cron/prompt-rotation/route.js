import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { isCronAuthorized } from '@/lib/cronAuth';
import { callGeminiProse, getPromptDrop } from '@/lib/heraldLore';
import { sendHeraldGroupBroadcast } from '@/lib/herald';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return POST(request);
}

async function generatePromptsViaGemini(recentPrompts = []) {
  const avoidList = recentPrompts.map(p => `- ${p.prompt_text}`).join('\n');
  const systemPrompt = `You are the Creative Director of Paper Thoughts, a vibrant literary book club.
Generate 4 original, evocative writing prompts (2 fiction/prose stories, 2 poetry sparks) for upcoming weekly drops.
Avoid anything similar to these recent prompts:
${avoidList || 'None'}

Respond ONLY with a valid raw JSON array (no markdown fences) of 4 objects:
[
  { "promptText": "...", "promptType": "story" },
  { "promptText": "...", "promptType": "poem" },
  { "promptText": "...", "promptType": "story" },
  { "promptText": "...", "promptType": "poem" }
]`;

  const raw = await callGeminiProse(systemPrompt, 'Generate 4 vivid prompts for this literary season.', {
    temperature: 0.85,
    maxOutputTokens: 900,
    timeoutMs: 8000
  });

  if (raw) {
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].promptText) {
        return parsed.slice(0, 4).map(p => ({
          promptText: String(p.promptText).trim(),
          promptType: /poem/i.test(p.promptType || '') ? 'poem' : 'story'
        }));
      }
    } catch (e) {
      console.warn('[Prompt Rotation] Gemini JSON parse fallback triggered:', e.message);
    }
  }

  return [
    { promptText: 'Write about two strangers who keep finding notes meant for each other tucked inside borrowed library books.', promptType: 'story' },
    { promptText: 'Compose a poem built around the sounds of a neighborhood waking up before the first morning rain.', promptType: 'poem' },
    { promptText: 'Tell the story of an heirloom object that arrives in the mail twenty years too late.', promptType: 'story' },
    { promptText: 'Write a poem in praise of small rooms that hold enormous secrets.', promptType: 'poem' }
  ];
}

export async function POST(request) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Weekly Prompt Rotation from bank...');

    let rotatedPrompt = await Database.transaction(async (client) => {
      const promptRes = await client.query(`
        UPDATE prompts
        SET active_date = CURRENT_DATE
        WHERE id = (
          SELECT id FROM prompts 
          WHERE active_date IS NULL
          ORDER BY id ASC
          LIMIT 1
        )
        RETURNING id, prompt_text as "promptText", prompt_type as "promptType"
      `);
      return promptRes.rows[0] || null;
    });

    let aiRefilledCount = 0;

    // Auto-refill prompt bank via Gemini if exhausted!
    if (!rotatedPrompt) {
      console.log('[Prompt Rotation] Bank exhausted — generating fresh prompts via Gemini...');
      const recentPrompts = await Database.query(`
        SELECT prompt_text FROM prompts ORDER BY id DESC LIMIT 12
      `).catch(() => []);

      const generated = await generatePromptsViaGemini(recentPrompts);

      await Database.transaction(async (client) => {
        for (let i = 0; i < generated.length; i++) {
          const item = generated[i];
          const isFirst = i === 0;
          const ins = await client.query(`
            INSERT INTO prompts (prompt_text, prompt_type, active_date)
            VALUES ($1, $2, $3)
            RETURNING id, prompt_text as "promptText", prompt_type as "promptType"
          `, [item.promptText, item.promptType, isFirst ? new Date() : null]);

          if (isFirst) rotatedPrompt = ins.rows[0];
          aiRefilledCount++;
        }
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (rotatedPrompt) {
      await sendHeraldGroupBroadcast({
        text: getPromptDrop({
          promptText: rotatedPrompt.promptText,
          promptType: rotatedPrompt.promptType
        }),
        idempotencyKey: `prompt_drop_${rotatedPrompt.id}_${todayStr}`,
        ritualType: 'prompt_drop'
      }).catch(err => console.error('[Prompt Rotation] Herald broadcast skipped/failed:', err.message));
    }

    return NextResponse.json({
      success: true,
      message: aiRefilledCount > 0
        ? `Bank was empty; auto-generated ${aiRefilledCount} prompts via AI and activated #${rotatedPrompt?.id}.`
        : 'Weekly prompt successfully rotated from bank.',
      aiRefilledCount,
      data: { prompt: rotatedPrompt }
    });
  } catch (error) {
    console.error('Weekly prompt rotation failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Prompt rotation failed' }, { status: 500 });
  }
}
