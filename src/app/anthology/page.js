import AnthologyClient from './AnthologyClient';

export const metadata = {
  title: "The Living Anthology - Paper Thoughts Monthly Laureates",
  description: "Explore the finest literary manuscripts and poems from Paper Thoughts authors. Publicly curated, celebrated, and archived.",
  openGraph: {
    title: "The Living Anthology - Paper Thoughts",
    description: "Read the top short stories and poems selected by the Paper Thoughts Editorial Board.",
    siteName: "Paper Thoughts",
    locale: "en_US",
    type: "article",
  }
};

export default function AnthologyPage() {
  return <AnthologyClient />;
}

