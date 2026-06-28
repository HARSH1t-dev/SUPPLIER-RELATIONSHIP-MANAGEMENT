import { Link, Outlet } from 'react-router-dom';
import { PackageCheck } from 'lucide-react';
import { Button } from '../components/Button.jsx';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <PackageCheck className="h-5 w-5" />
            </span>
            <span className="font-bold text-slate-950">SRM Portal</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
