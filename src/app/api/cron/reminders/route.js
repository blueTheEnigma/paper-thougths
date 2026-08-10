import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
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

async function handleReminderCron(request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    const secretQuery = searchParams.get('secret');
    
    // Authorization check
    if (!isDev && authHeader !== `Bearer ${cronSecret}` && secretQuery !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Determine type: from query param or auto-deduce from current day of week
    let type = searchParams.get('type');
    if (!type) {
      const currentDay = new Date().getUTCDay(); // 0 = Sun, 1 = Mon, 3 = Wed, 5 = Fri, 6 = Sat
      if (currentDay === 1) type = 'monday';
      else if (currentDay === 3) type = 'wednesday';
      else if (currentDay === 5) type = 'friday';
      else if (currentDay === 6) type = 'saturday';
      else type = 'monday'; // fallback default
    }

    console.log(`Executing Multi-Channel Automated Reminder Sequence for type: [${type}]`);

    // 1. Fetch all distinct member accounts with id, email, name, and whatsapp
    const userRows = await Database.query(`
      SELECT DISTINCT id, email, full_name as name, whatsapp 
      FROM users 
      WHERE email IS NOT NULL AND email != ''
    `);

    let subscriberRows = [];
    try {
      subscriberRows = await Database.query(`
        SELECT DISTINCT email 
        FROM newsletter_subscribers 
        WHERE email IS NOT NULL AND email != ''
      `);
    } catch (e) {
      // ignore if table doesn't exist
    }

    // Deduplicate emails map
    const recipientsMap = new Map();
    userRows.forEach(u => {
      if (u.email) {
        recipientsMap.set(u.email.toLowerCase().trim(), {
          id: u.id,
          name: u.name || '',
          email: u.email.toLowerCase().trim(),
          whatsapp: u.whatsapp
        });
      }
    });

    subscriberRows.forEach(s => {
      if (s.email && !recipientsMap.has(s.email.toLowerCase().trim())) {
        recipientsMap.set(s.email.toLowerCase().trim(), {
          id: null,
          name: '',
          email: s.email.toLowerCase().trim(),
          whatsapp: null
        });
      }
    });

    const recipientsList = Array.from(recipientsMap.values());

    if (recipientsList.length === 0) {
      console.log('No recipients found for email/notification reminders.');
      return NextResponse.json({ success: true, message: 'No recipients found', sentCount: 0 });
    }

    // 2. Fetch dynamic context (active prompts & BOTM)
    const storyPromptObj = await Database.queryOne(`
      SELECT prompt_text as "promptText" FROM prompts WHERE prompt_type = 'story' ORDER BY created_at DESC LIMIT 1
    `);
    const poemPromptObj = await Database.queryOne(`
      SELECT prompt_text as "promptText" FROM prompts WHERE prompt_type = 'poem' ORDER BY created_at DESC LIMIT 1
    `);
    const botmObj = await Database.queryOne(`
      SELECT title, author, teaser FROM book_of_the_month WHERE active = TRUE ORDER BY created_at DESC LIMIT 1
    `);

    const storyPrompt = storyPromptObj ? storyPromptObj.promptText : '';
    const poemPrompt = poemPromptObj ? poemPromptObj.promptText : '';
    const botmTitle = botmObj ? botmObj.title : '';
    const botmAuthor = botmObj ? botmObj.author : '';
    const botmTeaser = botmObj ? botmObj.teaser : '';

    // 3. Batch dispatch Email, In-App Notifications, and WhatsApp DMs
    let sentCount = 0;
    const errors = [];

    for (const recipient of recipientsList) {
      let emailPayload = null;

      switch (type.toLowerCase()) {
        case 'monday':
          emailPayload = getMondayPromptReleaseEmail({ userName: recipient.name, storyPrompt, poemPrompt });
          break;
        case 'wednesday':
          emailPayload = getWednesdayDraftNudgeEmail({ userName: recipient.name, storyPrompt, poemPrompt });
          break;
        case 'friday':
          emailPayload = getFridayDeadlineReminderEmail({ userName: recipient.name });
          break;
        case 'saturday':
          emailPayload = getSaturdayBotmEmail({ userName: recipient.name, botmTitle, botmAuthor, botmTeaser });
          break;
        default:
          emailPayload = getMondayPromptReleaseEmail({ userName: recipient.name, storyPrompt, poemPrompt });
          break;
      }

      if (emailPayload) {
        // Channel A: Email Dispatch
        const result = await sendEmail({
          to: recipient.email,
          subject: emailPayload.subject,
          html: emailPayload.html,
        });

        if (result) {
          sentCount++;
        } else {
          errors.push(recipient.email);
        }

        // Channel B: In-App Notification insertion
        if (recipient.id) {
          await Database.query(`
            INSERT INTO user_notifications (user_id, type, title, body, link)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            recipient.id,
            'reminder',
            emailPayload.subject,
            `Weekly ${type} drop update in Paper Thoughts.`,
            type === 'saturday' ? '/discussion' : '/village'
          ]).catch(err => console.error('Failed to insert in-app notification:', err));
        }

        // Channel C: WhatsApp Direct DM (if phone number is on record)
        if (recipient.whatsapp) {
          const targetUrl = type === 'saturday' ? 'https://www.paperthoughts.org/discussion' : 'https://www.paperthoughts.org/village';
          const waText = `✨ *Paper Thoughts Update*\n\n${emailPayload.subject}\n\nJoin the discussion & draft here: ${targetUrl}`;
          sendWhatsAppMessage({ to: recipient.whatsapp, text: waText })
            .catch(err => console.error('WhatsApp send error:', err));
        }
      }
    }

    console.log(`Multi-Channel Automated Reminder Sequence [${type}] finished. Sent ${sentCount}/${recipientsList.length} emails.`);

    return NextResponse.json({
      success: true,
      type,
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
