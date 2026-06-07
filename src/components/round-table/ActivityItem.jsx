import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { 
  PlusCircle, ArrowRightLeft, MessageSquare, 
  Paperclip, UserPlus, HelpCircle 
} from 'lucide-react';

export default function ActivityItem({ activity }) {
  const getActionIcon = (action) => {
    switch (action) {
      case 'task_created':
        return <PlusCircle className="text-green-500" size={14} />;
      case 'status_changed':
        return <ArrowRightLeft className="text-blue-500" size={14} />;
      case 'comment_added':
        return <MessageSquare className="text-purple-500" size={14} />;
      case 'attachment_uploaded':
        return <Paperclip className="text-orange-500" size={14} />;
      case 'member_added':
      case 'member_promoted':
        return <UserPlus className="text-teal-500" size={14} />;
      default:
        return <HelpCircle className="text-gray-500" size={14} />;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getActionText = () => {
    const { action, metadata, entity_type } = activity;
    const from = metadata?.from ? `"${metadata.from}"` : '';
    const to = metadata?.to ? `"${metadata.to}"` : '';
    const taskTitle = metadata?.taskTitle ? `"${metadata.taskTitle}"` : `this ${entity_type}`;

    switch (action) {
      case 'task_created':
        return `created task ${taskTitle}`;
      case 'status_changed':
        return `moved task ${taskTitle} from ${from} to ${to}`;
      case 'comment_added':
        return `commented on ${taskTitle}`;
      case 'attachment_uploaded':
        return `uploaded an attachment to ${taskTitle}`;
      case 'member_added':
        return `added ${metadata?.name || 'a member'} to the crew`;
      case 'role_changed':
        return `changed ${metadata?.name || 'member'}'s role to ${metadata?.to || 'member'}`;
      default:
        return `${action.replace('_', ' ')} ${entity_type}`;
    }
  };

  const actorName = activity.full_name || 'Anonymous Crew';
  const initials = getInitials(actorName);
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
  
  // Link to task board or crew roster depending on entity
  const getLink = () => {
    if (activity.entity_type === 'task') {
      return `/round-table/tasks?task=${activity.entity_id}`;
    }
    if (activity.entity_type === 'member') {
      return `/round-table/crew`;
    }
    return `/round-table`;
  };

  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-ink/5 last:border-0">
      {/* Initials Avatar */}
      <div className="h-9 w-9 rounded-xl bg-burgundy/5 border border-burgundy/10 flex items-center justify-center text-burgundy font-display font-extrabold text-xs shadow-inner flex-shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink/80 leading-relaxed">
          <span className="font-extrabold text-ink">{actorName}</span>
          <span className="text-ink/65"> {getActionText()}</span>
        </p>
        
        <div className="flex items-center gap-2 mt-1.5">
          <span className="p-1 bg-[#FAF7F2] rounded-md border border-ink/5">
            {getActionIcon(activity.action)}
          </span>
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-ink/40">
            {timeAgo}
          </span>
          <span className="text-ink/20 text-[9px]">•</span>
          <Link 
            href={getLink()} 
            className="text-[9px] font-sans font-extrabold uppercase tracking-widest text-burgundy hover:underline"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
