import Bookstore from '@/components/Bookstore';
import { getBooks } from '@/lib/data';

export const metadata = {
  title: "The Bookstore",
  description: "Browse our physical collection of curated books. Carefully selected, physically available, and not a PDF.",
};

export const dynamic = 'force-dynamic';

export default async function BookstorePage() {
  const books = await getBooks();
  return <Bookstore initialBooks={books} />;
}
