import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Database } from '@/lib/db';
import { syncOrCreateUser } from '@/lib/permissions';

export async function GET(request) {
  try {
    const clerkUser = await currentUser();
    let dbUser = null;
    if (clerkUser) {
      dbUser = await syncOrCreateUser(clerkUser);
    }

    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '40', 10), 100);

    const currentUserId = dbUser ? dbUser.id : -1;

    let queryText = `
      SELECT 
        s.id,
        s.title,
        s.genre,
        s.logline,
        s.body_text as "bodyText",
        s.pen_name as "penName",
        s.batch_status as "batchStatus",
        s.has_laurel as "hasLaurel",
        s.created_at as "createdAt",
        u.full_name as "authorFullName",
        u.avatar_url as "authorAvatarUrl",
        u.reader_archetype as "authorArchetype",
        COALESCE(s.pen_name, u.full_name, 'Anonymous Writer') as "displayName",
        (SELECT COUNT(*) FROM submission_likes l WHERE l.submission_id = s.id)::int as "likeCount",
        (SELECT COUNT(*) FROM submission_comments c WHERE c.submission_id = s.id)::int as "commentCount",
        EXISTS(SELECT 1 FROM submission_likes l WHERE l.submission_id = s.id AND l.user_id = $1) as "userLiked"
      FROM submissions s
      JOIN users u ON u.id = s.author_id
      WHERE (
        s.batch_status = 'archived'
        OR (s.batch_status = 'active_batch' AND s.created_at <= NOW() - INTERVAL '48 hours')
        OR s.author_id = $1
      )
    `;

    const queryParams = [currentUserId];

    if (genre && genre !== 'All') {
      queryParams.push(genre);
      queryText += ` AND s.genre = $${queryParams.length}`;
    }

    if (search && search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      queryText += ` AND (s.title ILIKE $${queryParams.length} OR s.logline ILIKE $${queryParams.length} OR s.pen_name ILIKE $${queryParams.length})`;
    }

    queryText += ` ORDER BY s.created_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    const submissions = await Database.query(queryText, queryParams);

    return NextResponse.json({
      success: true,
      submissions: submissions.map(s => ({
        id: s.id,
        title: s.title,
        genre: s.genre,
        logline: s.logline,
        bodyText: s.bodyText,
        penName: s.penName,
        displayName: s.displayName,
        authorAvatarUrl: s.authorAvatarUrl,
        authorArchetype: s.authorArchetype,
        hasLaurel: s.hasLaurel,
        createdAt: s.createdAt,
        likeCount: parseInt(s.likeCount || 0, 10),
        commentCount: parseInt(s.commentCount || 0, 10),
        userLiked: !!s.userLiked
      }))
    });
  } catch (error) {
    console.error('Failed to fetch gallery submissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to load gallery works.' }, { status: 500 });
  }
}
