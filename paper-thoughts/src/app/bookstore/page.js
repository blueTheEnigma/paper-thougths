import Bookstore from '../../components/Bookstore';
import { getBooks } from '../../lib/data';

export const metadata = {
  title: 'Bookstore - Paper Thoughts',
};

export default async function BookstorePage() {
  const books = await getBooks();
  return <Bookstore initialBooks={books} />;
}
