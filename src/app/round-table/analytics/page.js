"use client";
import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, AlertOctagon, Timer, 
  Award, RefreshCw, Loader2 
} from 'lucide-react';
import PriorityBadge from '@/components/round-table/PriorityBadge';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/round-table/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-burgundy" />
      </div>
    );
  }

  const { velocity = [], workload = [], productivity = [], overdue = [], bottlenecks = [], summary = {} } = data || {};

  // Find max values for percentage scaling in charts
  const maxVelocity = Math.max(...velocity.map(v => parseInt(v.count || 0)), 1);
  const maxWorkload = Math.max(...workload.map(w => parseInt(w.open_tasks || 0)), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/5 pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-burgundy tracking-tight">CRM Analytics</h1>
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50 mt-0.5">
            Real-time insights, velocity, and review bottlenecks
          </p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="p-2.5 bg-white border border-ink/5 hover:bg-cream/40 rounded-xl transition-colors shadow-sm cursor-pointer"
          title="Refresh statistics"
        >
          <RefreshCw size={14} className="text-ink/65" />
        </button>
      </div>

      {/* Grid: 2 columns top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Task Velocity Bar Chart */}
        <div className="parchment-card p-6">
          <div className="flex items-center justify-between border-b border-ink/5 pb-3 mb-6">
            <h3 className="font-display font-bold text-base text-burgundy flex items-center gap-2">
              <TrendingUp size={16} />
              <span>Completion Velocity (Last 8 Weeks)</span>
            </h3>
            <span className="text-[9px] font-sans font-extrabold bg-green-50 text-green-600 border border-green-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tasks Done
            </span>
          </div>

          {velocity.length === 0 ? (
            <p className="text-xs text-ink/30 italic text-center py-16">No tasks completed in the last 8 weeks.</p>
          ) : (
            <div className="h-64 flex items-end justify-around gap-2 pt-6">
              {velocity.map((v, i) => {
                const count = parseInt(v.count || 0);
                const heightPct = (count / maxVelocity) * 100;
                const weekDate = new Date(v.week);
                const weekLabel = weekDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return (
                  <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                    {/* Tooltip value */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-ink text-cream text-[10px] font-sans font-bold px-1.5 py-0.5 rounded shadow mb-2 absolute translate-y-[-10px] duration-200 pointer-events-none">
                      {count} tasks
                    </div>
                    {/* CSS Bar */}
                    <div 
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                      className="w-full max-w-[32px] bg-burgundy rounded-t-lg transition-all duration-500 group-hover:bg-[#C96A42] cursor-pointer"
                    />
                    <span className="text-[8px] font-sans font-bold text-ink/40 mt-3 truncate w-full text-center">
                      {weekLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Department Workload comparison */}
        <div className="parchment-card p-6">
          <div className="flex items-center justify-between border-b border-ink/5 pb-3 mb-6">
            <h3 className="font-display font-bold text-base text-burgundy flex items-center gap-2">
              <BarChart3 size={16} />
              <span>Department Workloads</span>
            </h3>
            <span className="text-[9px] font-sans font-extrabold bg-blue-50 text-blue-600 border border-blue-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Open Tasks
            </span>
          </div>

          <div className="space-y-4">
            {workload.map((dept) => {
              const openCount = parseInt(dept.open_tasks || 0);
              const widthPct = (openCount / maxWorkload) * 100;

              return (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink">{dept.name}</span>
                    <span className="font-sans font-extrabold text-ink/60">{openCount} active</span>
                  </div>
                  {/* Visual Bar representation */}
                  <div className="w-full h-3 bg-[#FAF7F2] rounded-full border border-ink/5 overflow-hidden">
                    <div 
                      style={{ 
                        width: `${Math.max(widthPct, 2)}%`,
                        backgroundColor: dept.color || '#6B7280'
                      }}
                      className="h-full rounded-full transition-all duration-500 opacity-80 hover:opacity-100"
                    />
                  </div>
                  {/* Detailed subcounts */}
                  <div className="flex items-center gap-3 text-[9px] font-sans font-bold text-ink/40 uppercase tracking-widest">
                    <span>Todo: {dept.todo_tasks}</span>
                    <span>•</span>
                    <span>In Progress: {dept.in_progress_tasks}</span>
                    <span>•</span>
                    <span>In Review: {dept.review_tasks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid: 3 columns bottom (Leaderboard, Overdue, Bottlenecks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Productivity Leaderboard */}
        <div className="parchment-card p-6">
          <h3 className="font-display font-bold text-base text-burgundy mb-4 border-b border-ink/5 pb-3 flex items-center gap-2">
            <Award size={16} />
            <span>Productivity Leaderboard</span>
          </h3>

          {productivity.length === 0 ? (
            <p className="text-xs text-ink/30 italic py-8 text-center">No tasks completed yet.</p>
          ) : (
            <div className="space-y-3.5">
              {productivity.map((item, index) => (
                <div key={item.crew_member_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold font-sans ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-150 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-[#FAF7F2] text-ink/65 border border-ink/5'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-ink">{item.name}</span>
                  </div>
                  <span className="font-sans font-extrabold bg-burgundy/5 text-burgundy border border-burgundy/10 px-2 py-0.5 rounded-full text-[10px]">
                    {item.completed_count} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="parchment-card p-6">
          <h3 className="font-display font-bold text-base text-burgundy mb-4 border-b border-ink/5 pb-3 flex items-center gap-2">
            <AlertOctagon size={16} />
            <span>Overdue Tasks</span>
          </h3>

          {overdue.length === 0 ? (
            <p className="text-xs text-green-600 font-bold py-8 text-center">Zero overdue tasks! Excellent work.</p>
          ) : (
            <div className="space-y-3">
              {overdue.map((task) => (
                <Link 
                  key={task.id} 
                  href={`/round-table/tasks?task=${task.id}`}
                  className="block p-3 bg-red-50/30 border border-red-100 hover:bg-red-50/50 rounded-xl transition-all space-y-1.5"
                >
                  <p className="text-xs font-bold text-ink truncate">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <span className="text-[9px] font-sans font-bold text-red-500">
                      Due {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Review Bottlenecks */}
        <div className="parchment-card p-6">
          <h3 className="font-display font-bold text-base text-burgundy mb-4 border-b border-ink/5 pb-3 flex items-center gap-2">
            <Timer size={16} />
            <span>Review Bottlenecks</span>
          </h3>

          {bottlenecks.length === 0 ? (
            <p className="text-xs text-ink/30 italic py-8 text-center">No tasks currently awaiting review.</p>
          ) : (
            <div className="space-y-3">
              {bottlenecks.map((task) => (
                <Link 
                  key={task.id} 
                  href={`/round-table/tasks?task=${task.id}`}
                  className="block p-3 bg-yellow-50/30 border border-yellow-100 hover:bg-yellow-50/50 rounded-xl transition-all space-y-1.5"
                >
                  <p className="text-xs font-bold text-ink truncate">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-sans font-bold text-ink/50">
                      Dept: {task.department_name}
                    </span>
                    <span className="text-[9px] font-sans font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FEF3C7]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {Math.ceil(task.days_in_review)} days stuck
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
