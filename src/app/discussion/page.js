import { Database } from '@/lib/db';
import DiscussionClient from './DiscussionClient';

export const metadata = {
  title: "Book of the Month Discussions - Paper Thoughts",
  description: "Share your thoughts, read member reviews, and engage in literary debates on our Books of the Month.",
};

export default async function DiscussionPage({ searchParams }) {
  // Fetch active Books of the Month from the database
  const activeBooks = await Database.query(`
    SELECT id, title, author, image_url as "imageUrl", teaser, price, purchase_link as "purchaseLink", chapter_id as "chapterId"
    FROM book_of_the_month
    WHERE active = TRUE
    ORDER BY created_at DESC
  `);

  const generalBotm = activeBooks.find(b => b.chapterId === null) || null;
  const abujaBotm = activeBooks.find(b => b.chapterId === 3) || null;

  // Resolve initial stream from search parameters
  const resolvedParams = await searchParams;
  const initialStream = resolvedParams?.stream === 'abuja' ? 'abuja' : 'general';

  return (
    <DiscussionClient 
      generalBotm={generalBotm} 
      abujaBotm={abujaBotm} 
      initialStream={initialStream}
    />
  );
}
