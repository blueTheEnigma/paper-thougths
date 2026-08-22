import PodcastsGrid from '@/components/podcasts/PodcastsGrid';

export const metadata = {
  title: 'Spoken Lore & Podcasts | Paper Thoughts',
  description: 'Immerse yourself in curated literary audio, short stories, and spoken-word narratives from Paper Thoughts storytellers.',
  openGraph: {
    title: 'Spoken Lore & Podcasts | Paper Thoughts',
    description: 'Short stories and audio literature retold through life’s highs, lows, and in-betweens.',
    images: ['https://i.scdn.co/image/ab6765630000ba8a9be26c760ec1a3210b8c1ce9']
  }
};

export default function PodcastsPage() {
  return (
    <div 
      className="min-h-screen text-cream py-14 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#F2A98A]/40"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #20070e 0%, #0d0205 60%, #050002 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        <PodcastsGrid />
      </div>
    </div>
  );
}
