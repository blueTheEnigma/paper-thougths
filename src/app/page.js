import { getImages, getBooks } from '../lib/data';
import { Database } from '../lib/db';
import Landing from '../components/Landing';
import ContactUs from '../components/ContactUs';

export default async function Home() {
  const [images, books] = await Promise.all([getImages(), getBooks()]);
  const featuredBooks = books.filter(b => b.featured);

  // Fetch active prompts
  const storyPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'story'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  const poemPrompt = await Database.queryOne(`
    SELECT id, prompt_text as "promptText"
    FROM prompts
    WHERE prompt_type = 'poem'
    ORDER BY active_date DESC, created_at DESC
    LIMIT 1
  `);

  // Fetch active Books of the Month from the database
  const activeBooks = await Database.query(`
    SELECT id, title, author, image_url as "imageUrl", teaser, price, purchase_link as "purchaseLink", chapter_id as "chapterId"
    FROM book_of_the_month
    WHERE active = TRUE
    ORDER BY created_at DESC
  `);

  const generalBotm = activeBooks.find(b => b.chapterId === null) || null;
  const abujaBotm = activeBooks.find(b => b.chapterId === 3) || null;

  return (
    <>
      <Landing 
        images={images} 
        books={featuredBooks} 
        storyPrompt={storyPrompt ? storyPrompt.promptText : "No active story prompt."}
        poemPrompt={poemPrompt ? poemPrompt.promptText : "No active poem prompt."}
        generalBotm={generalBotm}
        abujaBotm={abujaBotm}
      />
      <ContactUs />
    </>
  );
}
