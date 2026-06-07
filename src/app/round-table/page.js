import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCrewMember } from '@/lib/round-table';
import { Database } from '@/lib/db';
import StatCard from '@/components/round-table/StatCard';
import ActivityItem from '@/components/round-table/ActivityItem';
import DepartmentBadge from '@/components/round-table/DepartmentBadge';
import PriorityBadge from '@/components/round-table/PriorityBadge';
import Link from 'next/link';
import { CheckSquare, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=/round-table');
  }

  const crewMember = await getCrewMember(user.id);
  if (!crewMember) {
    redirect('/dashboard');
  }

  // 1. Fetch Stats Summary
  const stats = await Database.queryOne(`
    SELECT 
      COUNT(CASE WHEN status != 'done' THEN 1 END) as open_tasks,
      COUNT(CASE WHEN status = 'done' AND updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as completed_this_week,
      COUNT(CASE WHEN status = 'review' THEN 1 END) as pending_reviews,
      COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) as overdue_count
    FROM crew_tasks
  `);

  // 2. Fetch "My Tasks" (active, assigned to caller)
  const myTasks = await Database.query(`
    SELECT t.id, t.title, t.status, t.priority, t.due_date,
           d.name as department_name, d.color as department_color
    FROM crew_tasks t
    JOIN crew_task_assignees cta ON cta.task_id = t.id
    LEFT JOIN crew_departments d ON d.id = t.department_id
    WHERE cta.crew_member_id = $1 AND t.status != 'done'
    ORDER BY t.due_date ASC NULLS LAST, t.priority = 'urgent' DESC, t.priority = 'high' DESC
    LIMIT 5
  `, [crewMember.id]);

  // 3. Fetch Upcoming Deadlines (next 7 days, any crew member task)
  const upcomingDeadlines = await Database.query(`
    SELECT t.id, t.title, t.due_date, t.priority, d.name as department_name, d.color as department_color
    FROM crew_tasks t
    LEFT JOIN crew_departments d ON d.id = t.department_id
    WHERE t.status != 'done' 
    AND t.due_date >= CURRENT_DATE 
    AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
    ORDER BY t.due_date ASC
    LIMIT 5
  `);

  // 4. Fetch Recent Activity Logs (last 20 logs)
  const activities = await Database.query(`
    SELECT al.*, u.full_name, u.email
    FROM crew_activity_log al
    LEFT JOIN crew_members cm ON cm.id = al.actor_id
    LEFT JOIN users u ON u.id = cm.user_id
    ORDER BY al.created_at DESC
    LIMIT 15
  `);

  // 5. Department workload summary
  const workloads = await Database.query(`
    SELECT d.name, d.color,
           COUNT(CASE WHEN t.status != 'done' THEN 1 END) as open_tasks,
           COUNT(CASE WHEN t.status = 'review' THEN 1 END) as review_tasks
    FROM crew_departments d
    LEFT JOIN crew_tasks t ON t.department_id = d.id
    GROUP BY d.id, d.name, d.color
    ORDER BY open_tasks DESC
  `);

  const userDepts = crewMember.departments.map(d => d.name).join(', ') || 'General Roster';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/5 pb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-burgundy tracking-tight">
            The Round Table
          </h1>
          <p className="text-xs font-sans font-bold uppercase tracking-widest text-ink/50 mt-1">
            Welcome back, <span className="text-ink">{crewMember.fullName}</span> • {userDepts}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/round-table/tasks" 
            className="bg-burgundy hover:bg-ink text-cream text-xs px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <CheckSquare size={14} />
            <span>Go to Kanban Board</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          iconName="CheckSquare" 
          label="Total Open Tasks" 
          value={stats?.open_tasks || 0} 
          trendText="Across CRM"
        />
        <StatCard 
          iconName="Award" 
          label="Completed (7 Days)" 
          value={stats?.completed_this_week || 0} 
          trendText="This Week"
          trendType="up"
        />
        <StatCard 
          iconName="ShieldAlert" 
          label="Overdue Tasks" 
          value={stats?.overdue_count || 0} 
          trendText={stats?.overdue_count > 0 ? "Needs Action" : "On Track"}
          trendType={stats?.overdue_count > 0 ? "down" : "neutral"}
          glowColor={stats?.overdue_count > 0 ? "urgent" : ""}
        />
        <StatCard 
          iconName="Eye" 
          label="Pending Reviews" 
          value={stats?.pending_reviews || 0} 
          trendText="Awaiting Gate"
          glowColor={stats?.pending_reviews > 0 ? "high" : ""}
        />
      </div>

      {/* Grid Content section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Tasks & Deadlines (7 Columns) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* My Tasks widget */}
          <div className="parchment-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-ink/5 pb-3">
              <h3 className="font-display font-bold text-lg text-burgundy">My Active Tasks</h3>
              <Link href="/round-table/tasks" className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-burgundy hover:underline flex items-center">
                <span>View all</span>
                <ChevronRight size={12} />
              </Link>
            </div>
            
            {myTasks.length === 0 ? (
              <div className="text-center py-8 text-ink/40 space-y-2">
                <CheckSquare size={28} className="mx-auto text-ink/20" />
                <p className="text-xs font-bold font-sans">No tasks assigned to you. You are free!</p>
              </div>
            ) : (
              <div className="divide-y divide-ink/5">
                {myTasks.map((task) => (
                  <Link 
                    key={task.id} 
                    href={`/round-table/tasks?task=${task.id}`}
                    className="flex items-center justify-between py-3 hover:bg-cream/20 transition-all rounded-lg px-2 -mx-2"
                  >
                    <div className="min-w-0 pr-4 space-y-1">
                      <p className="text-xs font-bold text-ink truncate leading-tight">{task.title}</p>
                      <div className="flex items-center gap-2">
                        {task.department_name && (
                          <DepartmentBadge name={task.department_name} size="sm" />
                        )}
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[10px] font-sans font-extrabold text-ink/50 uppercase tracking-widest">{task.status.replace('_', ' ')}</span>
                      {task.due_date && (
                        <span className={`text-[9px] font-sans font-bold mt-1 ${
                          new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-ink/40'
                        }`}>
                          Due {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines widget */}
          <div className="parchment-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-ink/5 pb-3">
              <h3 className="font-display font-bold text-lg text-burgundy">Upcoming Deadlines (7 Days)</h3>
              <Calendar size={16} className="text-burgundy/60" />
            </div>
            
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6 text-ink/40">
                <p className="text-xs font-bold font-sans">No upcoming deadlines this week.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((task) => (
                  <Link 
                    key={task.id} 
                    href={`/round-table/tasks?task=${task.id}`}
                    className="flex items-center justify-between p-3 bg-[#FAF7F2] hover:bg-cream/40 rounded-xl border border-ink/5 transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-ink truncate">{task.title}</p>
                      <span className="text-[9px] text-ink/40 font-bold">
                        Department: {task.department_name || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <PriorityBadge priority={task.priority} size="sm" />
                      <span className="text-[9px] font-sans font-extrabold bg-burgundy/5 text-burgundy border border-burgundy/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {new Date(task.due_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Department workloads breakdown */}
          <div className="parchment-card p-6">
            <h3 className="font-display font-bold text-lg text-burgundy mb-4 border-b border-ink/5 pb-3">
              Workload by Department
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="border-b border-ink/5">
                    <th className="py-2.5 text-[10px] font-black uppercase tracking-widest text-ink/40">Department</th>
                    <th className="py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-ink/40">Open Tasks</th>
                    <th className="py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-ink/40">Pending Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 text-xs">
                  {workloads.map((dept) => (
                    <tr key={dept.name}>
                      <td className="py-3 font-bold flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                        {dept.name}
                      </td>
                      <td className="py-3 text-center font-extrabold text-ink/80">{dept.open_tasks}</td>
                      <td className="py-3 text-center font-extrabold text-burgundy">{dept.review_tasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Team Activity Feed (5 Columns) */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="parchment-card p-6 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 border-b border-ink/5 pb-3">
              <h3 className="font-display font-bold text-lg text-burgundy">Team Activity Feed</h3>
              <Link href="/round-table/activity" className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-burgundy hover:underline flex items-center">
                <span>View full feed</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[640px] pr-1 -mr-2 scrollbar-thin">
              {activities.length === 0 ? (
                <div className="text-center py-16 text-ink/40">
                  <p className="text-xs font-bold font-sans">No recent activity logged.</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
