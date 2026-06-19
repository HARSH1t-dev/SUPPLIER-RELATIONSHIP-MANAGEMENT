import { useLocation } from 'react-router-dom';
import { useDisclosure } from '../hooks/useDisclosure.js';
import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';

export function DashboardLayout({ items, title, subtitle, children }) {
  const menu = useDisclosure(false);
  const location = useLocation();
  const current = items.find((item) => item.to === location.pathname || (item.end !== true && location.pathname.startsWith(item.to)));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={items} title={title} subtitle={subtitle} isOpen={menu.isOpen} onClose={menu.close} />
      <div className="min-w-0 flex-1">
        <Navbar title={current?.label || title} onMenu={menu.open} />
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
