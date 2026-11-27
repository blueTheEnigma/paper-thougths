import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import {
  sendHeraldGroupBroadcast,
  sendHeraldPrivateReply,
  sendHeraldReaction,
  sendHeraldReply,
  getHeraldAdminPhones,
  formatNigerianPhone
} from '@/lib/herald';
import {
  getNewMemberGreeting,
  getNewMemberIntroReply,
  getHeraldOracleAnswer,
  formatBotmReply,
  formatStoreReply,
  formatEventsReply,
  formatReviewsReply,
  formatPassportDM,
  formatCommandsDirectory
} from '@/lib/heraldLore';
import {
  getActivePromptData,
  getUpcomingGatheringsData,
  getActiveBotmData,
  getPendingReviewsData,
  searchStoreCatalog,
  getMemberWeeklyPassport,
  buildHeraldOracleContext,
  findUserByWhatsapp
} from '@/lib/heraldContext';

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
 * Shared command dispatcher used in both Group Chat and Member/Admin DMs.
 * Returns { handled: boolean }
 */
async function handleCommunityUtilityCommand({ cleanLower, cleanText, isGroup, remoteJid, msgKey, messageId, senderPhone }) {
  const isPromptCmd = /^(\/|!)(prompt|promtp)\b/.test(cleanLower);
  const isReviewsCmd = /^(\/|!)(reviews?|critiques?)\b/.test(cleanLower);
  const isBotmCmd = /^(\/|!)botm\b/.test(cleanLower);
  const isStoreCmd = /^(\/|!)(store|book|bookstore)\b/.test(cleanLower);
  const isEventsCmd = /^(\/|!)(events?|townhalls?|gatherings?)\b/.test(cleanLower);
  const isMeCmd = /^(\/|!)(me|passport|stats|leaves)\b/.test(cleanLower);
  const isHelpCmd = cleanLower === '/commands' || cleanLower === '!commands' || (isGroup && (cleanLower === '/help' || cleanLower === '!help'));

  if (isHelpCmd) {
    await sendHeraldReaction({ remoteJid, messageId, reaction: '📜' });
    await sendHeraldReply({ to: remoteJid, text: formatCommandsDirectory(), quotedKey: msgKey });
    return true;
  }

  if (isPromptCmd) {
    await sendHeraldReaction({ remoteJid, messageId, reaction: '🖋️' });
    const activePrompt = await getActivePromptData();
    const answer = activePrompt
      ? `🖋️ *This Week's Writing Spark*:\n\n` +
        `*"${activePrompt.promptText}"*\n` +
        `Format: *${(activePrompt.promptType || 'story').toUpperCase()}*\n\n` +
        `Draft and polish your piece before Friday midnight to protect your streak:\n` +
        `👉 https://paperthoughts.org/dashboard/write`
      : `Kindred mind, the wardens are currently preparing this week's spark! Check back shortly or visit https://paperthoughts.org/dashboard 🕯️`;
    await sendHeraldReply({ to: remoteJid, text: answer, quotedKey: msgKey });
    return true;
  }

  if (isReviewsCmd) {
    await sendHeraldReaction({ remoteJid, messageId, reaction: '📝' });
    const member = senderPhone ? await findUserByWhatsapp(senderPhone) : null;
    const { picks, totalNeedingReviews } = await getPendingReviewsData(member?.id || null, 4);
    await sendHeraldReply({
      to: remoteJid,
      text: formatReviewsReply({ picks, totalNeedingReviews }),
      quotedKey: msgKey
    });
    return true;
  }

  if (isBotmCmd) {
    await sendHeraldReaction({ remoteJid, messageId, reaction: '📚' });
    const botmData = await getActiveBotmData();
    await sendHeraldReply({ to: remoteJid, text: formatBotmReply(botmData), quotedKey: msgKey });
    return true;
  }

  if (isStoreCmd) {
    await sendHeraldReaction({ remoteJid, messageId, reaction: '🛍️' });
    const storeQuery = cleanText.replace(/^(\/|!)(store|book|bookstore)\s*/i, '').trim();
    const storeData = await searchStoreCatalog(storeQuery);
    await sendHeraldReply({ to: remoteJid, text: formatStoreReply(storeData), quotedKey: msgKey });
    return true;
  }

  if (isEventsCmd) {
    await sendHeraldReaction({ remoteJid, messageId, reaction: '🏛️' });
    const gatherings = await getUpcomingGatheringsData(3);
    await sendHeraldReply({ to: remoteJid, text: formatEventsReply({ gatherings }), quotedKey: msgKey });
    return true;
  }

  if (isMeCmd) {
    await sendHeraldReaction({ remoteJid, messageId, reaction: '🕯️' });
    const passport = await getMemberWeeklyPassport(senderPhone);
    const dmText = formatPassportDM(passport);

    if (!isGroup) {
      await sendHeraldReply({ to: remoteJid, text: dmText, quotedKey: msgKey });
    } else if (senderPhone) {
      const dmSent = await sendHeraldPrivateReply({ phone: senderPhone, text: dmText });
      if (!dmSent) {
        await sendHeraldReply({
          to: remoteJid,
          text: `🕯️ I tried sending your Sanctuary Passport privately — please send */me* directly in a DM to me (+234 704 604 3294) so WhatsApp lets me reply privately!`,
          quotedKey: msgKey
        });
      }
    }
    return true;
  }

  return false;
}

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

    const primaryGroupJid = process.env.HERALD_GROUP_JID || '120363430362177971@g.us';
    const testGroupJids = (process.env.HERALD_TEST_GROUP_JIDS || '120363428935640738@g.us')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const allowedGroupJids = [primaryGroupJid, ...testGroupJids];

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Group Participant Join Event (action: 'add')
    // ──────────────────────────────────────────────────────────────────────────
    if (
      event === 'group-participants.update' ||
      event === 'group.participants.update' ||
      event.includes('group-participants') ||
      event.includes('group.participants')
    ) {
      const action = rawData.action;
      const participants = rawData.participants || [];
      const remoteJid = rawData.id || rawData.remoteJid || rawData.groupJid || body.remoteJid || '';

      if (remoteJid && !allowedGroupJids.includes(remoteJid)) {
        return NextResponse.json({ success: true, processed: false, reason: 'group_jid_mismatch' });
      }

      if (action === 'add' && participants.length > 0) {
        for (const rawParticipant of participants) {
          const participantStr = typeof rawParticipant === 'string'
            ? rawParticipant
            : (rawParticipant?.phoneNumber || rawParticipant?.id || '');
          const rawPhone = participantStr.replace(/@.*$/, '');
          const cleanPhone = formatNigerianPhone(rawPhone);

          if (cleanPhone) {
            await Database.query(`
              INSERT INTO herald_newcomers (phone, welcome_sent_at)
              VALUES ($1, NOW())
              ON CONFLICT (phone) DO UPDATE SET welcome_sent_at = NOW()
            `, [cleanPhone]).catch(e => console.error('[Herald Webhook] Error tracking newcomer:', e));

            const idempotencyKey = `welcome_entrant_${cleanPhone}_${remoteJid}_${new Date().toISOString().slice(0, 10)}`;
            const greetingText = getNewMemberGreeting({ phone: cleanPhone });

            await sendHeraldGroupBroadcast({
              text: greetingText,
              mentions: [cleanPhone],
              idempotencyKey,
              ritualType: 'new_member_welcome',
              targetGroupJid: remoteJid || primaryGroupJid
            });
          }
        }
      }
      return NextResponse.json({ success: true, processed: true });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Incoming Messages Event (MESSAGES_UPSERT)
    // ──────────────────────────────────────────────────────────────────────────
    if (event === 'messages.upsert' || event.includes('messages.upsert')) {
      const messages = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.messages) ? rawData.messages : [rawData]);
      const adminPhones = await getHeraldAdminPhones();

      for (const msg of messages) {
        const msgKey = msg.key || {};
        if (msgKey.fromMe) continue;

        const remoteJid = msgKey.remoteJid || '';
        const isGroup = remoteJid.endsWith('@g.us');
        const isDM = remoteJid.endsWith('@s.whatsapp.net') || remoteJid.endsWith('@lid');

        const messageId = msgKey.id;
        const participantJid = isGroup
          ? (msgKey.participantAlt || msgKey.participant || remoteJid)
          : (msgKey.remoteJidAlt || remoteJid);
        const rawPhone = participantJid.replace(/@.*$/, '');
        const senderPhone = formatNigerianPhone(rawPhone);
        const isSenderAdmin = Boolean(senderPhone && adminPhones.includes(senderPhone));

        if (isGroup && !allowedGroupJids.includes(remoteJid) && !isSenderAdmin) {
          continue;
        }

        const pushName = msg.pushName || '';
        const text = extractMessageText(msg);
        if (!text) continue;

        // Telemetry update
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

        const botPhone = process.env.HERALD_BOT_PHONE || '2347046043294';
        const botLid = process.env.HERALD_BOT_LID || '274715419664399';
        const cleanText = text
          .replace(/@?herald\b/gi, '')
          .replace(new RegExp(`@${botPhone}\\b`, 'g'), '')
          .replace(new RegExp(`@${botLid}\\b`, 'g'), '')
          .trim();
        const lowerText = text.trim().toLowerCase();
        const cleanLower = cleanText.toLowerCase();

        // ────────────────────────────────────────────────────────────────────────
        // Branch A: Direct Messages (1-on-1 private chat)
        // ────────────────────────────────────────────────────────────────────────
        if (isDM && senderPhone) {
          // Allow any member to use /me, /prompt, /reviews, /botm, /store, /events, /commands in DM
          const handledMemberCmd = await handleCommunityUtilityCommand({
            cleanLower, cleanText, isGroup: false, remoteJid, msgKey, messageId, senderPhone
          });
          if (handledMemberCmd) continue;

          if (!isSenderAdmin) {
            await sendHeraldReply({
              to: remoteJid,
              text: `🕯️ Peace be with you, fellow pilgrim! Here in DM you can run */me* for your Sanctuary Passport, */prompt*, */reviews*, */botm*, */store <title>*, or */events* — or send */commands* to see everything. 📖`,
              quotedKey: msgKey
            });
            continue;
          }

          // Admin DM Grimoire
          if (lowerText === 'help' || lowerText === 'commands' || lowerText === 'menu') {
            const helpText = `🗝️ *The Herald's Warden Grimoire* 🗝️\n\n` +
              `• *status* — Live vitals on members, manuscripts, and gathering\n` +
              `• *townhall <url>* — Update next Thursday Townhall Meet link\n` +
              `• *prompt <text>* — Record and queue a new writing prompt\n` +
              `• *reviews* (or *critique*) — View manuscripts awaiting reviews\n` +
              `• *announce <text>* — Broadcast an immediate bulletin to Town Hall\n` +
              `• *test* — Run an instant diagnostic ping\n` +
              `_(Plus all member slash commands: /prompt, /reviews, /botm, /store, /events, /me)_ 🕯️`;
            await sendHeraldReply({ to: remoteJid, text: helpText, quotedKey: msgKey });
            continue;
          }

          if (lowerText === 'status' || lowerText === 'pulse' || lowerText === 'vitals') {
            const [userStats, unreviewedWorks, nextGathering, activePrompt] = await Promise.all([
              Database.queryOne(`
                SELECT COUNT(*) as total_users,
                       COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as active_users
                FROM users
              `).catch(() => ({ total_users: 0, active_users: 0 })),
              getPendingReviewsData(null, 5),
              getUpcomingGatheringsData(1),
              getActivePromptData()
            ]);

            const nextG = nextGathering[0];
            const statusReport = `🕯️ *Paper Thoughts Sanctuary Vitals* 🕯️\n\n` +
              `✦ *Fellowship Stats*:\n` +
              `• Registered Pilgrims: *${userStats.total_users}*\n` +
              `• Active Members: *${userStats.active_users}*\n` +
              `• Manuscripts Needing Reviews (<3): *${unreviewedWorks.totalNeedingReviews}*\n\n` +
              `✦ *Next Gathering*:\n` +
              `• Title: *${nextG?.title || 'Weekly Literary Salon'}*\n` +
              `• Date: *${nextG?.eventDate ? new Date(nextG.eventDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos' }) : 'Thursday'}*\n` +
              `• Meet Link: ${nextG?.meetUrl || '_Not set yet_'}\n\n` +
              `✦ *Active Prompt*:\n` +
              `• _"${activePrompt?.promptText || 'None active'}"_\n\n` +
              `✦ *Herald Infrastructure*:\n` +
              `• Evolution Socket: Open & Active ✨`;

            await sendHeraldReply({ to: remoteJid, text: statusReport, quotedKey: msgKey });
            continue;
          }

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
            `, [newUrl]).catch(e => console.error('Error updating meet_url:', e));

            await sendHeraldReply({
              to: remoteJid,
              text: `✓ *Townhall Google Meet Link Updated!*\n\nNew Link: ${newUrl}\nThis link will be used in Thursday's teaser and final call. 🏛️✨`,
              quotedKey: msgKey
            });
            continue;
          }

          if (lowerText.startsWith('prompt ')) {
            const promptContent = text.replace(/^prompt\s+/i, '').trim();
            if (!promptContent) {
              await sendHeraldReply({ to: remoteJid, text: `⚠️ Please provide the prompt text. e.g. *prompt Write a story beginning with a torn map*`, quotedKey: msgKey });
              continue;
            }
            await Database.query(`
              INSERT INTO prompts (prompt_text, prompt_type, active_date)
              VALUES ($1, 'story', CURRENT_DATE)
            `, [promptContent]).catch(e => console.error('Error inserting prompt:', e));

            await sendHeraldReply({
              to: remoteJid,
              text: `✓ *New Writing Prompt Recorded!* 🖋️\n\n_"${promptContent}"_\nIt is now active and ready.`,
              quotedKey: msgKey
            });
            continue;
          }

          if (lowerText === 'critique' || lowerText === 'reviews') {
            const { picks, totalNeedingReviews } = await getPendingReviewsData(null, 5);
            await sendHeraldReply({ to: remoteJid, text: formatReviewsReply({ picks, totalNeedingReviews }), quotedKey: msgKey });
            continue;
          }

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

          if (lowerText === 'test' || lowerText === 'ping') {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '🕯️' });
            await sendHeraldReply({
              to: remoteJid,
              text: `✓ *The Herald is Vigilant!*\nSocket connected, DB connected, commands & NLP online. ✨`,
              quotedKey: msgKey
            });
            continue;
          }

          await sendHeraldReply({
            to: remoteJid,
            text: `Command not recognized. Send *help* for Warden Grimoire or */commands* for member shortcuts. 📖`,
            quotedKey: msgKey
          });
          continue;
        }

        // ────────────────────────────────────────────────────────────────────────
        // Branch B: Town Hall & Authorized Test Group Chats (`@g.us`)
        // ────────────────────────────────────────────────────────────────────────
        if (isGroup && senderPhone) {
          // 1. Always handle slash commands first (even for newcomers)
          const handledGroupCmd = await handleCommunityUtilityCommand({
            cleanLower, cleanText, isGroup: true, remoteJid, msgKey, messageId, senderPhone
          });
          if (handledGroupCmd) continue;

          // 2. Check Newcomer Introduction Recognition
          const pendingNewcomer = await Database.queryOne(`
            SELECT phone, welcome_sent_at, introduced_at
            FROM herald_newcomers
            WHERE phone = $1 AND introduced_at IS NULL
          `, [senderPhone]).catch(() => null);

          const introCues = /(nightstand|my name is|call me|pen name|i am reading|reading currently|pleased to meet|happy to join|1\.|2\.|3\.)/i;
          const isCommandLike = /^(@\S+\s+)*[\/!]/.test(text.trim());
          const isIntroMessage = !isCommandLike && (pendingNewcomer || (quotedStanzaId && text.length > 20 && introCues.test(text)));

          if (isIntroMessage && text.length >= 10) {
            await sendHeraldReaction({ remoteJid, messageId, reaction: '🕯️' });
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
            await Database.query(`
              UPDATE herald_newcomers
              SET introduced_at = NOW(), intro_message_id = $1, push_name = $2
              WHERE phone = $3
            `, [messageId, pushName, senderPhone]).catch(e => console.error('Error marking newcomer intro:', e));
            continue;
          }

          // 3. Natural Language @Herald Targeting (tags via JID, raw @lid, @botPhone, or "Herald")
          const isMentioned =
            mentionedJids.some(jid => jid.includes(botPhone) || jid.includes(botLid) || jid.includes('herald')) ||
            text.includes(`@${botPhone}`) ||
            text.includes(`@${botLid}`);
          const textMentionsHerald = /@?herald\b/i.test(text);
          const isHeraldTargeted = isMentioned || textMentionsHerald;

          if (isHeraldTargeted) {
            const queryLower = (cleanLower || lowerText);

            if (/(prompt|promtp|spark|topic|assignment)/i.test(queryLower) && !/(book|store|price|townhall|meet|review|critique)/i.test(queryLower)) {
              await handleCommunityUtilityCommand({ cleanLower: '/prompt', cleanText: '/prompt', isGroup: true, remoteJid, msgKey, messageId, senderPhone });
              continue;
            }
            if (/(townhall|meet|gathering|thursday|salon|upcoming event|next event|when is)/i.test(queryLower)) {
              await handleCommunityUtilityCommand({ cleanLower: '/events', cleanText: '/events', isGroup: true, remoteJid, msgKey, messageId, senderPhone });
              continue;
            }
            if (/(what.*book of the month|current botm|this month.*book|botm|what are we reading)/i.test(queryLower)) {
              await handleCommunityUtilityCommand({ cleanLower: '/botm', cleanText: '/botm', isGroup: true, remoteJid, msgKey, messageId, senderPhone });
              continue;
            }
            if (/(how many leaves|my leaves|my streak|my tokens|my status|check my stats)/i.test(queryLower)) {
              await handleCommunityUtilityCommand({ cleanLower: '/me', cleanText: '/me', isGroup: true, remoteJid, msgKey, messageId, senderPhone });
              continue;
            }

            // Grounded NLP Oracle powered by Gemini + Live DB & Bookstore Snapshot
            await sendHeraldReaction({ remoteJid, messageId, reaction: '✨' });
            const clubContext = await buildHeraldOracleContext(cleanText);
            const oracleAnswer = await getHeraldOracleAnswer(cleanText || text, pushName || 'Kindred Pilgrim', clubContext);
            await sendHeraldReply({ to: remoteJid, text: oracleAnswer, quotedKey: msgKey });
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
