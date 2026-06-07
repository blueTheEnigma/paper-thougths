"use client";
import { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useSearchParams, useRouter } from 'next/navigation';
import KanbanColumn from '@/components/round-table/KanbanColumn';
import TaskDetailPanel from './TaskDetailPanel';
import { 
  Filter, Search, User, Megaphone, Plus, X, Loader2 
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }
];

export default function TaskBoard({ 
  initialTasks = [], 
  departments = [], 
  crewMembers = [], 
  currentCrewMember 
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active filters state
  const [filterDept, setFilterDept] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  
  // Selected task to show details modal
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Task creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newReviewDept, setNewReviewDept] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Sync initial tasks when prop changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Handle URL param 'task=id' to auto-open detailed panel
  useEffect(() => {
    const taskParam = searchParams.get('task');
    if (taskParam) {
      setSelectedTaskId(parseInt(taskParam));
    }
  }, [searchParams]);

  // Fetch updated tasks based on filters
  const fetchFilteredTasks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterDept) query.append('departmentId', filterDept);
      if (filterAssignee) query.append('assigneeId', filterAssignee);
      if (filterPriority) query.append('priority', filterPriority);

      const res = await fetch(`/api/round-table/tasks?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredTasks();
  }, [filterDept, filterAssignee, filterPriority]);

  // Filter tasks locally by search term
  const getFilteredTasks = () => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter(t => 
      t.title.toLowerCase().includes(term) || 
      t.description?.toLowerCase().includes(term)
    );
  };

  // Group tasks by status/column
  const getColumnsTasks = () => {
    const filtered = getFilteredTasks();
    const columns = { todo: [], in_progress: [], review: [], done: [] };
    filtered.forEach(t => {
      if (columns[t.status]) {
        columns[t.status].push(t);
      }
    });
    // Sort columns by position
    Object.keys(columns).forEach(key => {
      columns[key].sort((a, b) => a.position - b.position);
    });
    return columns;
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside or no movement
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const draggedId = parseInt(draggableId);
    const oldStatus = source.droppableId;
    const newStatus = destination.droppableId;

    // 1. Locally update task statuses and positions
    const columnsTasks = getColumnsTasks();
    const sourceCol = [...columnsTasks[oldStatus]];
    const destCol = oldStatus === newStatus ? sourceCol : [...columnsTasks[newStatus]];

    const [draggedTask] = sourceCol.splice(source.index, 1);
    draggedTask.status = newStatus;
    destCol.splice(destination.index, 0, draggedTask);

    // Re-calculate positions in affected columns
    const updatedTasks = [];
    
    sourceCol.forEach((t, i) => {
      t.position = i + 1;
      updatedTasks.push({ id: t.id, status: oldStatus, position: t.position });
    });

    if (oldStatus !== newStatus) {
      destCol.forEach((t, i) => {
        t.position = i + 1;
        updatedTasks.push({ id: t.id, status: newStatus, position: t.position });
      });
    }

    // Immediately update local state
    setTasks(prev => {
      return prev.map(t => {
        const update = updatedTasks.find(u => u.id === t.id);
        if (update) {
          return { ...t, status: update.status, position: update.position };
        }
        return t;
      });
    });

    // 2. Persist to API
    try {
      await fetch('/api/round-table/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: updatedTasks,
          draggedTaskId: draggedId,
          oldStatus,
          newStatus
        })
      });
    } catch (err) {
      console.error("Failed to persist order updates:", err);
      // Reload on failure to sync
      fetchFilteredTasks();
    }
  };

  const handleQuickAdd = async (columnId, title) => {
    const res = await fetch('/api/round-table/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        status: columnId
      })
    });
    const data = await res.json();
    if (data.success) {
      fetchFilteredTasks();
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreateLoading(true);
    try {
      const res = await fetch('/api/round-table/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          departmentId: newDept ? parseInt(newDept) : null,
          reviewDepartmentId: newReviewDept ? parseInt(newReviewDept) : null,
          priority: newPriority,
          dueDate: newDueDate || null,
          status: 'todo'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewDesc('');
        setNewDept('');
        setNewReviewDept('');
        setNewPriority('medium');
        setNewDueDate('');
        setShowCreateModal(false);
        fetchFilteredTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCloseDetailPanel = () => {
    setSelectedTaskId(null);
    // Remove query parameter cleanly from URL
    const params = new URLSearchParams(searchParams);
    params.delete('task');
    router.replace(`/round-table/tasks?${params.toString()}`);
  };

  const columnsTasks = getColumnsTasks();

  return (
    <div className="space-y-6">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/5 pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-burgundy tracking-tight">Task Board</h1>
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50 mt-0.5">
            Coordinate tasks and cross-department approvals
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-burgundy hover:bg-ink text-cream text-xs px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer w-fit"
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-ink/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Dept Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-ink/5 shadow-sm">
            <Megaphone size={12} className="text-ink/40" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-transparent text-xs font-bold font-sans text-ink/75 focus:outline-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-ink/5 shadow-sm">
            <User size={12} className="text-ink/40" />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="bg-transparent text-xs font-bold font-sans text-ink/75 focus:outline-none cursor-pointer"
            >
              <option value="">All Assignees</option>
              {crewMembers.map(m => (
                <option key={m.crew_member_id} value={m.crew_member_id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-ink/5 shadow-sm">
            <Filter size={12} className="text-ink/40" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-xs font-bold font-sans text-ink/75 focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-ink/5 rounded-xl pl-9 pr-4 py-2 text-xs font-sans text-ink focus:outline-none focus:border-burgundy shadow-sm"
          />
        </div>
      </div>

      {/* Kanban Board columns area */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-burgundy" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={columnsTasks[col.id] || []}
                onTaskClick={(t) => setSelectedTaskId(t.id)}
                onQuickAdd={handleQuickAdd}
                currentCrewMember={currentCrewMember}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Slide-over Task detail panel */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={handleCloseDetailPanel}
          onUpdate={fetchFilteredTasks}
          departments={departments}
          crewMembers={crewMembers}
          currentCrewMember={currentCrewMember}
        />
      )}

      {/* Create Task Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-ink/5 m-4 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <h3 className="font-display font-black text-lg text-burgundy">New Kanban Task</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-ink/5 rounded-lg text-ink/50 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Title</label>
                <input
                  type="text"
                  required
                  disabled={createLoading}
                  placeholder="Task heading..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Description</label>
                <textarea
                  disabled={createLoading}
                  placeholder="Detailed instructions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Dept Owner</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy"
                  >
                    <option value="">No Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Review Dept</label>
                  <select
                    value={newReviewDept}
                    onChange={(e) => setNewReviewDept(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy"
                  >
                    <option value="">No Review</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-ink/5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-ink/65 hover:text-ink px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newTitle.trim()}
                  className="bg-burgundy text-cream font-sans font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded-xl hover:bg-ink transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {createLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
