import { Link } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';

export function AuthCard({ title, subtitle, mode }) {
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <form className="space-y-4">
          {isRegister ? (
            <FormField label="Company name">
              <input className={inputClass} placeholder="Northwind Manufacturing" />
            </FormField>
          ) : null}
          <FormField label="Email">
            <input className={inputClass} type="email" placeholder="name@company.com" />
          </FormField>
          {!isForgot ? (
            <FormField label="Password">
              <input className={inputClass} type="password" placeholder="Enter password" />
            </FormField>
          ) : null}
          {isRegister ? (
            <FormField label="Role">
              <select className={inputClass}>
                <option>Supplier</option>
                <option>Procurement Admin</option>
              </select>
            </FormField>
          ) : null}
          <Button className="w-full">{isForgot ? 'Send reset link' : isRegister ? 'Create account' : 'Sign in'}</Button>
        </form>
        <div className="mt-5 flex items-center justify-between text-sm">
          <Link className="font-semibold text-brand-700" to="/login">
            Login
          </Link>
          <Link className="font-semibold text-brand-700" to={isRegister ? '/forgot-password' : '/register'}>
            {isRegister ? 'Forgot password?' : 'Create account'}
          </Link>
        </div>
      </div>
    </main>
  );
}
