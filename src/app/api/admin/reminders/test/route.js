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

export async function POST(request) {
  try {
    const body = await request.json();
    const { type = 'monday', targetEmail } = body;

    if (!targetEmail) {
      return NextResponse.json({ success: false, error: 'Target email is required' }, { status: 400 });
    }

    // Fetch dynamic context for realistic preview
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

    let emailPayload = null;
    const testName = 'Community Reader';

    switch (type.toLowerCase()) {
      case 'monday':
        emailPayload = getMondayPromptReleaseEmail({ userName: testName, storyPrompt, poemPrompt });
        break;
      case 'wednesday':
        emailPayload = getWednesdayDraftNudgeEmail({ userName: testName, storyPrompt });
        break;
      case 'friday':
        emailPayload = getFridayDeadlineReminderEmail({ userName: testName });
        break;
      case 'saturday':
        emailPayload = getSaturdayBotmEmail({ userName: testName, botmTitle, botmAuthor, botmTeaser });
        break;
      default:
        emailPayload = getMondayPromptReleaseEmail({ userName: testName, storyPrompt, poemPrompt });
        break;
    }

    const result = await sendEmail({
      to: targetEmail,
      subject: `[TEST PREVIEW] ${emailPayload.subject}`,
      html: emailPayload.html,
    });

    if (result) {
      return NextResponse.json({ success: true, message: `Test email (${type}) sent successfully to ${targetEmail}` });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to send test email via Resend' }, { status: 500 });
    }
  } catch (error) {
    console.error('Test reminder email error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
