import { useLocation } from 'react-router-dom';
import { useDisclosure } from '../hooks/useDisclosure.js';
import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';

export function DashboardLayout({ items, title, subtitle, children }) {
  const menu = useDisclosure(false);
  const location = useLocation();
  const flatItems = items.flatMap((item) => item.items || [item]);
  const current = items.find(
    (item) => item.to === location.pathname || (item.end !== true && location.pathname.startsWith(item.to)),
  ) || flatItems.find(
    (item) => item.to === location.pathname || (item.end !== true && location.pathname.startsWith(item.to)),
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Subtle ambient gradient behind the content area */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(37,99,235,0.05),transparent)]" />
      <Sidebar items={items} title={title} subtitle={subtitle} isOpen={menu.isOpen} onClose={menu.close} />
      <div className="relative z-10 min-w-0 flex-1">
        <Navbar title={current?.label || title} onMenu={menu.open} />
        <main className="page-enter mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
