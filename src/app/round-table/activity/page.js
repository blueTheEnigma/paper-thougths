"use client";
import { useState, useEffect } from 'react';
import { History, User, Filter, RefreshCw, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import ActivityItem from '@/components/round-table/ActivityItem';

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterActor, setFilterActor] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      // Fetch crew list for filters
      const crewRes = await fetch('/api/round-table/crew');
      const crewData = await crewRes.json();
      if (crewData.success) {
        setCrewMembers(crewData.crew);
      }

      // Fetch activity logs with filters and pagination
      const query = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      });
      if (filterActor) query.append('actorId', filterActor);
      if (filterAction) query.append('action', filterAction);
      if (filterEntity) query.append('entityType', filterEntity);

      const res = await fetch(`/api/round-table/activity?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, [filterActor, filterAction, filterEntity, offset]);

  // Reset pagination on filter change
  useEffect(() => {
    setOffset(0);
  }, [filterActor, filterAction, filterEntity]);

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(prev => prev + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset - limit >= 0) {
      setOffset(prev => prev - limit);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/5 pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-burgundy tracking-tight">Activity Log</h1>
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50 mt-0.5">
            Audit trail of crew tasks, modifications, and comments
          </p>
        </div>
        <button 
          onClick={fetchActivityData}
          className="p-2.5 bg-white border border-ink/5 hover:bg-cream/40 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} className="text-ink/65" />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-ink/5 flex flex-wrap items-center gap-4">
        {/* Actor Filter */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-ink/5 shadow-sm">
          <User size={12} className="text-ink/40" />
          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="bg-transparent text-xs font-bold font-sans text-ink/75 focus:outline-none cursor-pointer"
          >
            <option value="">All Actors</option>
            {crewMembers.map(m => (
              <option key={m.crew_member_id} value={m.crew_member_id}>{m.full_name}</option>
            ))}
          </select>
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-ink/5 shadow-sm">
          <Filter size={12} className="text-ink/40" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-transparent text-xs font-bold font-sans text-ink/75 focus:outline-none cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="task_created">Task Created</option>
            <option value="task_updated">Task Updated</option>
            <option value="status_changed">Status Changed</option>
            <option value="comment_added">Comment Added</option>
            <option value="attachment_uploaded">Attachment Uploaded</option>
            <option value="member_added">Member Promoted</option>
            <option value="role_changed">Role Updated</option>
          </select>
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-ink/5 shadow-sm">
          <History size={12} className="text-ink/40" />
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-transparent text-xs font-bold font-sans text-ink/75 focus:outline-none cursor-pointer"
          >
            <option value="">All Entities</option>
            <option value="task">Task</option>
            <option value="member">Crew Member</option>
          </select>
        </div>
      </div>

      {/* Roster Timeline list */}
      <div className="parchment-card p-6 min-h-[400px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-burgundy" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-ink/40">
            <History size={36} className="text-ink/10 mb-3" />
            <p className="text-xs font-bold font-sans">No matching activities found in the log.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/5">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {total > limit && (
        <div className="flex items-center justify-between text-xs font-sans px-2">
          <span className="font-bold text-ink/50">
            Showing {offset + 1} - {Math.min(offset + limit, total)} of {total} events
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={offset === 0 || loading}
              className="px-3 py-2 bg-white border border-ink/5 text-ink/75 hover:bg-cream/40 rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <ArrowLeft size={12} />
              <span>Prev</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={offset + limit >= total || loading}
              className="px-3 py-2 bg-white border border-ink/5 text-ink/75 hover:bg-cream/40 rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <span>Next</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
