"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, CheckSquare, Users, BarChart3, 
  History, Bell, ChevronLeft, ChevronRight, ShieldCheck,
  BookOpen
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import NotificationDropdown from './NotificationDropdown';

export default function Sidebar({ crewMember }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const isAdmin = crewMember?.isSuperadmin || crewMember?.role === 'admin';

  // Navigation Links
  const navLinks = [
    { name: "Dashboard", href: "/round-table", icon: LayoutDashboard },
    { name: "Task Board", href: "/round-table/tasks", icon: CheckSquare },
    { name: "Crew Roster", href: "/round-table/crew", icon: Users },
    { name: "Analytics", href: "/round-table/analytics", icon: BarChart3 },
    { name: "Activity Log", href: "/round-table/activity", icon: History },
  ];

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/round-table/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    if (crewMember) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [crewMember]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/round-table/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read_all' })
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const isActive = (href) => {
    if (href === '/round-table') return pathname === '/round-table';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* 1. Desktop Sidebar (Hidden on mobile) */}
      <aside 
        className={`hidden md:flex flex-col h-screen fixed left-0 top-0 z-30 bg-[#1A0F0A] text-[#F5E6D8] border-r border-[#2C1A0E]/30 transition-sidebar ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Header Logo */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/5">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/10">
                <BookOpen className="text-[#F2A98A]" size={20} />
              </div>
              <span className="font-display font-bold text-sm tracking-widest uppercase text-[#F5E6D8]">Round Table</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="mx-auto">
              <BookOpen className="text-[#F2A98A]" size={24} />
            </Link>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[#F5E6D8]/60 hover:text-[#F5E6D8] transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                  active 
                    ? 'bg-[#3D2518] text-[#FAF7F2] shadow-sm border border-white/5' 
                    : 'text-[#F5E6D8]/70 hover:bg-[#3D2518]/40 hover:text-[#F5E6D8]'
                }`}
                title={isCollapsed ? link.name : undefined}
              >
                <link.icon size={18} className={active ? 'text-[#F2A98A]' : ''} />
                {!isCollapsed && <span>{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-white/5 space-y-3">
          {/* Notification Bell (Desktop) */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left hover:bg-white/5 text-[#F5E6D8]/80 hover:text-[#F5E6D8] transition-colors cursor-pointer"
            >
              <div className="relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && <span className="font-bold text-xs uppercase tracking-wider">Notifications</span>}
            </button>

            {/* Notification Dropdown Container */}
            {showNotifications && (
              <div className={`absolute bottom-12 left-2 w-80 bg-white text-ink rounded-2xl shadow-2xl border border-ink/10 overflow-hidden z-50`}>
                <NotificationDropdown 
                  notifications={notifications} 
                  onMarkAllRead={markAllAsRead} 
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            )}
          </div>

          {/* Toggle to Admin Panel */}
          {isAdmin && (
            <Link 
              href="/admin"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#C96A42] hover:bg-accent/10 transition-colors border border-[#C96A42]/10"
              title={isCollapsed ? "Admin Control" : undefined}
            >
              <ShieldCheck size={18} />
              {!isCollapsed && <span className="font-bold text-xs uppercase tracking-wider">Admin Control</span>}
            </Link>
          )}

          {/* User Profile Info */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-1.5 bg-white/5 rounded-2xl border border-white/5`}>
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              {!isCollapsed && (
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs text-[#F5E6D8] truncate max-w-[120px]">{user?.firstName || 'Crew Member'}</span>
                  <span className="text-[9px] text-[#F5E6D8]/50 uppercase tracking-widest font-bold">
                    {crewMember?.role || 'member'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Bottom Navigation Pill (Hidden on desktop) */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] bg-[#1A0F0A] text-[#F5E6D8]/80 border border-white/10 rounded-2xl shadow-2xl py-1.5 px-2 flex justify-around items-center">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                active ? "text-[#F2A98A] scale-105" : "text-[#F5E6D8]/50"
              }`}
            >
              <link.icon size={18} className={active ? "stroke-[2.2px]" : "stroke-[1.8px]"} />
              <span className="text-[8px] font-sans font-bold mt-1 tracking-wider uppercase">{link.name.split(' ')[0]}</span>
            </Link>
          );
        })}
        
        {/* Mobile Notification Button */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-[#F5E6D8]/50 relative"
          >
            <div className="relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[8px] font-sans font-bold mt-1 tracking-wider uppercase">Alerts</span>
          </button>
          
          {showNotifications && (
            <div className="absolute bottom-14 -right-12 w-72 bg-white text-ink rounded-2xl shadow-2xl border border-ink/10 overflow-hidden z-50">
              <NotificationDropdown 
                notifications={notifications} 
                onMarkAllRead={markAllAsRead} 
                onClose={() => setShowNotifications(false)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
