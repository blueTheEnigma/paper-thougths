import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

function getVotingMonthYear() {
  const now = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function isVotingPeriod() {
  const now = new Date();
  const day = now.getDate();
  return day <= 3; // First 3 days of the month
}

// GET: Fetch voting results / suggestions with vote counts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterIdParam = searchParams.get('chapterId');
    const chapterId = chapterIdParam && chapterIdParam !== 'null' ? parseInt(chapterIdParam, 10) : null;
    
    const targetMonthYear = getVotingMonthYear();

    // Fetch suggestions with their vote counts
    const suggestions = await Database.query(`
      SELECT s.id, s.title, s.author, s.teaser, s.month_year as "monthYear",
             u.full_name as "suggestedBy",
             COALESCE(v.votes_count, 0)::int as "votesCount"
      FROM botm_suggestions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN (
        SELECT suggestion_id, COUNT(*) as votes_count
        FROM botm_votes
        GROUP BY suggestion_id
      ) v ON v.suggestion_id = s.id
      WHERE s.month_year = $1
        AND s.chapter_id IS NOT DISTINCT FROM $2
      ORDER BY "votesCount" DESC, s.created_at ASC
    `, [targetMonthYear, chapterId]);

    // Check if the current user has voted in this stream for this cycle
    let userVotedSuggestionId = null;
    const clerkUser = await currentUser();
    if (clerkUser) {
      const dbUser = await syncOrCreateUser(clerkUser);
      if (dbUser) {
        const userVote = await Database.queryOne(`
          SELECT suggestion_id as "suggestionId"
          FROM botm_votes
          WHERE user_id = $1 AND month_year = $2 AND chapter_id IS NOT DISTINCT FROM $3
          LIMIT 1
        `, [dbUser.id, targetMonthYear, chapterId]);
        if (userVote) {
          userVotedSuggestionId = userVote.suggestionId;
        }
      }
    }
    
    const cycle = await Database.queryOne(`
      SELECT voting_open 
      FROM botm_cycles 
      WHERE month_year = $1
    `, [targetMonthYear]);
    const isVotingOpen = cycle ? cycle.voting_open : false;

    return NextResponse.json({
      success: true,
      suggestions,
      userVotedSuggestionId,
      isVotingOpen,
      targetMonthYear
    });
  } catch (error) {
    console.error('Failed to fetch voting status:', error);
    return NextResponse.json({ success: false, error: 'Failed to load votes.' }, { status: 500 });
  }
}

// POST: Cast a vote
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

    const currentVotingCycle = getVotingMonthYear();

    const cycle = await Database.queryOne(`
      SELECT voting_open 
      FROM botm_cycles 
      WHERE month_year = $1
    `, [currentVotingCycle]);
    const isVotingOpen = cycle ? cycle.voting_open : false;

    if (!isVotingOpen) {
      return NextResponse.json({ success: false, error: 'Voting is not currently open for this cycle.' }, { status: 403 });
    }

    const body = await request.json();
    const { suggestionId } = body;

    const parsedSuggestionId = parseInt(suggestionId, 10);
    if (!parsedSuggestionId) {
      return NextResponse.json({ success: false, error: 'Missing suggestionId.' }, { status: 400 });
    }

    // 1. Fetch the suggestion to check month_year and chapter_id
    const suggestion = await Database.queryOne(`
      SELECT id, month_year as "monthYear", chapter_id as "chapterId", title
      FROM botm_suggestions
      WHERE id = $1
    `, [parsedSuggestionId]);

    if (!suggestion) {
      return NextResponse.json({ success: false, error: 'Book suggestion not found.' }, { status: 404 });
    }

    if (suggestion.monthYear !== currentVotingCycle) {
      return NextResponse.json({ success: false, error: 'This suggestion is not part of the current voting cycle.' }, { status: 400 });
    }

    // 2. Check if user already voted in this stream (chapter_id) for this month_year
    const existingVote = await Database.queryOne(`
      SELECT id FROM botm_votes
      WHERE user_id = $1 AND month_year = $2 AND chapter_id IS NOT DISTINCT FROM $3
    `, [dbUser.id, currentVotingCycle, suggestion.chapterId]);

    if (existingVote) {
      return NextResponse.json({ success: false, error: 'You have already cast your vote in this edition stream for this month.' }, { status: 400 });
    }

    // 3. Insert the vote
    await Database.query(`
      INSERT INTO botm_votes (user_id, suggestion_id, month_year, chapter_id)
      VALUES ($1, $2, $3, $4)
    `, [dbUser.id, parsedSuggestionId, currentVotingCycle, suggestion.chapterId]);

    return NextResponse.json({
      success: true,
      message: `Vote successfully cast for "${suggestion.title}"!`
    });

  } catch (error) {
    console.error('Failed to cast vote:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit vote.' }, { status: 500 });
  }
}
