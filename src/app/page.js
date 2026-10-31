import { getImages, getBooks } from '../lib/data';
import { Database } from '../lib/db';
import Landing from '../components/Landing';
import ContactUs from '../components/ContactUs';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [images, books] = await Promise.all([getImages(), getBooks()]);
  const featuredBooks = books.filter(b => b.featured);

  // Fetch active prompts (within 7 days)
  const storyPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'story'
      AND active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  const poemPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'poem'
      AND active_date <= CURRENT_DATE
      AND active_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  // Fetch active Book of the Month from the database (Sanctuary Unified)
  const botmBook = await Database.queryOne(`
    SELECT id, title, author, image_url as "imageUrl", teaser, price, purchase_link as "purchaseLink", chapter_id as "chapterId"
    FROM book_of_the_month
    WHERE active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  `);

  // Fetch latest published Anthology issue
  const latestAnthology = await Database.queryOne(`
    SELECT id, month_year as "monthYear", display_title as "displayTitle"
    FROM monthly_anthology_issues
    WHERE published = TRUE
    ORDER BY month_year DESC
    LIMIT 1
  `).catch(() => null);

  // Fetch next upcoming Gathering / Assembly Event
  let nextGathering = await Database.queryOne(`
    SELECT 
      g.id,
      g.title,
      g.gathering_type as "gatheringType",
      g.event_date as "eventDate",
      g.start_time as "startTime",
      g.meet_url as "meetUrl",
      g.venue_name as "venueName",
      g.description,
      g.cover_url as "coverUrl",
      g.status,
      g.moderator_name as "moderatorName",
      g.moderator_avatar_url as "moderatorAvatarUrl",
      COALESCE(g.co_hosts, '[]'::jsonb) as "coHosts",
      (SELECT COUNT(*) FROM gathering_rsvps gr WHERE gr.gathering_id = g.id)::int as "rsvpCount"
    FROM gatherings g
    WHERE g.status IN ('published', 'live')
      AND g.event_date >= CURRENT_DATE - INTERVAL '1 day'
    ORDER BY g.event_date ASC, g.start_time ASC
    LIMIT 1
  `).catch(() => null);

  if (!nextGathering) {
    nextGathering = await Database.queryOne(`
      SELECT 
        g.id,
        g.title,
        g.gathering_type as "gatheringType",
        g.event_date as "eventDate",
        g.start_time as "startTime",
        g.meet_url as "meetUrl",
        g.venue_name as "venueName",
        g.description,
        g.cover_url as "coverUrl",
        g.status,
        g.moderator_name as "moderatorName",
        g.moderator_avatar_url as "moderatorAvatarUrl",
        COALESCE(g.co_hosts, '[]'::jsonb) as "coHosts",
        (SELECT COUNT(*) FROM gathering_rsvps gr WHERE gr.gathering_id = g.id)::int as "rsvpCount"
      FROM gatherings g
      ORDER BY g.event_date DESC, g.start_time DESC
      LIMIT 1
    `).catch(() => null);
  }

  return (
    <>
      <Landing 
        images={images} 
        books={featuredBooks} 
        storyPrompt={storyPrompt ? storyPrompt.promptText : "Write freely about any theme or subject that inspires you today."}
        poemPrompt={poemPrompt ? poemPrompt.promptText : "Write freely about any theme or subject that inspires you today."}
        botmBook={botmBook}
        generalBotm={botmBook}
        latestAnthology={latestAnthology}
        nextGathering={nextGathering}
      />
      <ContactUs />
    </>
  );
}
