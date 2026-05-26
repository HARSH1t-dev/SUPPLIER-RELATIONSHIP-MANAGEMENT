import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, PackageCheck, ShieldCheck, Truck, UserCircle, X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Sidebar({ items, title, subtitle, isOpen, onClose }) {
  const navigate = useNavigate();
  const isAdmin = subtitle?.toLowerCase().includes('admin');
  const RoleIcon = isAdmin ? ShieldCheck : Truck;
  const roleBadgeClass = isAdmin
    ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
    : 'bg-violet-50 text-violet-700 ring-violet-600/20';

  const currentUser = (() => {
    try {
      const stored = sessionStorage.getItem('srm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isRoleMatch = currentUser?.role === (isAdmin ? 'admin' : 'supplier');
  const userName = isRoleMatch && currentUser?.fullName ? currentUser.fullName : (isAdmin ? 'Admin User' : 'Supplier User');
  const userSubtext = isAdmin ? 'Super Admin' : (isRoleMatch && currentUser?.companyName ? currentUser.companyName : 'Apex Industrial Components');
  const sidebarClass = isAdmin
    ? 'border-blue-950/20 bg-[#06265a] text-white shadow-[4px_0_28px_rgba(2,6,23,0.18)]'
    : 'border-emerald-950/20 bg-[#046044] text-white shadow-[4px_0_28px_rgba(2,6,23,0.16)]';
  const activeClass = isAdmin
    ? 'bg-blue-600 text-white shadow-[inset_3px_0_0_0] shadow-white/80'
    : 'bg-emerald-500 text-white shadow-[inset_3px_0_0_0] shadow-white/80';

  const renderLink = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) =>
        `sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
          isActive ? activeClass : 'text-white/82 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {!item.end ? <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg] text-white/45" /> : null}
    </NavLink>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarClass} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 text-white shadow-sm ring-1 ring-white/15">
              {isAdmin ? <PackageCheck className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-white/58">{subtitle}</p>
            </div>
          </div>
          <Button variant="ghost" className="h-9 w-9 p-0 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleBadgeClass}`}>
            <RoleIcon className="h-3 w-3" />
            {isAdmin ? 'Admin Console' : 'Supplier Workspace'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {items.map((item) =>
            item.items ? (
              <div key={item.section}>
                <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-white/48">{item.section}</p>
                <div className="space-y-0.5">{item.items.map(renderLink)}</div>
              </div>
            ) : (
              renderLink(item)
            ),
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/86 text-slate-700">
              <UserCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-white/58">{userSubtext}</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('srm_user');
                navigate('/login');
              }}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
