import SoundscapesGrid from '../../components/soundscapes/SoundscapesGrid';

export const metadata = {
  title: 'Literary Soundscapes | Paper Thoughts',
  description: 'Reading playlists crafted to match the mood of every page.'
};

export default function SoundscapesPage() {
  return (
    <div className="min-h-screen bg-[#0D0B14] text-amber-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <SoundscapesGrid />
      </div>
    </div>
  );
}
