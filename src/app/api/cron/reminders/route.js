import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendEmail } from '@/lib/email';
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
    
    // Authorization check (Vercel cron uses Bearer token or secret parameter)
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

    console.log(`Executing Automated Reminder Sequence for type: [${type}]`);

    // 1. Fetch all distinct member emails from users table and newsletter_subscribers table
    const userRows = await Database.query(`
      SELECT DISTINCT email, name 
      FROM users 
      WHERE email IS NOT NULL AND email != ''
    `);

    const subscriberRows = await Database.query(`
      SELECT DISTINCT email 
      FROM newsletter_subscribers 
      WHERE email IS NOT NULL AND email != ''
    `);

    // Deduplicate emails map
    const recipientsMap = new Map();
    userRows.forEach(u => {
      if (u.email) recipientsMap.set(u.email.toLowerCase().trim(), u.name || '');
    });
    subscriberRows.forEach(s => {
      if (s.email && !recipientsMap.has(s.email.toLowerCase().trim())) {
        recipientsMap.set(s.email.toLowerCase().trim(), '');
      }
    });

    const recipientsList = Array.from(recipientsMap.entries()).map(([email, name]) => ({ email, name }));

    if (recipientsList.length === 0) {
      console.log('No recipients found for email reminders.');
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

    // 3. Batch dispatch emails to recipients
    let sentCount = 0;
    const errors = [];

    for (const recipient of recipientsList) {
      let emailPayload = null;

      switch (type.toLowerCase()) {
        case 'monday':
          emailPayload = getMondayPromptReleaseEmail({ userName: recipient.name, storyPrompt, poemPrompt });
          break;
        case 'wednesday':
          emailPayload = getWednesdayDraftNudgeEmail({ userName: recipient.name, storyPrompt });
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
      }
    }

    console.log(`Automated Reminder Sequence [${type}] finished. Sent ${sentCount}/${recipientsList.length} emails.`);

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
