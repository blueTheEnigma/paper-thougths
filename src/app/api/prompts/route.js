import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser, hasPermission } from '@/lib/permissions';

const SUPERADMIN_EMAIL = "umorgan2001@gmail.com";

// GET handler: fetch prompts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const getLatest = searchParams.get('latest') !== 'false'; // default to true

    if (getLatest) {
      // Get the most recent prompt
      const prompt = await Database.queryOne(`
        SELECT id, prompt_text as "promptText", active_date as "activeDate", created_at as "createdAt"
        FROM prompts
        ORDER BY active_date DESC, created_at DESC
        LIMIT 1
      `);
      return NextResponse.json({ success: true, prompt });
    }

    // Otherwise, fetch all prompts (requires authentication)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    const isSuperadmin = email === SUPERADMIN_EMAIL;
    const isModerator = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !isModerator) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const prompts = await Database.query(`
      SELECT id, prompt_text as "promptText", active_date as "activeDate", created_at as "createdAt"
      FROM prompts
      ORDER BY active_date DESC, created_at DESC
    `);

    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST handler: create a new prompt (manually inputted by admin)
export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    const isSuperadmin = email === SUPERADMIN_EMAIL;
    const isModerator = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !isModerator) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { promptText, activeDate } = body;

    if (!promptText) {
      return NextResponse.json({ success: false, error: 'Prompt text is required' }, { status: 400 });
    }

    const dateVal = activeDate ? new Date(activeDate) : new Date();

    const newPrompt = await Database.queryOne(`
      INSERT INTO prompts (prompt_text, active_date)
      VALUES ($1, $2)
      RETURNING id, prompt_text as "promptText", active_date as "activeDate"
    `, [promptText, dateVal]);

    return NextResponse.json({
      success: true,
      message: 'New Weekly Prompt successfully added.',
      prompt: newPrompt
    });
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
