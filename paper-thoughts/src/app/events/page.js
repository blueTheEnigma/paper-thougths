import Events from '../../components/Events';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Events Hub",
  description: "Join us for book readings, debates, and community gatherings. View our upcoming schedule of events.",
};

async function getEvents() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/events`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.events : [];
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();
  return <Events initialEvents={events} />;
}
