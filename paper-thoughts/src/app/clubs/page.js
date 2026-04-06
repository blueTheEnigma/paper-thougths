import Clubs from '../../components/Clubs';
import { getImages } from '../../lib/data';

export const metadata = {
  title: 'Chapters - Paper Thoughts',
};

export default async function ClubsPage() {
  const images = await getImages();
  return <Clubs images={images} />;
}
