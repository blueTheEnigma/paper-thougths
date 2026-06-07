"use client";
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MessageSquare, Paperclip, AlertTriangle } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import DepartmentBadge from './DepartmentBadge';

export default function TaskCard({ task, index, onClick, currentCrewMember }) {
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const showReviewWarning = task.status === 'review' && task.review_department_id && 
    currentCrewMember?.departments.some(d => d.id === task.review_department_id);

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:border-burgundy/20 select-none group relative overflow-hidden ${
            snapshot.isDragging ? 'shadow-xl scale-[1.02] border-burgundy/30' : 'border-ink/5'
          }`}
        >
          {/* Priority indicator top band */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            task.priority === 'urgent' ? 'bg-[#DC2626]' :
            task.priority === 'high' ? 'bg-[#F59E0B]' :
            task.priority === 'medium' ? 'bg-[#3B82F6]' : 'bg-[#9CA3AF]'
          }`} />

          {/* Review Banner if applicable */}
          {showReviewWarning && (
            <div className="mb-3 -mt-2 -mx-4 px-4 py-1.5 bg-[#FEF3C7] text-[#92400E] text-[10px] font-sans font-bold flex items-center gap-1.5 border-b border-[#FEF3C7]/20 uppercase tracking-wide">
              <AlertTriangle size={12} className="stroke-[2.5px]" />
              <span>Awaiting review from your department</span>
            </div>
          )}

          <h4 className="text-xs font-bold text-ink leading-snug group-hover:text-burgundy transition-colors line-clamp-2">
            {task.title}
          </h4>

          {/* Department badge and labels */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {task.department_name && (
              <DepartmentBadge name={task.department_name} size="sm" />
            )}
            
            {task.labels && task.labels.map(l => (
              <span 
                key={l.id} 
                className="text-[8px] font-sans font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border"
                style={{ 
                  backgroundColor: `${l.color}10`, 
                  color: l.color, 
                  borderColor: `${l.color}20` 
                }}
              >
                {l.name}
              </span>
            ))}
          </div>

          {/* Meta section: assignees and indicators */}
          <div className="flex items-center justify-between mt-4 border-t border-ink/5 pt-3">
            {/* Due date and warning */}
            <div className="flex items-center gap-1.5">
              {task.due_date ? (
                <div className={`flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-wider ${
                  isOverdue ? 'text-red-500 font-extrabold' : 'text-ink/40'
                }`}>
                  <Calendar size={10} />
                  <span>
                    {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ) : (
                <div className="text-[9px] font-sans font-bold text-ink/30 uppercase tracking-widest">
                  No date
                </div>
              )}
            </div>

            {/* Comment/Attachment stats */}
            <div className="flex items-center gap-2.5 text-ink/30">
              {task.comment_count > 0 && (
                <div className="flex items-center gap-0.5 text-[9px] font-sans font-bold">
                  <MessageSquare size={10} />
                  <span>{task.comment_count}</span>
                </div>
              )}
              {task.attachment_count > 0 && (
                <div className="flex items-center gap-0.5 text-[9px] font-sans font-bold">
                  <Paperclip size={10} />
                  <span>{task.attachment_count}</span>
                </div>
              )}
            </div>

            {/* Assignees avatars list */}
            <div className="flex -space-x-1.5 overflow-hidden">
              {task.assignees && task.assignees.slice(0, 3).map((a) => (
                <div 
                  key={a.id} 
                  className="h-5 w-5 rounded-full border border-white bg-burgundy/10 text-burgundy flex items-center justify-center text-[8px] font-sans font-black shadow-sm"
                  title={a.name}
                >
                  {getInitials(a.name)}
                </div>
              ))}
              {task.assignees && task.assignees.length > 3 && (
                <div className="h-5 w-5 rounded-full border border-white bg-ink/5 text-ink/65 flex items-center justify-center text-[7px] font-sans font-black shadow-sm">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
