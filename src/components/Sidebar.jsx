import { NavLink } from 'react-router-dom';
import { PackageCheck, X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Sidebar({ items, title, subtitle, isOpen, onClose }) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-slate-200 bg-white transition lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <PackageCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">{title}</p>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <Button variant="ghost" className="h-9 w-9 p-0 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
          Enterprise SRM Workspace
        </div>
      </aside>
    </>
  );
}
