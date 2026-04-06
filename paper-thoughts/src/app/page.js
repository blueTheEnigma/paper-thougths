import { getImages, getBooks } from '../lib/data';
import Landing from '../components/Landing';
import ContactUs from '../components/ContactUs';

export default async function Home() {
  const [images, books] = await Promise.all([getImages(), getBooks()]);
  const featuredBooks = books.filter(b => b.featured);

  return (
    <>
      <Landing images={images} books={featuredBooks} />
      <ContactUs />
    </>
  );
}
