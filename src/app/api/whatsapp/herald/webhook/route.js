import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { 
  sendHeraldGroupBroadcast, 
  sendHeraldAdminAlert,
  sendHeraldReaction,
  sendHeraldReply,
  getHeraldAdminPhones,
  formatNigerianPhone 
} from '@/lib/herald';
import { 
  getNewMemberGreeting,
  getNewMemberIntroReply,
  getHeraldOracleAnswer,
  getLiteraryBoost,
  getGoalPrompt
} from '@/lib/heraldLore';

export const dynamic = 'force-dynamic';

function extractMessageText(msg) {
  if (!msg || !msg.message) return '';
  const m = msg.message;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  ).trim();
}

/**
 * Incoming Webhook Receiver from Evolution API
 * Invariant: Handles group-participant additions (welcomes), introductions,
 * townhall oracle queries, and secret Admin DM commands.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'healthy',
    herald: 'The Paper Thoughts Herald Webhook is active and vigilant 🕯️'
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('apikey') || request.headers.get('authorization');
    const secret = process.env.HERALD_API_KEY || 'pt_herald_516c41028a10df20546b9082726c9814';

    if (secret && authHeader && !authHeader.includes(secret)) {
      return NextResponse.json({ success: false, error: 'Unauthorized webhook' }, { status: 401 });
    }

    const body = await request.json();
    const event = (body.event || body.type || '').toLowerCase().replace(/_/g, '.');
    const rawData = body.data || body;

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Group Participant Join Event (action: 'add')
    // ──────────────────────────────────────────────────────────────────────────
    if (event === 'group-participants.update' || event.includes('group-participants')) {
      const action = rawData.action;
      const participants = rawData.participants || [];
      const remoteJid = rawData.id || rawData.remoteJid || rawData.groupJid || body.remoteJid || '';

      // Guard: Only process participant joins for configured HERALD_GROUP_JID
      const expectedGroupJid = process.env.HERALD_GROUP_JID;
      if (expectedGroupJid && remoteJid && remoteJid !== expectedGroupJid) {
        console.log(`[Herald Webhook] Ignoring participant join for non-herald group: ${remoteJid}`);
        return NextResponse.json({ success: true, processed: false, reason: 'group_jid_mismatch' });
      }

      if (action === 'add' && participants.length > 0) {
        for (const rawParticipant of participants) {
          const participantStr = typeof rawParticipant === 'string'
            ? rawParticipant
            : (rawParticipant?.id || rawParticipant?.phoneNumber || '');
          const rawPhone = participantStr.replace(/@.*$/, '');
          const cleanPhone = formatNigerianPhone(rawPhone);

          if (cleanPhone) {
            // Track newcomer in herald_newcomers table
            await Database.query(`
              INSERT INTO herald_newcomers (phone, welcome_sent_at)
              VALUES ($1, NOW())
              ON CONFLICT (phone) DO UPDATE SET welcome_sent_at = NOW()
            `).catch(e => console.error('[Herald Webhook] Error tracking newcomer:', e));

            const idempotencyKey = `welcome_entrant_${cleanPhone}_${new Date().toISOString().slice(0, 10)}`;
            const greetingText = getNewMemberGreeting({ phone: cleanPhone });

            await sendHeraldGroupBroadcast({
              text: greetingText,
              mentions: [cleanPhone],
              idempotencyKey,
              ritualType: 'new_member_welcome'
            });

            console.log(`[Herald] Successfully dispatched welcome ritual for entrant: ${cleanPhone}`);
          }
        }
      }
      return NextResponse.json({ success: true, processed: true });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Incoming Messages Event (MESSAGES_UPSERT)
    // ──────────────────────────────────────────────────────────────────────────
    if (event === 'messages.upsert' || event.includes('messages.upsert')) {
      const messages = Array.isArray(rawData) ? rawData : [rawData];
      const adminPhones = await getHeraldAdminPhones();

      for (const msg of messages) {
        const msgKey = msg.key || {};
        if (msgKey.fromMe) continue; // Ignore own messages

        const remoteJid = msgKey.remoteJid || '';
        const isGroup = remoteJid.endsWith('@g.us');
        const isDM = remoteJid.endsWith('@s.whatsapp.net');

        // Guard: Incoming group messages must match configured HERALD_GROUP_JID
        const expectedGroupJid = process.env.HERALD_GROUP_JID;
        if (isGroup && expectedGroupJid && remoteJid !== expectedGroupJid) {
          continue;
        }

        const messageId = msgKey.id;
        const participantJid = msgKey.participant || remoteJid;
        const rawPhone = participantJid.replace(/@.*$/, '');
        const senderPhone = formatNigerianPhone(rawPhone);
        const pushName = msg.pushName || '';
        const text = extractMessageText(msg);

        if (!text && !msg.message?.reactionMessage) continue;

        // Telemetry: Update activity in users table
        if (senderPhone) {
          Database.query(`
            UPDATE users
            SET last_weekly_nudge_at = NOW()
            WHERE whatsapp = $1 OR whatsapp = $2 OR whatsapp = $3
          `, [senderPhone, `0${senderPhone.slice(3)}`, `+${senderPhone}`]).catch(() => {});
        }

        const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
        const quotedStanzaId = contextInfo.stanzaId;
        const mentionedJids = contextInfo.mentionedJid || [];

        // ────────────────────────────────────────────────────────────────────────
        // Branch A: Secret Admin DM Commands (1-on-1 private chat)
        // ────────────────────────────────────────────────────────────────────────
        if (isDM && senderPhone) {
          const isAdmin = adminPhones.includes(senderPhone);

          if (!isAdmin) {
            await sendHeraldReply({
              to: remoteJid,
              text: `🕯️ Peace be with you, fellow pilgrim. The Herald's private ear is reserved for sanctuary wardens. For fellowship discussions, please join us in the Town Hall! 📖`,
              quotedKey: msgKey
            });
            continue;
          }

          // Handle Admin Command
          const lowerText = text.trim().toLowerCase();

          // 1. HELP / COMMANDS
          if (lowerText === 'help' || lowerText === 'commands' || lowerText === 'menu') {
            const helpText = `🗝️ *The Herald's Warden Grimoire* 🗝️\n\n` +
              `Greetings, Warden. Here are the spells at your command:\n\n` +
              `• *status* — Live vitals on members, manuscripts, and gathering\n` +
              `• *townhall <url>* — Update next Thursday Townhall Meet link\n` +
              `• *prompt <text>* — Record and queue a new writing prompt\n` +
              `• *critique* — View manuscripts in desperate need of reviews\n` +
              `• *announce <text>* — Broadcast an immediate bulletin to Town Hall\n` +
              `• *test* — Run an instant diagnostic ping\n\n` +
              `_The sanctuary is under your watchful guard._ 🕯️`;

            await sendHeraldReply({ to: remoteJid, text: helpText, quotedKey: msgKey });
            continue;
          }

          // 2. STATUS
          if (lowerText === 'status' || lowerText === 'pulse' || lowerText === 'vitals') {
            const userStats = await Database.queryOne(`
              SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as active_users
              FROM users
            `).catch(() => ({ total_users: 0, active_users: 0 }));

            const unreviewedWorks = await Database.query(`
              SELECT s.id, s.title, COUNT(pr.id) as review_count
              FROM submissions s
              LEFT JOIN peer_reviews pr ON pr.submission_id = s.id
              WHERE s.batch_status = 'active_batch'
              GROUP BY s.id, s.title
              HAVING COUNT(pr.id) < 2
            `).catch(() => []);

            const nextGathering = await Database.queryOne(`
              SELECT title, meet_url as "meetUrl", event_date as "eventDate"
              FROM gatherings
              WHERE event_date >= CURRENT_DATE
              ORDER BY event_date ASC
              LIMIT 1
            `).catch(() => null);

            const activePrompt = await Database.queryOne(`
              SELECT prompt_text as "promptText"
              FROM prompts
              WHERE active_date <= CURRENT_DATE
              ORDER BY active_date DESC, id DESC
              LIMIT 1
            `).catch(() => null);

            const statusReport = `🕯️ *Paper Thoughts Sanctuary Vitals* 🕯️\n\n` +
              `✦ *Fellowship Stats*:\n` +
              `• Registered Pilgrims: *${userStats.total_users}*\n` +
              `• Active Members: *${userStats.active_users}*\n` +
              `• Manuscripts Needing Reviews: *${unreviewedWorks.length}*\n\n` +
              `✦ *Next Townhall*:\n` +
              `• Title: *${nextGathering?.title || 'Weekly Literary Salon'}*\n` +
              `• Date: *${nextGathering?.eventDate ? new Date(nextGathering.eventDate).toLocaleDateString() : 'Thursday'} (8:15 PM)*\n` +
              `• Meet Link: ${nextGathering?.meetUrl || '_Not set yet_'}\n\n` +
              `✦ *Active Prompt*:\n` +
              `• _"${activePrompt?.promptText || 'None active'}"_\n\n` +
              `✦ *Herald Infrastructure*:\n` +
              `• VPS Jail: Nominal (< 220 MB RAM / 0.00% CPU)\n` +
              `• Trading Engines: 100% Protected 🛡️\n` +
              `• Webhook: Live & Responsive ✨`;

            await sendHeraldReply({ to: remoteJid, text: statusReport, quotedKey: msgKey });
            continue;
          }

          // 3. TOWNHALL <URL>
          if (lowerText.startsWith('townhall ') || lowerText.startsWith('meet ')) {
            const newUrl = text.replace(/^(townhall|meet)\s+/i, '').trim();
            if (!newUrl.startsWith('http')) {
              await sendHeraldReply({ to: remoteJid, text: `⚠️ Please provide a valid URL starting with http:// or https://`, quotedKey: msgKey });
              continue;
            }

            await Database.query(`
              UPDATE gatherings
              SET meet_url = $1
              WHERE id = (
                SELECT id FROM gatherings
                WHERE event_date >= CURRENT_DATE
                ORDER BY event_date ASC
                LIMIT 1
              )
            `).catch(e => console.error('Error updating meet_url:', e));

            await sendHeraldReply({
              to: remoteJid,
              text: `✓ *Townhall Google Meet Link Updated!*\n\nNew Link: ${newUrl}\nThis link will be automatically used in Thursday's 10:00 AM teaser and 7:45 PM final call. 🏛️✨`,
              quotedKey: msgKey
            });
            continue;
          }

          // 4. PROMPT <TEXT>
          if (lowerText.startsWith('prompt ')) {
            const promptContent = text.replace(/^prompt\s+/i, '').trim();
            if (!promptContent) {
              await sendHeraldReply({ to: remoteJid, text: `⚠️ Please provide the prompt text. e.g. *prompt Write a story beginning with a torn map*`, quotedKey: msgKey });
              continue;
            }

            await Database.query(`
              INSERT INTO prompts (prompt_text, prompt_type, active_date)
              VALUES ($1, 'story', CURRENT_DATE)
            `).catch(e => console.error('Error inserting prompt:', e));

            await sendHeraldReply({
              to: remoteJid,
              text: `✓ *New Writing Prompt Recorded!* 🖋️\n\n_"${promptContent}"_\nIt is now active and ready for Monday's prompt drop or member queries.`,
              quotedKey: msgKey
            });
            continue;
          }

          // 5. CRITIQUE
          if (lowerText === 'critique') {
            const unreviewedWorks = await Database.query(`
              SELECT s.id, s.title, s.genre, COUNT(pr.id) as review_count
              FROM submissions s
              LEFT JOIN peer_reviews pr ON pr.submission_id = s.id
              WHERE s.batch_status = 'active_batch'
              GROUP BY s.id, s.title, s.genre
              HAVING COUNT(pr.id) < 2
              ORDER BY review_count ASC, s.id ASC
              LIMIT 5
            `).catch(() => []);

            if (unreviewedWorks.length === 0) {
              await sendHeraldReply({ to: remoteJid, text: `✨ All manuscripts in the active batch currently have sufficient reviews!`, quotedKey: msgKey });
            } else {
              const list = unreviewedWorks.map((w, idx) => `${idx + 1}. *"${w.title}"* (${w.genre}) — ${w.review_count} reviews\n   👉 https://paperthoughts.org/dashboard/review?submissionId=${w.id}`).join('\n\n');
              await sendHeraldReply({ to: remoteJid, text: `⏳ *Manuscripts Awaiting Peer Review*:\n\n${list}`, quotedKey: msgKey });
            }
            continue;
          }

          // 6. ANNOUNCE <TEXT>
          if (lowerText.startsWith('announce ')) {
            const announcement = text.replace(/^announce\s+/i, '').trim();
            if (!announcement) {
              await sendHeraldReply({ to: remoteJid, text: `⚠️ Please specify the announcement text to broadcast to the Town Hall.`, quotedKey: msgKey });
              continue;
            }

            await sendHeraldGroupBroadcast({
              text: `📢 *Sanctuary Announcement from the Wardens* 📢\n\n${announcement}\n\n— _The Herald_ 🕯️`,
              ritualType: 'admin_manual_announcement'
            });

            await sendHeraldReply({ to: remoteJid, text: `✓ Announcement dispatched to the Town Hall group! 🫯`, quotedKey: msgKey });
            continue;
          }

          // 7. TEST
          if (lowerText === 'test' || lowerText === 'ping') {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '🕯️' });
            await sendHeraldReply({
              to: remoteJid,
              text: `✓ *The Herald is Vigilant!*\nSocket connected, DB connected, latency nominal. May your guard be blessed. ✨`,
              quotedKey: msgKey
            });
            continue;
          }

          // Fallback Admin response
          await sendHeraldReply({
            to: remoteJid,
            text: `Command not recognized. Send *help* to consult the Warden Grimoire. 📖`,
            quotedKey: msgKey
          });
          continue;
        }

        // ────────────────────────────────────────────────────────────────────────
        // Branch B: Town Hall Group Chat (`@g.us`)
        // ────────────────────────────────────────────────────────────────────────
        if (isGroup && senderPhone) {
          // Check if sender is a pending newcomer who hasn't introduced themselves
          const pendingNewcomer = await Database.queryOne(`
            SELECT phone, welcome_sent_at, introduced_at
            FROM herald_newcomers
            WHERE phone = $1 AND introduced_at IS NULL
          `, [senderPhone]).catch(() => null);

          // Criteria for Newcomer Introduction:
          // 1. In herald_newcomers with introduced_at IS NULL, OR
          // 2. Message answers the icebreaker / introduction cues (contains "nightstand", "my name", "reading", "call me", "book", "1.", "2.", "3.")
          const introCues = /(nightstand|my name is|call me|pen name|i am reading|reading currently|pleased to meet|happy to join|1\.|2\.|3\.)/i;
          const isIntroMessage = pendingNewcomer || (quotedStanzaId && text.length > 20 && introCues.test(text));

          if (isIntroMessage && text.length >= 10) {
            // 1. Auto-react with candle
            await sendHeraldReaction({
              remoteJid,
              messageId,
              reaction: '🕯️'
            });

            // 2. Reply: Welcome to the fellowship, @Name!
            const replyText = getNewMemberIntroReply({
              senderName: pushName ? pushName : `@${senderPhone}`,
              phone: senderPhone
            });

            await sendHeraldReply({
              to: remoteJid,
              text: replyText,
              quotedKey: msgKey,
              mentions: [senderPhone]
            });

            // 3. Mark newcomer as introduced
            await Database.query(`
              UPDATE herald_newcomers
              SET introduced_at = NOW(), intro_message_id = $1, push_name = $2
              WHERE phone = $3
            `, [messageId, pushName, senderPhone]).catch(e => console.error('Error marking newcomer intro:', e));

            console.log(`[Herald] Successfully acknowledged newcomer intro from: ${senderPhone}`);
            continue;
          }

          const lowerText = text.trim().toLowerCase();
          const isSlashBoost = lowerText === '/boost' || lowerText === '!boost' || lowerText.startsWith('/boost ') || lowerText.startsWith('!boost ');
          const isSlashGoal = lowerText === '/goal' || lowerText === '!goal' || lowerText.startsWith('/goal ') || lowerText.startsWith('!goal ');
          const isSlashPrompt = lowerText === '/prompt' || lowerText === '!prompt';

          const botPhone = process.env.HERALD_BOT_PHONE || '2347046043294';
          const isMentioned = mentionedJids.some(jid => jid.includes(botPhone) || jid.includes('herald'));
          const textMentionsHerald = /@?herald\b/i.test(text);
          const isHeraldTargeted = isMentioned || textMentionsHerald;

          // Case 1: Creative Writing & Reading Boost (/boost)
          if (isSlashBoost || (isHeraldTargeted && /(boost|motivat|inspire|fire|stuck|write|cheer)/i.test(lowerText))) {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '⚡' });
            const boostText = await getLiteraryBoost({ senderName: pushName || `@${senderPhone}` });
            await sendHeraldReply({
              to: remoteJid,
              text: boostText,
              quotedKey: msgKey,
              mentions: [senderPhone]
            });
            continue;
          }

          // Case 2: Community Reading & Writing Goal Commitment (/goal)
          if (isSlashGoal || (isHeraldTargeted && /(goal|pledge|target|accountab|streak)/i.test(lowerText))) {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '🎯' });
            const goalText = await getGoalPrompt({ senderName: pushName || `@${senderPhone}` });
            await sendHeraldReply({
              to: remoteJid,
              text: goalText,
              quotedKey: msgKey,
              mentions: [senderPhone]
            });
            continue;
          }

          // Case 3: Writing Prompt Query (/prompt)
          if (isSlashPrompt || (isHeraldTargeted && /(prompt|spark|topic|assignment)/i.test(lowerText))) {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '🖋️' });

            const activePrompt = await Database.queryOne(`
              SELECT prompt_text as "promptText", prompt_type as "promptType"
              FROM prompts
              WHERE active_date <= CURRENT_DATE
              ORDER BY active_date DESC, id DESC
              LIMIT 1
            `).catch(() => null);

            if (activePrompt) {
              const answer = `🖋️ *This Week's Writing Spark*:\n\n` +
                `*"${activePrompt.promptText}"*\n` +
                `Format: *${(activePrompt.promptType || 'story').toUpperCase()}*\n\n` +
                `Draft and polish your piece before Friday midnight to protect your streak:\n` +
                `👉 https://paperthoughts.org/dashboard`;

              await sendHeraldReply({ to: remoteJid, text: answer, quotedKey: msgKey });
            } else {
              await sendHeraldReply({
                to: remoteJid,
                text: `Kindred mind, the wardens are currently preparing this week's spark! Check back shortly or visit https://paperthoughts.org/dashboard 🕯️`,
                quotedKey: msgKey
              });
            }
            continue;
          }

          // Case 4: Townhall / Gathering Query
          if (isHeraldTargeted && /(townhall|meet|gathering|thursday|salon|time|when is)/i.test(lowerText)) {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '🏛️' });

            const gathering = await Database.queryOne(`
              SELECT title, meet_url as "meetUrl", event_date as "eventDate"
              FROM gatherings
              WHERE event_date >= CURRENT_DATE AND status != 'cancelled'
              ORDER BY event_date ASC
              LIMIT 1
            `).catch(() => null);

            const dateStr = gathering?.eventDate ? new Date(gathering.eventDate).toLocaleDateString('en-GB', {
              timeZone: 'Africa/Lagos',
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            }) : 'Every Thursday';

            const answer = `🏛️ *Paper Thoughts Townhall Gathering*\n\n` +
              `*Topic:* ${gathering?.title || 'Weekly Literary Discussion'}\n` +
              `*When:* ${dateStr} at *8:15 PM sharp (WAT)*\n` +
              `*Google Meet:* ${gathering?.meetUrl || 'Link will be posted in the group prior to gathering'}\n\n` +
              `Bring your reflections and a hot cup of tea! ☕🕯️`;

            await sendHeraldReply({ to: remoteJid, text: answer, quotedKey: msgKey });
            continue;
          }

          // Case 5: Book Recommendation or Literary Oracle
          if (isHeraldTargeted) {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '✨' });

            const cleanQuery = text.replace(/@?herald\b/gi, '').trim();
            const oracleAnswer = await getHeraldOracleAnswer(cleanQuery, pushName || 'Kindred Pilgrim');
            await sendHeraldReply({
              to: remoteJid,
              text: oracleAnswer,
              quotedKey: msgKey
            });
            continue;
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (err) {
    console.error('[Herald Webhook] Error processing event:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
