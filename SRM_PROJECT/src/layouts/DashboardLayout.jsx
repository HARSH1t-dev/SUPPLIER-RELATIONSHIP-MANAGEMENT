import { useLocation } from 'react-router-dom';
import { useDisclosure } from '../hooks/useDisclosure.js';
import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { ToastContainer } from '../components/ToastNotification.jsx';

export function DashboardLayout({ items, title, subtitle, children }) {
  const menu = useDisclosure(false);
  const location = useLocation();
  const flatItems = items.flatMap((item) => item.items || [item]);
  const current = items.find(
    (item) => item.to === location.pathname || (item.end !== true && location.pathname.startsWith(item.to)),
  ) || flatItems.find(
    (item) => item.to === location.pathname || (item.end !== true && location.pathname.startsWith(item.to)),
  );

  const isAdmin = subtitle?.toLowerCase().includes('admin');
  const ambientGlow = isAdmin
    ? 'bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(59,130,246,0.08),rgba(99,102,241,0.03),transparent)]'
    : 'bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(16,185,129,0.08),rgba(20,184,166,0.03),transparent)]';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Subtle ambient gradient behind the content area */}
      <div className={`pointer-events-none fixed inset-0 z-0 ${ambientGlow}`} />
      <Sidebar items={items} title={title} subtitle={subtitle} isOpen={menu.isOpen} onClose={menu.close} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <Navbar title={current?.label || title} onMenu={menu.open} />
        <main id="main-scroll" className="flex-1 overflow-y-auto page-enter mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 custom-scrollbar">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
