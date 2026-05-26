import { Link } from 'react-router-dom';
import { Button } from '../components/Button.jsx';

export function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-semibold text-brand-700">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">The workspace route you requested does not exist.</p>
        <Link className="mt-6 inline-flex" to="/">
          <Button>Return home</Button>
        </Link>
      </div>
    </main>
  );
}
