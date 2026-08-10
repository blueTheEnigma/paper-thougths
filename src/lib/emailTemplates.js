// HTML Email Templates for Paper Thoughts Automated Weekly Reminder Sequence

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.paperthoughts.org';

function renderBaseLayout({ title, subtitle, contentHtml, ctaText, ctaUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5EFE0; font-family: 'Georgia', 'Times New Roman', serif; color: #2C1A0E; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F5EFE0; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #20070E; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid rgba(242, 169, 138, 0.2);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 35px 30px 25px 30px; text-align: center; background: linear-gradient(180deg, #330A17 0%, #20070E 100%);">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M25 45C25 41 29 38 34 38C39 38 43 41 43 45V90H25V45Z" fill="#FAF7F2" />
                      <circle cx="34" cy="24" r="6" fill="#FAF7F2" />
                      <path d="M44 35C44 30 49 26 56 26C63 26 68 30 68 35V90H44V35Z" fill="#FAF7F2" />
                      <circle cx="56" cy="14" r="7" fill="#FAF7F2" />
                      <path d="M69 45C69 41 73 38 78 38C83 38 87 41 87 45V90H69V45Z" fill="#FAF7F2" />
                      <circle cx="78" cy="24" r="6" fill="#FAF7F2" />
                      <path d="M53 90V96L56 94L59 96V90H53Z" fill="#C96A42" />
                    </svg>
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #FAF7F2; text-transform: uppercase;">PAPER THOUGHTS</div>
                    <div style="font-size: 10px; font-weight: bold; letter-spacing: 2.5px; color: #F2A98A; text-transform: uppercase;">WE LIVE IN THE LINES</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Title -->
          <tr>
            <td style="padding: 0 30px 20px 30px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold; color: #FAF7F2; font-family: 'Georgia', serif;">${title}</h1>
              ${subtitle ? `<p style="margin: 0; font-size: 14px; font-style: italic; color: #F2A98A;">${subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- Body Card (Parchment Texture Look) -->
          <tr>
            <td style="padding: 0 25px 25px 25px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFF5EC; border-radius: 16px; padding: 25px; border: 1px solid rgba(44, 26, 14, 0.15);">
                <tr>
                  <td style="font-size: 15px; color: #2C1A0E; font-family: 'Georgia', serif; line-height: 1.7;">
                    ${contentHtml}
                    
                    ${ctaText && ctaUrl ? `
                      <div style="margin-top: 28px; text-align: center;">
                        <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #5C1A2E 0%, #C96A42 100%); color: #FAF7F2; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 12px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(92, 26, 46, 0.3);">
                          ${ctaText} →
                        </a>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px 30px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08);">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: rgba(250, 247, 242, 0.6);">
                Paper Thoughts Reading Community • Zaria | Kaduna | Abuja
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(250, 247, 242, 0.4);">
                You are receiving this automated email as a registered member of Paper Thoughts.<br/>
                <a href="${BASE_URL}/dashboard" style="color: #F2A98A; text-decoration: underline;">Manage your preferences</a> in your dashboard.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// 1. Monday 08:00 AM: New Prompt Release Call
export function getMondayPromptReleaseEmail({ userName, storyPrompt, poemPrompt }) {
  const name = userName ? userName.split(' ')[0] : 'Reader';
  const content = `
    <p style="margin-top: 0;">Good morning, <strong>${name}</strong>,</p>
    <p>A fresh week has arrived, and with it, brand new creative prompts are officially live in the Clubhouse Archive!</p>
    
    <div style="background-color: #FAF7F2; border-left: 4px solid #C96A42; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: bold; color: #5C1A2E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">📜 Story Prompt</div>
      <div style="font-size: 14px; font-style: italic; color: #2C1A0E;">"${storyPrompt || 'Write freely about any theme or subject that inspires you today.'}"</div>
    </div>

    <div style="background-color: #FAF7F2; border-left: 4px solid #5C1A2E; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: bold; color: #5C1A2E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">✍️ Poetry Prompt</div>
      <div style="font-size: 14px; font-style: italic; color: #2C1A0E;">"${poemPrompt || 'Write freely about any theme or subject that inspires you today.'}"</div>
    </div>

    <p>Step up to the desk early this week. Submitting your piece earns you community peer feedback, AI synthesis reports, and milestone tokens for the weekly ledger!</p>
  `;

  return {
    subject: `✨ New Weekly Prompts Are Live! | Paper Thoughts`,
    html: renderBaseLayout({
      title: `The Monday Call to Write`,
      subtitle: `New Story & Poetry Prompts Unlocked`,
      contentHtml: content,
      ctaText: `Write Your Piece`,
      ctaUrl: `${BASE_URL}/dashboard/write`
    })
  };
}

// 2. Wednesday 08:00 AM: Mid-Week Writing Draft Nudge
export function getWednesdayDraftNudgeEmail({ userName, storyPrompt }) {
  const name = userName ? userName.split(' ')[0] : 'Reader';
  const content = `
    <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
    <p>We're officially at the mid-week mark. How is your writing draft coming along?</p>
    <p>Whether you have a rough outline, a half-written stanza, or an idea swirling in your mind, now is the perfect moment to sit down and put ink to paper.</p>
    
    <div style="background-color: #FAF7F2; border: 1px dashed rgba(92, 26, 46, 0.3); padding: 15px; border-radius: 12px; margin: 20px 0; text-align: center;">
      <div style="font-size: 12px; font-weight: bold; color: #C96A42; text-transform: uppercase; letter-spacing: 1px;">Mid-Week Focus</div>
      <div style="font-size: 15px; font-weight: bold; color: #5C1A2E; margin-top: 4px;">"Drafting is just talking to yourself on paper."</div>
    </div>

    <p>Don't wait for Friday night pressure. Pop open your draft editor today and get your thoughts into the lines!</p>
  `;

  return {
    subject: `✍️ Mid-Week Nudge: How's Your Writing Draft Coming Along?`,
    html: renderBaseLayout({
      title: `Mid-Week Writing Nudge`,
      subtitle: `Your canvas is waiting`,
      contentHtml: content,
      ctaText: `Continue Drafting`,
      ctaUrl: `${BASE_URL}/dashboard/write`
    })
  };
}

// 3. Friday 08:00 AM: Final Submission Deadline Reminder
export function getFridayDeadlineReminderEmail({ userName }) {
  const name = userName ? userName.split(' ')[0] : 'Reader';
  const content = `
    <p style="margin-top: 0;">Happy Friday, <strong>${name}</strong>!</p>
    <p>This is your final call: the weekly submission window closes tonight at midnight!</p>
    
    <div style="background-color: #330A17; color: #FAF7F2; padding: 18px; border-radius: 12px; margin: 20px 0; text-align: center; border: 1px solid rgba(242, 169, 138, 0.3);">
      <div style="font-size: 11px; font-bold; color: #F2A98A; text-transform: uppercase; letter-spacing: 1.5px;">⏰ Cutoff Warning</div>
      <div style="font-size: 18px; font-weight: bold; margin-top: 4px; color: #FAF7F2;">Friday Midnight Cutoff</div>
      <div style="font-size: 12px; color: rgba(250, 247, 242, 0.7); margin-top: 2px;">Submit before 11:59 PM to enter the active review cycle</div>
    </div>

    <p>Why submit before midnight?</p>
    <ul style="padding-left: 20px; margin: 10px 0;">
      <li style="margin-bottom: 6px;">Earn weekly <strong>Milestone Tokens</strong> and maintain your streak.</li>
      <li style="margin-bottom: 6px;">Get constructive peer reviews from members across Zaria, Kaduna, and Abuja.</li>
      <li style="margin-bottom: 6px;">Receive your personalized AI Editorial Synthesis Report.</li>
    </ul>

    <p>Polishing your draft takes just 10 minutes. Click below to submit before the ledger locks!</p>
  `;

  return {
    subject: `⏰ Final Hours: Submit Your Writing Before Midnight!`,
    html: renderBaseLayout({
      title: `Final Submission Deadline Call`,
      subtitle: `Weekly cycle closes tonight at midnight`,
      contentHtml: content,
      ctaText: `Submit Your Work Now`,
      ctaUrl: `${BASE_URL}/dashboard/write`
    })
  };
}

// 4. Saturday 10:00 AM: Weekend BOTM Reading & Review Check-In
export function getSaturdayBotmEmail({ userName, botmTitle, botmAuthor, botmTeaser }) {
  const name = userName ? userName.split(' ')[0] : 'Reader';
  const content = `
    <p style="margin-top: 0;">Happy weekend, <strong>${name}</strong>!</p>
    <p>The weekend has arrived—the perfect time to pour a warm drink, open your book, and dive deep into literature.</p>
    
    ${botmTitle ? `
      <div style="background-color: #FAF7F2; border: 1px solid rgba(92, 26, 46, 0.2); padding: 18px; border-radius: 14px; margin: 20px 0;">
        <div style="font-size: 10px; font-weight: bold; color: #C96A42; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📖 Featured Book of the Month</div>
        <div style="font-size: 18px; font-weight: bold; color: #5C1A2E;">${botmTitle}</div>
        <div style="font-size: 13px; font-weight: bold; color: #8D5B4C; margin-bottom: 10px;">by ${botmAuthor || 'Community Pick'}</div>
        ${botmTeaser ? `<div style="font-size: 13px; font-style: italic; color: #2C1A0E; line-height: 1.5;">"${botmTeaser}"</div>` : ''}
      </div>
    ` : ''}

    <p>Join the collective discussions: post your reviews, join buddy reads, or order curated physical hardcopies from the Bookstore!</p>
  `;

  return {
    subject: `📚 Weekend Reading Check-In: Book of the Month & Discussions`,
    html: renderBaseLayout({
      title: `The Weekend Reading Lounge`,
      subtitle: `Grab a cup, open a book, and join the conversation`,
      contentHtml: content,
      ctaText: `Join BOTM Discussion`,
      ctaUrl: `${BASE_URL}/discussion`
    })
  };
}
