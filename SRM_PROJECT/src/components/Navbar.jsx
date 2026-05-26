import { Bell, Menu, Search } from 'lucide-react';
import { Button } from './Button.jsx';
import ThemeToggle from '../../Theme.jsx';

export function Navbar({ title, onMenu }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_1px_12px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 dark:bg-slate-950/95 dark:border-slate-800/80 dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
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

        <div className="relative">
          <Button variant="ghost" className="h-11 w-11 p-0 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
          </span>
        </div>
      </div>
    </header>
  );
}
