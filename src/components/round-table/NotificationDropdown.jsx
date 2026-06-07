import Link from 'next/link';
import { Bell, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown({ notifications, onMarkAllRead, onClose }) {
  const getIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquare className="text-blue-500" size={16} />;
      case 'comment_added':
        return <MessageSquare className="text-green-500" size={16} />;
      case 'review_requested':
        return <AlertCircle className="text-yellow-500" size={16} />;
      default:
        return <Bell className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="flex flex-col max-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-ink/5 bg-cream/30">
        <span className="font-sans font-extrabold text-xs text-ink uppercase tracking-wider">Recent Notifications</span>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={onMarkAllRead}
            className="text-[10px] text-burgundy hover:underline font-bold tracking-wide cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-ink/5 max-h-[280px] scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Bell size={24} className="text-ink/20 mb-2" />
            <p className="text-xs text-ink/40 font-bold font-sans">All caught up! No alerts.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link || '/round-table'}
              onClick={onClose}
              className={`flex items-start gap-3 p-3 transition-colors hover:bg-cream/40 ${
                !n.is_read ? 'bg-burgundy/5' : ''
              }`}
            >
              <div className="p-1.5 bg-white rounded-lg border border-ink/5 shadow-sm mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink leading-tight truncate">{n.title}</p>
                {n.body && <p className="text-[10px] text-ink/60 mt-0.5 line-clamp-2">{n.body}</p>}
                <span className="text-[9px] text-ink/40 font-bold block mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              {!n.is_read && (
                <div className="h-2 w-2 bg-burgundy rounded-full mt-2 flex-shrink-0" />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
