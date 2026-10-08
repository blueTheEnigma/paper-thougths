import { Database } from '@/lib/db';
import DiscussionClient from './DiscussionClient';

export const metadata = {
  title: "Book of the Month Discussions - Paper Thoughts",
  description: "Share your thoughts, read member reviews, and engage in literary debates on our Sanctuary Book of the Month.",
};

export default async function DiscussionPage() {
  // Fetch active unified Book of the Month from the database
  const activeBook = await Database.queryOne(`
    SELECT id, title, author, image_url as "imageUrl", teaser, price, purchase_link as "purchaseLink", chapter_id as "chapterId"
    FROM book_of_the_month
    WHERE active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  `);

  return (
    <DiscussionClient 
      activeBook={activeBook}
    />
  );
}
