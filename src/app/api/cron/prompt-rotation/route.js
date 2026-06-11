import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // Authorization check
    if (!isDev && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running Weekly Prompt Rotation from bank...');

    const result = await Database.transaction(async (client) => {
      // 1. Promote next story prompt
      const storyRes = await client.query(`
        UPDATE prompts
        SET active_date = CURRENT_DATE
        WHERE id = (
          SELECT id FROM prompts 
          WHERE active_date IS NULL AND prompt_type = 'story'
          ORDER BY id ASC
          LIMIT 1
        )
        RETURNING id, prompt_text as "promptText"
      `);

      // 2. Promote next poetry prompt
      const poemRes = await client.query(`
        UPDATE prompts
        SET active_date = CURRENT_DATE
        WHERE id = (
          SELECT id FROM prompts 
          WHERE active_date IS NULL AND prompt_type = 'poem'
          ORDER BY id ASC
          LIMIT 1
        )
        RETURNING id, prompt_text as "promptText"
      `);

      return {
        story: storyRes.rows[0] || null,
        poem: poemRes.rows[0] || null
      };
    });

    console.log('Prompt rotation complete:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Weekly prompts successfully rotated from bank.',
      data: result
    });
  } catch (error) {
    console.error('Weekly prompt rotation failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Prompt rotation failed' }, { status: 500 });
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
