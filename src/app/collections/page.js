import Collections from '../../components/Collections';
import { getBooks } from '../../lib/data';

export const metadata = {
  title: 'Collections - Paper Thoughts',
};

export default async function CollectionsPage() {
  const books = await getBooks();
  return <Collections books={books} />;
}
