import { Bell, Menu, Search, UserCircle } from 'lucide-react';
import { Button } from './Button.jsx';

export function Navbar({ title, onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-9 w-9 p-0 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-slate-950">{title}</h1>
          <p className="hidden text-xs text-slate-500 sm:block">Supplier relationship management</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden w-64 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
          <Search className="h-4 w-4" />
          Search suppliers, RFQs, POs
        </div>
        <Button variant="ghost" className="h-15 w-15 p-4" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        
        </Button>
        <Button variant="ghost" className="h-15 w-15 p-4" aria-label="User profile">
          <UserCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
