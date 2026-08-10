'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/me/notifications?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // poll every 45s

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await fetch('/api/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAll: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-[#FAF7F2] hover:text-[#C96A42] hover:bg-[#5C1A2E]/20 transition-all cursor-pointer focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C96A42] text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#20070E] border border-[#F2A98A]/25 shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 bg-[#330A17] border-b border-[#F2A98A]/15 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#F2A98A] hover:text-white underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#F2A98A]/10">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#FAF7F2]/60 italic">
                No notifications yet. Enjoy the quiet reading room!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 transition-colors ${n.is_read ? 'bg-[#20070E]/60 opacity-75' : 'bg-[#330A17]/80'}`}
                >
                  <Link
                    href={n.link || '/village'}
                    onClick={() => setIsOpen(false)}
                    className="block group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#FAF7F2] group-hover:text-[#F2A98A] transition-colors">
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#C96A42] flex-shrink-0 mt-1" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-[11px] text-[#FAF7F2]/75 mt-1 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    )}
                    <span className="text-[9px] text-[#F2A98A]/60 block mt-2 font-mono">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
