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
      // Get the most recent prompt (within 7 days)
      const prompt = await Database.queryOne(`
        SELECT id, prompt_text as "promptText", active_date as "activeDate", prompt_type as "promptType", created_at as "createdAt"
        FROM prompts
        WHERE active_date <= CURRENT_DATE
          AND active_date >= CURRENT_DATE - INTERVAL '7 days'
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

    const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
    const isSuperadmin = email === SUPERADMIN_EMAIL.toLowerCase();
    const isModerator = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !isModerator) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const prompts = await Database.query(`
      SELECT id, prompt_text as "promptText", active_date as "activeDate", prompt_type as "promptType", created_at as "createdAt"
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

    const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
    const isSuperadmin = email === SUPERADMIN_EMAIL.toLowerCase();
    const isModerator = await hasPermission(clerkUser.id, 'moderate_submissions');

    if (!isSuperadmin && !isModerator) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { promptText, activeDate, promptType, isBank } = body;

    if (!promptText) {
      return NextResponse.json({ success: false, error: 'Prompt text is required' }, { status: 400 });
    }

    const dateVal = isBank ? null : (activeDate ? new Date(activeDate) : new Date());

    const newPrompt = await Database.queryOne(`
      INSERT INTO prompts (prompt_text, active_date, prompt_type)
      VALUES ($1, $2, $3)
      RETURNING id, prompt_text as "promptText", active_date as "activeDate", prompt_type as "promptType"
    `, [promptText, dateVal, promptType || 'story']);

    return NextResponse.json({
      success: true,
      message: 'New Weekly Prompt successfully added.',
      prompt: {
        ...newPrompt,
        activeDate: newPrompt.activeDate ? (newPrompt.activeDate instanceof Date ? newPrompt.activeDate.toISOString().split('T')[0] : String(newPrompt.activeDate)) : null
      }
    });
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
