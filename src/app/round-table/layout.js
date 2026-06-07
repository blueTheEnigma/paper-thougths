import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCrewMember } from '@/lib/round-table';
import Sidebar from '@/components/round-table/Sidebar';
import './round-table.css';

export const metadata = {
  title: "The Round Table - Crew CRM",
  description: "Internal CRM and task management for Paper Thoughts crew.",
};

export default async function RoundTableLayout({ children }) {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/round-table');
  }

  const crewMember = await getCrewMember(user.id);
  if (!crewMember) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] text-ink mt-[-6rem] md:mt-[-8rem]">
      {/* Collapsible Sidebar */}
      <Sidebar crewMember={crewMember} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        <main className="flex-1 w-full px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
