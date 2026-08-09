import SoundscapesGrid from '../../components/soundscapes/SoundscapesGrid';

export const metadata = {
  title: 'Literary Soundscapes | Paper Thoughts',
  description: 'Reading playlists crafted to match the mood of every page.'
};

export default function SoundscapesPage() {
  return (
    <div 
      className="min-h-screen text-cream py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-accent/40"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #20070e 0%, #0d0205 70%, #050002 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        <SoundscapesGrid />
      </div>
    </div>
  );
}
