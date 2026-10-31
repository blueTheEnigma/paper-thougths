import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedMonth = searchParams.get('monthYear');

    // 1. Fetch available issues for archive selector
    const allIssues = await Database.query(`
      SELECT month_year, display_title, published_at
      FROM monthly_anthology_issues
      WHERE published = TRUE
      ORDER BY month_year DESC
    `);

    // 2. Determine target issue
    let targetIssue = null;
    if (requestedMonth) {
      targetIssue = await Database.queryOne(`
        SELECT * FROM monthly_anthology_issues
        WHERE month_year = $1 AND published = TRUE
      `, [requestedMonth]);
    } else {
      // Latest published issue
      targetIssue = await Database.queryOne(`
        SELECT * FROM monthly_anthology_issues
        WHERE published = TRUE
        ORDER BY month_year DESC
        LIMIT 1
      `);
    }

    if (!targetIssue) {
      return NextResponse.json({
        success: true,
        hasIssue: false,
        allIssues: allIssues.map(i => ({
          monthYear: i.month_year,
          title: i.display_title,
          publishedAt: i.published_at
        })),
        message: 'No published anthology issue found.'
      });
    }

    // 3. Fetch inducted entries for this issue
    const entries = await Database.query(`
      SELECT 
        mae.id,
        mae.category,
        mae.placement_rank,
        mae.editor_citation,
        mae.prize_amount,
        s.id as submission_id,
        s.title,
        s.genre,
        s.logline,
        s.body_text,
        s.pen_name,
        s.created_at as submission_date,
        u.id as author_id,
        u.full_name as author_name,
        u.avatar_url as author_avatar,
        u.reader_archetype as author_archetype,
        c.name as chapter_name,
        (SELECT COUNT(*) FROM submission_likes sl WHERE sl.submission_id = s.id)::int as likes_count,
        (SELECT COUNT(*) FROM submission_ratings sr WHERE sr.submission_id = s.id)::int as ratings_count,
        (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) FROM submission_ratings sr WHERE sr.submission_id = s.id)::float as average_rating,
        (SELECT COUNT(*) FROM submission_comments sc WHERE sc.submission_id = s.id)::int as comments_count
      FROM monthly_anthology_entries mae
      JOIN submissions s ON s.id = mae.submission_id
      JOIN users u ON u.id = s.author_id
      LEFT JOIN chapters c ON c.id = u.chapter_id
      WHERE mae.issue_id = $1
      ORDER BY mae.category ASC, mae.placement_rank ASC
    `, [targetIssue.id]);

    const stories = entries.filter(e => e.category === 'story').map(formatEntry);
    const poems = entries.filter(e => e.category === 'poem').map(formatEntry);

    function formatEntry(e) {
      return {
        id: e.id,
        submissionId: e.submission_id,
        category: e.category,
        rank: e.placement_rank,
        editorCitation: e.editor_citation,
        prizeAmount: e.prize_amount,
        title: e.title,
        genre: e.genre,
        logline: e.logline,
        bodyText: e.body_text,
        penName: e.pen_name || e.author_name || 'Anonymous Writer',
        authorName: e.author_name,
        authorAvatar: e.author_avatar,
        authorArchetype: e.author_archetype,
        chapterName: e.chapter_name || 'Paper Thoughts Sanctuary',
        likesCount: e.likes_count || 0,
        ratingsCount: e.ratings_count || 0,
        averageRating: e.average_rating || 0.0,
        commentsCount: e.comments_count || 0,
        submissionDate: e.submission_date
      };
    }

    return NextResponse.json({
      success: true,
      hasIssue: true,
      issue: {
        id: targetIssue.id,
        monthYear: targetIssue.month_year,
        displayTitle: targetIssue.display_title,
        curatorForeword: targetIssue.curator_foreword,
        publishedAt: targetIssue.published_at,
        stories,
        poems
      },
      allIssues: allIssues.map(i => ({
        monthYear: i.month_year,
        title: i.display_title,
        publishedAt: i.published_at
      }))
    });

  } catch (error) {
    console.error('Failed to fetch public anthology:', error);
    return NextResponse.json({ success: false, error: 'Failed to load anthology.' }, { status: 500 });
  }
}

