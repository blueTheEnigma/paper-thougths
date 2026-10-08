import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';
import { RETURNER_GATES } from '@/lib/governance';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await syncOrCreateUser(clerkUser);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User sync failed' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const petitionText = body.petitionText && typeof body.petitionText === 'string' ? body.petitionText.trim() : '';

    const wordCount = petitionText.split(/\s+/).filter(Boolean).length;
    if (wordCount < RETURNER_GATES.PETITION_MIN_WORDS) {
      return NextResponse.json({
        success: false,
        error: `Your petition must contain at least ${RETURNER_GATES.PETITION_MIN_WORDS} words reflecting on your literary intent and commitment to the community. (Current: ${wordCount} words)`,
      }, { status: 400 });
    }

    await Database.query(`
      UPDATE users 
      SET returner_petition = $1,
          returner_petition_submitted_at = NOW()
      WHERE id = $2
    `, [petitionText, dbUser.id]);

    return NextResponse.json({
      success: true,
      message: 'Your Returner’s Petition has been inscribed upon the sanctuary ledger.',
      petitionWords: wordCount,
    });
  } catch (error) {
    console.error('Failed to submit returner petition:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to submit petition',
    }, { status: 500 });
  }
}
