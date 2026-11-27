import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/pushNotifications';
import { isCronAuthorized, getLastSaturdayStart } from '@/lib/cronAuth';
import {
  getMondayPromptReleaseEmail,
  getWednesdayDraftNudgeEmail,
  getFridayDeadlineReminderEmail,
  getSaturdayBotmEmail
} from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleReminderCron(request);
}

export async function POST(request) {
  return handleReminderCron(request);
}

const CHUNK_SIZE = 15;

async function handleReminderCron(request) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let type = searchParams.get('type');
    if (!type) {
      const currentDay = new Date().getUTCDay();
      if (currentDay === 1) type = 'monday';
      else if (currentDay === 3) type = 'wednesday';
      else if (currentDay === 5) type = 'friday';
      else if (currentDay === 6) type = 'saturday';
      else type = 'monday';
    }

    const normalizedType = type.toLowerCase();
    const lastSaturday = getLastSaturdayStart();

    // 1. Fetch eligible recipients
    // On Friday: Smart Pending Filter — skip members who already submitted or reviewed this week!
    const recipientsRows = normalizedType === 'friday'
      ? await Database.query(`
          SELECT DISTINCT u.id, u.email, u.full_name as name
          FROM users u
          WHERE u.email IS NOT NULL AND u.email != ''
            AND COALESCE(u.unsubscribed_from_reminders, false) = false
            AND COALESCE(u.membership_status, 'active') = 'active'
            AND (u.sabbatical_until IS NULL OR u.sabbatical_until < CURRENT_DATE)
            AND NOT EXISTS (
              SELECT 1 FROM submissions s
              WHERE s.author_id = u.id AND s.created_at >= $1
            )
            AND NOT EXISTS (
              SELECT 1 FROM peer_reviews pr
              WHERE pr.reviewer_id = u.id AND pr.created_at >= $1
            )
        `, [lastSaturday])
      : await Database.query(`
          SELECT DISTINCT id, email, full_name as name
          FROM users
          WHERE email IS NOT NULL AND email != ''
            AND COALESCE(unsubscribed_from_reminders, false) = false
            AND COALESCE(membership_status, 'active') != 'evicted'
        `);

    // Deduplicate cleanly by normalized email
    const recipientsMap = new Map();
    for (const u of recipientsRows) {
      const cleanEmail = u.email?.toLowerCase().trim();
      if (cleanEmail && !recipientsMap.has(cleanEmail)) {
        recipientsMap.set(cleanEmail, {
          id: u.id,
          name: u.name || '',
          email: cleanEmail
        });
      }
    }

    const recipientsList = Array.from(recipientsMap.values());
    if (recipientsList.length === 0) {
      return NextResponse.json({ success: true, type: normalizedType, message: 'No eligible recipients', sentCount: 0 });
    }

    // 2. Fetch dynamic context (active prompt & BOTM)
    const [activePromptObj, botmObj] = await Promise.all([
      Database.queryOne(`
        SELECT prompt_text as "promptText" FROM prompts
        WHERE active_date <= CURRENT_DATE
        ORDER BY active_date DESC, created_at DESC LIMIT 1
      `).then(r => r || Database.queryOne(`SELECT prompt_text as "promptText" FROM prompts ORDER BY created_at DESC LIMIT 1`)),
      Database.queryOne(`
        SELECT title, author, teaser FROM book_of_the_month WHERE active = TRUE ORDER BY created_at DESC LIMIT 1
      `)
    ]);

    const weeklyPrompt = activePromptObj?.promptText || '';
    const botmTitle = botmObj?.title || '';
    const botmAuthor = botmObj?.author || '';
    const botmTeaser = botmObj?.teaser || '';

    // 3. Batch dispatch Email, In-App Notifications, and Web Push in parallel chunks
    let sentCount = 0;
    const errors = [];

    for (let i = 0; i < recipientsList.length; i += CHUNK_SIZE) {
      const chunk = recipientsList.slice(i, i + CHUNK_SIZE);

      await Promise.allSettled(
        chunk.map(async (recipient) => {
          let emailPayload = null;
          switch (normalizedType) {
            case 'monday':
              emailPayload = getMondayPromptReleaseEmail({ userName: recipient.name, storyPrompt: weeklyPrompt, poemPrompt: weeklyPrompt });
              break;
            case 'wednesday':
              emailPayload = getWednesdayDraftNudgeEmail({ userName: recipient.name, storyPrompt: weeklyPrompt, poemPrompt: weeklyPrompt });
              break;
            case 'friday':
              emailPayload = getFridayDeadlineReminderEmail({ userName: recipient.name });
              break;
            case 'saturday':
              emailPayload = getSaturdayBotmEmail({ userName: recipient.name, botmTitle, botmAuthor, botmTeaser });
              break;
            default:
              emailPayload = getMondayPromptReleaseEmail({ userName: recipient.name, storyPrompt: weeklyPrompt, poemPrompt: weeklyPrompt });
              break;
          }

          if (!emailPayload) return;

          const [emailRes] = await Promise.allSettled([
            sendEmail({ to: recipient.email, subject: emailPayload.subject, html: emailPayload.html }),
            recipient.id
              ? Database.query(`
                  INSERT INTO user_notifications (user_id, type, title, body, link)
                  VALUES ($1, $2, $3, $4, $5)
                `, [
                  recipient.id,
                  'reminder',
                  emailPayload.subject,
                  `Weekly ${normalizedType} drop update in Paper Thoughts.`,
                  normalizedType === 'saturday' ? '/discussion' : '/village'
                ])
              : Promise.resolve(),
            recipient.id
              ? sendPushNotification(recipient.id, {
                  title: emailPayload.subject.replace(/^[^\w\s]+\s*/, ''),
                  body: `Weekly ${normalizedType} sanctuary drop. Tap to open.`,
                  link: normalizedType === 'saturday' ? '/discussion' : '/village'
                })
              : Promise.resolve()
          ]);

          if (emailRes.status === 'fulfilled' && emailRes.value) {
            sentCount++;
          } else {
            errors.push(recipient.email);
          }
        })
      );
    }

    console.log(`Reminder sequence [${normalizedType}] finished: ${sentCount}/${recipientsList.length} sent.`);

    return NextResponse.json({
      success: true,
      type: normalizedType,
      totalRecipients: recipientsList.length,
      sentCount,
      errorsCount: errors.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Automated Reminder Sequence failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
