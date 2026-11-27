import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { isCronAuthorized } from '@/lib/cronAuth';
import { 
  sendHeraldGroupBroadcast, 
  sendHeraldAdminAlert, 
  getHeraldAdminPhones, 
  formatNigerianPhone 
} from '@/lib/herald';
import { 
  getBirthdayToast, 
  getTownhallAlert, 
  getPromptDrop, 
  getFridayCritiqueAlert,
  getWednesdayNudge,
  getSaturdayBotmNudge
} from '@/lib/heraldLore';

export const dynamic = 'force-dynamic';

/**
 * Paper Thoughts Unified Herald Scheduler
 * Invariant: All broadcasts are strictly protected by database idempotency keys.
 */
export async function GET(request) {
  return handleCron(request);
}

export async function POST(request) {
  return handleCron(request);
}

async function handleCron(request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isDryRun = searchParams.get('dryRun') === 'true';

  const now = new Date();
  // WAT (West Africa Time) is UTC+1 year-round (no DST)
  const watDate = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const watHour = watDate.getUTCHours();
  const currentDay = watDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu, 5 = Fri, 6 = Sat
  const todayStr = watDate.toISOString().slice(0, 10);
  const watMonth = watDate.getUTCMonth() + 1;
  const watDay = watDate.getUTCDate();

  const tomorrow = new Date(watDate.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const tomorrowMonth = tomorrow.getUTCMonth() + 1;
  const tomorrowDay = tomorrow.getUTCDate();
  const yearMonthStr = todayStr.slice(0, 7);

  const dispatchesExecuted = [];

  try {
    const adminPhones = await getHeraldAdminPhones();

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Midnight Birthday Toast (Daily, WAT 00:00 - 02:00)
    // ──────────────────────────────────────────────────────────────────────────
    if (watHour >= 0 && watHour < 2) {
      const birthdayUsers = await Database.query(`
        SELECT id, full_name as "fullName", alias, reader_archetype as "readerArchetype", whatsapp
        FROM users
        WHERE birthday IS NOT NULL
          AND EXTRACT(MONTH FROM birthday) = $1
          AND EXTRACT(DAY FROM birthday) = $2
          AND membership_status != 'evicted'
      `, [watMonth, watDay]);

      for (const u of birthdayUsers) {
        const idempotencyKey = `birthday_user_${u.id}_${todayStr}`;
        const toastText = await getBirthdayToast({
          fullName: u.fullName,
          alias: u.alias,
          readerArchetype: u.readerArchetype
        });

        const cleanPhone = formatNigerianPhone(u.whatsapp);
        const mentions = cleanPhone ? [cleanPhone] : [];

        if (!isDryRun) {
          await sendHeraldGroupBroadcast({
            text: toastText,
            mentions,
            idempotencyKey,
            ritualType: 'birthday_toast'
          });
        }
        dispatchesExecuted.push({ ritual: 'birthday_toast', user: u.fullName, idempotencyKey });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. 10:00 AM Daily Admin Birthday Advance Heads-up (WAT 10:00 - 14:00)
    // ──────────────────────────────────────────────────────────────────────────
    if (watHour >= 10 && watHour < 14) {
      const tomorrowBirthdays = await Database.query(`
        SELECT id, full_name as "fullName", alias, whatsapp
        FROM users
        WHERE birthday IS NOT NULL
          AND EXTRACT(MONTH FROM birthday) = $1
          AND EXTRACT(DAY FROM birthday) = $2
          AND membership_status != 'evicted'
      `, [tomorrowMonth, tomorrowDay]);

      for (const u of tomorrowBirthdays) {
        const idempotencyKey = `admin_birthday_advance_${u.id}_${tomorrowStr}`;
        const alertText = `🕯️ *Admin Heads-Up*: Tomorrow is *${u.fullName}*'s birthday!\nPlease prepare any graphics or tributes for the salon.`;

        for (const adminPhone of adminPhones) {
          if (!isDryRun) {
            await sendHeraldAdminAlert({
              to: adminPhone,
              text: alertText,
              idempotencyKey: `${idempotencyKey}_${adminPhone}`,
              ritualType: 'admin_birthday_advance'
            });
          }
        }
        dispatchesExecuted.push({ ritual: 'admin_birthday_advance', user: u.fullName, idempotencyKey });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Sunday 6:00 PM Admin Operational Sentinel (WAT 18:00 - 21:00)
    // ──────────────────────────────────────────────────────────────────────────
    if (currentDay === 0 && watHour >= 18 && watHour < 21) {
      const idempotencyKey = `admin_sunday_planning_${todayStr}`;
      const alertText = `🕯️ *The Sunday Operational Call*\n\n` +
        `Kindred Admin, the new week approaches:\n` +
        `1. Please ensure the Google Meet link is scheduled and published for this Thursday's Townhall (8:15 PM).\n` +
        `2. Confirm this week's writing prompt is active in the prompts bank.\n\n` +
        `Thank you for guiding the sanctuary! ✨`;

      for (const adminPhone of adminPhones) {
        if (!isDryRun) {
          await sendHeraldAdminAlert({
            to: adminPhone,
            text: alertText,
            idempotencyKey: `${idempotencyKey}_${adminPhone}`,
            ritualType: 'admin_sunday_planning'
          });
        }
      }
      dispatchesExecuted.push({ ritual: 'admin_sunday_planning', idempotencyKey });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Monday 8:00 AM Writing Prompt Drop (WAT 08:00 - 12:00)
    // ──────────────────────────────────────────────────────────────────────────
    if (currentDay === 1 && watHour >= 8 && watHour < 12) {
      const activePrompt = await Database.queryOne(`
        SELECT id, prompt_text as "promptText", prompt_type as "promptType"
        FROM prompts
        WHERE active_date <= $1
        ORDER BY active_date DESC, id DESC
        LIMIT 1
      `, [todayStr]);

      if (activePrompt) {
        const idempotencyKey = `prompt_drop_${activePrompt.id}_${todayStr}`;
        const promptText = getPromptDrop({
          promptText: activePrompt.promptText,
          promptType: activePrompt.promptType
        });

        if (!isDryRun) {
          await sendHeraldGroupBroadcast({
            text: promptText,
            idempotencyKey,
            ritualType: 'prompt_drop'
          });
        }
        dispatchesExecuted.push({ ritual: 'prompt_drop', promptId: activePrompt.id, idempotencyKey });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4b. Wednesday 10:00 AM Mid-Week Draft Nudge (WAT 10:00 - 14:00)
    // ──────────────────────────────────────────────────────────────────────────
    if (currentDay === 3 && watHour >= 10 && watHour < 14) {
      const activePrompt = await Database.queryOne(`
        SELECT prompt_text as "promptText"
        FROM prompts
        WHERE active_date <= $1
        ORDER BY active_date DESC, id DESC
        LIMIT 1
      `, [todayStr]);

      const wedKey = `wednesday_draft_nudge_${todayStr}`;
      const wedText = getWednesdayNudge({ promptText: activePrompt?.promptText });
      if (!isDryRun) {
        await sendHeraldGroupBroadcast({ text: wedText, idempotencyKey: wedKey, ritualType: 'wednesday_nudge' });
      }
      dispatchesExecuted.push({ ritual: 'wednesday_nudge', wedKey });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4c. Saturday 10:00 AM BOTM & Early-Bird Critique Lounge (WAT 10:00 - 14:00)
    // ──────────────────────────────────────────────────────────────────────────
    if (currentDay === 6 && watHour >= 10 && watHour < 14) {
      const activeBotm = await Database.queryOne(`
        SELECT title, author, teaser
        FROM book_of_the_month
        WHERE active = TRUE
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `);

      const satKey = `saturday_botm_lounge_${todayStr}`;
      const satText = getSaturdayBotmNudge({
        bookTitle: activeBotm?.title,
        bookAuthor: activeBotm?.author,
        teaser: activeBotm?.teaser
      });
      if (!isDryRun) {
        await sendHeraldGroupBroadcast({ text: satText, idempotencyKey: satKey, ritualType: 'saturday_botm_lounge' });
      }
      dispatchesExecuted.push({ ritual: 'saturday_botm_lounge', satKey });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Thursday Townhall Gathering Alerts (10:00 AM Teaser & 7:45 PM Final Call)
    // ──────────────────────────────────────────────────────────────────────────
    if (currentDay === 4) {
      const isTeaserWindow = watHour >= 10 && watHour < 14;
      const isFinalCallWindow = watHour >= 19 && watHour < 21;

      if (isTeaserWindow || isFinalCallWindow) {
        const todayGathering = await Database.queryOne(`
          SELECT id, title, meet_url as "meetUrl", start_time as "startTime"
          FROM gatherings
          WHERE event_date = $1 AND status = 'published'
          ORDER BY id DESC
          LIMIT 1
        `, [todayStr]);

        if (todayGathering) {
          if (isTeaserWindow) {
            // Morning Teaser (10:00 AM - 1:59 PM WAT)
            const teaserKey = `townhall_teaser_${todayGathering.id}_${todayStr}`;
            const teaserText = getTownhallAlert({
              title: todayGathering.title,
              meetUrl: todayGathering.meetUrl,
              isFinalCall: false
            });

            if (!isDryRun) {
              await sendHeraldGroupBroadcast({
                text: teaserText,
                idempotencyKey: teaserKey,
                ritualType: 'townhall_teaser'
              });
            }
            dispatchesExecuted.push({ ritual: 'townhall_teaser', gatheringId: todayGathering.id, teaserKey });
          }

          if (isFinalCallWindow) {
            // Final Call (7:00 PM - 8:59 PM WAT)
            const finalKey = `townhall_final_call_${todayGathering.id}_${todayStr}`;
            const finalText = getTownhallAlert({
              title: todayGathering.title,
              meetUrl: todayGathering.meetUrl,
              isFinalCall: true
            });

            if (!isDryRun) {
              await sendHeraldGroupBroadcast({
                text: finalText,
                idempotencyKey: finalKey,
                ritualType: 'townhall_final_call'
              });
            }
            dispatchesExecuted.push({ ritual: 'townhall_final_call', gatheringId: todayGathering.id, finalKey });
          }
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Friday Critique Countdown (WAT 14:00 - 18:00)
    // ──────────────────────────────────────────────────────────────────────────
    if (currentDay === 5 && watHour >= 14 && watHour < 18) {
      const unreviewedWorks = await Database.query(`
        SELECT s.id, s.title, s.genre, COUNT(pr.id) as review_count
        FROM submissions s
        LEFT JOIN peer_reviews pr ON pr.submission_id = s.id
        WHERE s.batch_status = 'active_batch'
        GROUP BY s.id, s.title, s.genre
        HAVING COUNT(pr.id) < 3
        ORDER BY review_count ASC, s.id ASC
        LIMIT 5
      `);

      const critiqueKey = `friday_critique_countdown_${todayStr}`;
      const critiqueText = getFridayCritiqueAlert({ unreviewedManuscripts: unreviewedWorks });

      if (!isDryRun) {
        await sendHeraldGroupBroadcast({
          text: critiqueText,
          idempotencyKey: critiqueKey,
          ritualType: 'critique_countdown'
        });
      }
      dispatchesExecuted.push({ ritual: 'critique_countdown', count: unreviewedWorks.length, critiqueKey });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. Pilgrim Welfare Pulse (28th of the Month, WAT 12:00 - 16:00)
    // ──────────────────────────────────────────────────────────────────────────
    const currentMonthDay = watDate.getUTCDate();
    if (currentMonthDay === 28 && watHour >= 12 && watHour < 16) {
      const silentMembers = await Database.query(`
        SELECT u.id, u.full_name as "fullName", u.whatsapp
        FROM users u
        WHERE u.membership_status = 'active'
          AND u.whatsapp IS NOT NULL
          AND (u.sabbatical_until IS NULL OR u.sabbatical_until < NOW())
          AND (u.last_submission_date IS NULL OR u.last_submission_date < CURRENT_DATE - INTERVAL '30 days')
          AND NOT EXISTS (
            SELECT 1 FROM peer_reviews pr 
            WHERE pr.reviewer_id = u.id AND pr.created_at >= CURRENT_DATE - INTERVAL '30 days'
          )
        LIMIT 10
      `);

      if (silentMembers.length > 0) {
        const welfareKey = `pilgrim_welfare_report_${yearMonthStr}`;
        const listLines = silentMembers.map((m, idx) => {
          const clean = formatNigerianPhone(m.whatsapp);
          const link = clean ? `https://wa.me/${clean}` : 'No phone';
          return `${idx + 1}. *${m.fullName}*: ${link}`;
        }).join('\n');

        const alertText = `🕯️ *Monthly Pilgrim Welfare Report (${yearMonthStr})*\n\n` +
          `These members have had 0 submissions or reviews on Paper Thoughts this month. Reach out with personal fellowship to see if life got busy:\n\n` +
          `${listLines}`;

        for (const adminPhone of adminPhones) {
          if (!isDryRun) {
            await sendHeraldAdminAlert({
              to: adminPhone,
              text: alertText,
              idempotencyKey: `${welfareKey}_${adminPhone}`,
              ritualType: 'pilgrim_welfare_report'
            });
          }
        }
        dispatchesExecuted.push({ ritual: 'pilgrim_welfare_report', count: silentMembers.length, welfareKey });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: isDryRun,
      timestamp: now.toISOString(),
      dispatches: dispatchesExecuted
    });
  } catch (err) {
    console.error('[Herald Cron] Execution failure:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

