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
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #20070E; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 35px rgba(0,0,0,0.2); border: 1px solid rgba(242, 169, 138, 0.25);">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 35px 30px 25px 30px; text-align: center; background: linear-gradient(180deg, #330A17 0%, #20070E 100%);">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <div style="font-size: 19px; font-weight: bold; letter-spacing: 2px; color: #FAF7F2; text-transform: uppercase;">PAPER THOUGHTS</div>
                    <div style="font-size: 10px; font-weight: bold; letter-spacing: 2.5px; color: #F2A98A; text-transform: uppercase;">WE LIVE IN THE LINES</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Title -->
          <tr>
            <td style="padding: 0 30px 20px 30px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 25px; font-weight: bold; color: #FAF7F2; font-family: 'Georgia', serif;">${title}</h1>
              ${subtitle ? `<p style="margin: 0; font-size: 14px; font-style: italic; color: #F2A98A;">${subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- Body Card (Parchment Texture Look) -->
          <tr>
            <td style="padding: 0 25px 25px 25px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFF5EC; border-radius: 16px; padding: 28px 25px; border: 1px solid rgba(44, 26, 14, 0.15);">
                <tr>
                  <td style="font-size: 15px; color: #2C1A0E; font-family: 'Georgia', serif; line-height: 1.7;">
                    ${contentHtml}
                    
                    ${ctaText && ctaUrl ? `
                      <div style="margin-top: 30px; text-align: center;">
                        <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 15px 32px; background: linear-gradient(135deg, #5C1A2E 0%, #C96A42 100%); color: #FAF7F2; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 12px; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(92, 26, 46, 0.35);">
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
              <p style="margin: 0 0 10px 0; font-size: 12px; color: rgba(250, 247, 242, 0.65);">
                Paper Thoughts Reading Community • Zaria | Kaduna | Abuja
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(250, 247, 242, 0.4);">
                You are receiving this automated call as a crosser of Paper Thoughts.<br/>
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
    <p>A new week opens across Zaria, Kaduna, and Abuja, and the gates of <strong>The Writers' Village</strong> are officially thrown wide for a new literary quest.</p>
    <p>Every great story begins with an unexpected knock at the door or a sudden scent in the air. Here are your active prompts for this week’s expedition:</p>
    
    <div style="background-color: #FAF7F2; border-left: 4px solid #C96A42; padding: 16px; border-radius: 8px; margin: 20px 0; border-top: 1px solid rgba(44, 26, 14, 0.08); border-right: 1px solid rgba(44, 26, 14, 0.08); border-bottom: 1px solid rgba(44, 26, 14, 0.08);">
      <div style="font-size: 11px; font-weight: bold; color: #5C1A2E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">📜 Weekly Story Prompt</div>
      <div style="font-size: 15px; font-style: italic; color: #2C1A0E; line-height: 1.5;">"${storyPrompt || 'A writer discovers that the character they killed off in their last chapter is now standing on their doorstep.'}"</div>
    </div>

    <div style="background-color: #FAF7F2; border-left: 4px solid #5C1A2E; padding: 16px; border-radius: 8px; margin: 20px 0; border-top: 1px solid rgba(44, 26, 14, 0.08); border-right: 1px solid rgba(44, 26, 14, 0.08); border-bottom: 1px solid rgba(44, 26, 14, 0.08);">
      <div style="font-size: 11px; font-weight: bold; color: #5C1A2E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">✍️ Weekly Poetry Prompt</div>
      <div style="font-size: 15px; font-style: italic; color: #2C1A0E; line-height: 1.5;">"${poemPrompt || 'Write a poem centering on the smell of rain on dry soil (petrichor) and a forgotten promise.'}"</div>
    </div>

    <p>Step into the Village early. Draft your lines, submit your manuscript to the critique cycle, and claim your milestone tokens for the weekly ledger!</p>
  `;

  return {
    subject: `✨ Step Into the Village: New Weekly Prompts Unlocked! | Paper Thoughts`,
    html: renderBaseLayout({
      title: `The Monday Call to Write`,
      subtitle: `The Writers' Village is open for the new weekly drop`,
      contentHtml: content,
      ctaText: `Step Into The Village`,
      ctaUrl: `${BASE_URL}/village`
    })
  };
}

// 2. Wednesday 08:00 AM: Mid-Week Writing Draft Nudge
export function getWednesdayDraftNudgeEmail({ userName, storyPrompt, poemPrompt }) {
  const name = userName ? userName.split(' ')[0] : 'Reader';
  const content = `
    <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
    <p>We are officially at the mid-week mark. The ink is drying on desk pages across the chapter towns, and the Writers' Village is alive with early drafts.</p>
    
    <div style="background-color: #FAF7F2; border: 1px dashed rgba(92, 26, 46, 0.3); padding: 18px; border-radius: 12px; margin: 20px 0; text-align: center;">
      <div style="font-size: 11px; font-weight: bold; color: #C96A42; text-transform: uppercase; letter-spacing: 1px;">Mid-Week Truth</div>
      <div style="font-size: 15px; font-weight: bold; color: #5C1A2E; margin-top: 5px; font-style: italic;">"Drafting is simply you telling yourself the story for the first time."</div>
    </div>

    ${storyPrompt ? `
      <p style="font-size: 13px; color: #2C1A0E; margin-bottom: 4px;"><strong>Active Story Prompt:</strong></p>
      <p style="font-size: 13px; font-style: italic; color: #5C1A2E; margin-top: 0; padding-left: 10px; border-l: 2px solid #C96A42;">"${storyPrompt}"</p>
    ` : ''}

    <p>Don't wait for Friday night pressure. Pop open your draft editor in the Village today and bring your thoughts into the light!</p>
  `;

  return {
    subject: `✍️ Mid-Week in the Village: How's Your Draft Coming Along?`,
    html: renderBaseLayout({
      title: `Mid-Week Writing Nudge`,
      subtitle: `Your manuscript is waiting in the Village`,
      contentHtml: content,
      ctaText: `Open Your Village Draft`,
      ctaUrl: `${BASE_URL}/village`
    })
  };
}

// 3. Friday 08:00 AM: Final Submission Deadline Reminder
export function getFridayDeadlineReminderEmail({ userName }) {
  const name = userName ? userName.split(' ')[0] : 'Reader';
  const content = `
    <p style="margin-top: 0;">Happy Friday, <strong>${name}</strong>!</p>
    <p>The sun is rising on the final day of this week's drop. Tonight at **11:59 PM**, the submission portal in the Writers' Village locks for the weekly cycle.</p>
    
    <div style="background-color: #330A17; color: #FAF7F2; padding: 18px; border-radius: 14px; margin: 20px 0; text-align: center; border: 1px solid rgba(242, 169, 138, 0.3);">
      <div style="font-size: 11px; font-weight: bold; color: #F2A98A; text-transform: uppercase; letter-spacing: 1.5px;">⏰ Cutoff Warning</div>
      <div style="font-size: 18px; font-weight: bold; margin-top: 4px; color: #FAF7F2;">Friday Midnight Cutoff</div>
      <div style="font-size: 12px; color: rgba(250, 247, 242, 0.7); margin-top: 2px;">Submit before 11:59 PM to enter the active review cycle</div>
    </div>

    <p><strong>Why submit your work today?</strong></p>
    <ul style="padding-left: 20px; margin: 10px 0; font-size: 14px;">
      <li style="margin-bottom: 6px;">Earn your weekly <strong>Milestone Tokens</strong> and keep your streak intact.</li>
      <li style="margin-bottom: 6px;">Enter the peer critique cycle with writers across Zaria, Kaduna, & Abuja.</li>
      <li style="margin-bottom: 6px;">Receive your custom <strong>AI Editorial Synthesis Report</strong>.</li>
    </ul>

    <p>Polishing your draft takes only 10 minutes. Step up to the Village desk before midnight!</p>
  `;

  return {
    subject: `⏰ Final Hours in the Village: Submit Before Midnight Cutoff!`,
    html: renderBaseLayout({
      title: `Final Submission Deadline Call`,
      subtitle: `Weekly cycle closes tonight at 11:59 PM`,
      contentHtml: content,
      ctaText: `Submit To The Village`,
      ctaUrl: `${BASE_URL}/village`
    })
  };
}

// 4. Saturday 10:00 AM: Weekend BOTM Reading & Review Check-In
export function getSaturdayBotmEmail({ userName, botmTitle, botmAuthor, botmTeaser }) {
  const name = userName ? userName.split(' ')[0] : 'Reader';
  const content = `
    <p style="margin-top: 0;">Happy weekend, <strong>${name}</strong>!</p>
    <p>The week’s writing drops are resting, and the weekend reading lounge is officially open across all chapter towns.</p>
    <p>Grab a warm cup of coffee or tea, sink into a quiet corner, and explore what our community is reading right now:</p>
    
    ${botmTitle ? `
      <div style="background-color: #FAF7F2; border: 1px solid rgba(92, 26, 46, 0.2); padding: 18px; border-radius: 14px; margin: 20px 0;">
        <div style="font-size: 10px; font-weight: bold; color: #C96A42; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📖 Featured Book of the Month</div>
        <div style="font-size: 18px; font-weight: bold; color: #5C1A2E;">${botmTitle}</div>
        <div style="font-size: 13px; font-weight: bold; color: #8D5B4C; margin-bottom: 10px;">by ${botmAuthor || 'Community Pick'}</div>
        ${botmTeaser ? `<div style="font-size: 13px; font-style: italic; color: #2C1A0E; line-height: 1.5;">"${botmTeaser}"</div>` : ''}
      </div>
    ` : ''}

    <p>Join the collective discussions: post your reviews, join chapter buddy reads, or pick up physical hardcopies from the Bookstore!</p>
  `;

  return {
    subject: `📚 Weekend in the Homeland: Book of the Month & Reading Lounge`,
    html: renderBaseLayout({
      title: `The Weekend Reading Lounge`,
      subtitle: `Grab a cup, open a book, and join the conversation`,
      contentHtml: content,
      ctaText: `Enter Reading Lounge`,
      ctaUrl: `${BASE_URL}/discussion`
    })
  };
}
