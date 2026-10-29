import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getAnthologyLaureateAnnouncementEmail } from '@/lib/emailTemplates';

export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // Authorization check
    if (!isDev && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const issue = await Database.queryOne(`
      SELECT * FROM monthly_anthology_issues 
      WHERE published = TRUE 
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (!issue) {
      return NextResponse.json({ success: false, error: 'No published anthology issue found.' }, { status: 404 });
    }

    const entries = await Database.query(`
      SELECT 
        mae.id,
        mae.category,
        mae.placement_rank,
        mae.editor_citation,
        mae.prize_amount,
        s.title,
        u.id as user_id,
        u.full_name,
        u.email
      FROM monthly_anthology_entries mae
      JOIN submissions s ON s.id = mae.submission_id
      JOIN users u ON u.id = s.author_id
      WHERE mae.issue_id = $1
      ORDER BY u.id, mae.category, mae.placement_rank
    `, [issue.id]);

    if (entries.length === 0) {
      return NextResponse.json({ success: true, message: 'No inducted entries found.' });
    }

    const winnersByUser = {};
    for (const entry of entries) {
      if (!winnersByUser[entry.user_id]) {
        winnersByUser[entry.user_id] = {
          name: entry.full_name || 'Sanctuary Author',
          email: entry.email,
          honors: []
        };
      }
      winnersByUser[entry.user_id].honors.push({
        title: entry.title,
        category: entry.category,
        rank: entry.placement_rank,
        citation: entry.editor_citation,
        prizeAmount: entry.prize_amount
      });
    }

    const dispatchResults = [];

    for (const [userId, winner] of Object.entries(winnersByUser)) {
      if (!winner.email) continue;

      const emailPayload = getAnthologyLaureateAnnouncementEmail({
        recipientName: winner.name,
        honors: winner.honors
      });

      try {
        const res = await sendEmail({
          to: winner.email,
          subject: emailPayload.subject,
          html: emailPayload.html
        });
        dispatchResults.push({ email: winner.email, status: 'sent', res });
      } catch (err) {
        dispatchResults.push({ email: winner.email, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      issueTitle: issue.display_title,
      dispatchedCount: dispatchResults.filter(r => r.status === 'sent').length,
      dispatchResults
    });

  } catch (error) {
    console.error('Failed to dispatch laureate announcement emails:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

