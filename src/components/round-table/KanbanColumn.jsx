"use client";
import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus, X, Loader2 } from 'lucide-react';

export default function KanbanColumn({ 
  id, 
  title, 
  tasks = [], 
  onTaskClick, 
  onQuickAdd,
  currentCrewMember
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setLoading(true);
    try {
      await onQuickAdd(id, taskTitle);
      setTaskTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getColColor = (colId) => {
    switch (colId) {
      case 'todo':
        return 'border-t-gray-400 bg-gray-50/20';
      case 'in_progress':
        return 'border-t-blue-400 bg-blue-50/10';
      case 'review':
        return 'border-t-yellow-500 bg-yellow-50/10';
      case 'done':
        return 'border-t-green-500 bg-green-50/10';
      default:
        return 'border-t-ink/20';
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-14rem)] w-72 rounded-2xl border border-ink/5 border-t-[3px] p-3 shadow-inner ${getColColor(id)}`}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-xs text-ink uppercase tracking-wider">{title}</span>
          <span className="bg-ink/5 text-ink/60 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-ink/5">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable Container */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto pr-1 -mr-1 kanban-scroll space-y-3 pb-4 ${
              snapshot.isDraggingOver ? 'bg-cream/40 rounded-xl' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
                currentCrewMember={currentCrewMember}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Inline Quick Add Task */}
      <div className="mt-2.5">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="bg-white p-3 border border-ink/5 rounded-2xl shadow-sm space-y-2">
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Enter task title..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs font-sans text-ink focus:outline-none focus:border-burgundy"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1.5 hover:bg-ink/5 rounded-lg text-ink/50 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
              <button
                type="submit"
                disabled={loading || !taskTitle.trim()}
                className="bg-burgundy text-cream text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-ink transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                <span>Add</span>
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-ink/15 hover:border-burgundy/30 text-ink/40 hover:text-burgundy text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-white/40 cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
}
