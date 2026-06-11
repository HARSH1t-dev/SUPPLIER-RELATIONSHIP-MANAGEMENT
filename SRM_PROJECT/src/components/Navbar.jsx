import { Bell, Menu, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './Button.jsx';
import ThemeToggle from '../../Theme.jsx';
import { useState, useEffect } from 'react';
import { getNotifications, NOTIFICATION_EVENT } from '../utils/notificationStore.js';

function getSessionRole() {
  try {
    const user = JSON.parse(sessionStorage.getItem('srm_user') || '{}');
    return user?.role || 'admin';
  } catch {
    return 'admin';
  }
}

export function Navbar({ title, onMenu }) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const role = getSessionRole();
      const list = getNotifications(role);
      setUnreadCount(list.filter(n => n && !n.read && !n.is_read).length);
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener(NOTIFICATION_EVENT, updateCount);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener(NOTIFICATION_EVENT, updateCount);
    };
  }, []);

  const isAdmin = location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin');
  const notificationsLink = isAdmin ? '/admin/notifications' : '/supplier/notifications';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const navbarClasses = isAdmin
    ? 'dark:bg-slate-950/90 dark:border-blue-900/35 dark:shadow-[0_4px_20px_rgba(37,99,235,0.04)]'
    : 'dark:bg-slate-950/90 dark:border-emerald-900/35 dark:shadow-[0_4px_20px_rgba(16,185,129,0.03)]';

  return (
    <header className={`sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_1px_12px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 ${navbarClasses}`}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-9 w-9 p-0 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h1>
          <p className="hidden text-xs text-slate-400 dark:text-slate-500 sm:block">
            {greeting} &mdash; {dateStr}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-400 transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 md:flex dark:border-slate-800 dark:bg-slate-900/80 dark:focus-within:border-brand-500">
          <Search className="h-4 w-4 flex-shrink-0 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search suppliers, RFQs, POs…"
            className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white"
          />
        </div>
        
        <ThemeToggle />



        <Link to={notificationsLink} className="relative" title="Notifications">
          <Button variant="ghost" className="h-11 w-11 p-0 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
