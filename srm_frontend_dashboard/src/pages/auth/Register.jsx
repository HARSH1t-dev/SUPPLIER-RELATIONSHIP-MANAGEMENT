import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, HelpCircle, Layers3, Mail, ShieldCheck, Truck, UserPlus } from 'lucide-react';

const roles = {
  supplier: {
    title: 'Supplier Registration',
    label: 'Supplier',
    description: 'Create a supplier workspace for bids, orders, deliveries, and profile management.',
    cta: 'Create Supplier Account',
    to: '/supplier',
    icon: Truck,
    accent: 'text-violet-600',
    button: 'from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700',
    panel: 'from-violet-50 to-white',
  },
  admin: {
    title: 'Admin Registration',
    label: 'Admin',
    description: 'Create an admin workspace for supplier management, RFQs, bids, orders, and reports.',
    cta: 'Create Admin Account',
    to: '/admin',
    icon: ShieldCheck,
    accent: 'text-blue-600',
    button: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
    panel: 'from-blue-50 to-white',
  },
};

function BrandMark() {
  return (
    <Link to="/login" className="inline-flex items-center gap-3 text-slate-950">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
        <Layers3 className="h-5 w-5" />
      </span>
      <span className="text-xl font-bold">SRM</span>
    </Link>
  );
}

function RoleOption({ role, selected, onSelect }) {
  const item = roles[role];
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`auth-enter glass-sheen rounded-lg border bg-white/42 p-5 text-left shadow-[0_16px_50px_rgba(15,23,42,0.09)] backdrop-blur-2xl transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:bg-white/58 ${
        selected ? 'border-blue-300 bg-white/62 ring-4 ring-blue-100/70' : 'border-white/55'
      }`}
    >
      <span className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Icon className={`h-7 w-7 ${item.accent}`} />
        </span>
        <span>
          <span className="block text-lg font-bold text-slate-950">{item.label}</span>
          <span className="mt-1 block text-sm leading-5 text-slate-500">{item.description}</span>
        </span>
      </span>
    </button>
  );
}

function RegistrationForm({ role, onBack }) {
  const item = roles[role];
  const Icon = item.icon;

  return (
    <div className="auth-enter glass-sheen grid overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/36 shadow-[0_30px_110px_rgba(15,23,42,0.16)] backdrop-blur-2xl lg:grid-cols-[0.92fr_1.08fr]">
      <aside className={`relative min-h-[34rem] bg-gradient-to-br ${item.panel} p-8 backdrop-blur-xl sm:p-12`}>
        <BrandMark />
        <div className="mt-16 max-w-sm">
          <h1 className="text-3xl font-bold text-slate-950">{item.title}</h1>
          <p className="mt-5 text-base leading-7 text-slate-600">{item.description}</p>
          <div className="mt-7 flex gap-2">
            <span className={`h-1.5 w-10 rounded-full ${role === 'supplier' ? 'bg-violet-600' : 'bg-blue-600'}`} />
            <span className="h-1.5 w-8 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="auth-float relative mx-auto mt-12 flex h-52 max-w-sm items-center justify-center">
          <div className="auth-pulse absolute h-44 w-44 rounded-[2rem] bg-white/70 shadow-[0_28px_80px_rgba(37,99,235,0.18)] ring-1 ring-white/80" />
          <Icon className={`relative h-24 w-24 ${item.accent} transition duration-500 hover:scale-105`} strokeWidth={1.6} />
        </div>
      </aside>

      <section className="flex min-h-[34rem] flex-col justify-center bg-white/44 p-8 backdrop-blur-xl sm:p-12">
        <button type="button" onClick={onBack} className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Change account type
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Create your account</h2>
          <p className="mt-2 text-sm text-slate-500">Registration opens the matching portal for your role.</p>
        </div>
        <form className="mt-9 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Company name</span>
            <span className="mt-2 flex items-center gap-3 rounded-lg border border-white/60 bg-white/46 px-4 py-3.5 text-slate-400 shadow-sm backdrop-blur-xl transition focus-within:border-blue-300 focus-within:bg-white/70 focus-within:ring-4 focus-within:ring-blue-100/70">
              <Building2 className="h-5 w-5" />
              <input className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder="Northwind Manufacturing" />
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Email address</span>
            <span className="mt-2 flex items-center gap-3 rounded-lg border border-white/60 bg-white/46 px-4 py-3.5 text-slate-400 shadow-sm backdrop-blur-xl transition focus-within:border-blue-300 focus-within:bg-white/70 focus-within:ring-4 focus-within:ring-blue-100/70">
              <Mail className="h-5 w-5" />
              <input className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" type="email" placeholder="name@company.com" />
            </span>
          </label>
          <Link
            to={item.to}
            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-4 py-3.5 text-sm font-bold text-white shadow-[0_18px_35px_rgba(37,99,235,0.20)] transition ${item.button}`}
          >
            {item.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </form>
      </section>
    </div>
  );
}

export function Register() {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf6ff] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.26),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(96,165,250,0.30),transparent_30%),linear-gradient(135deg,rgba(239,246,255,0.88),rgba(255,255,255,0.58)_42%,rgba(238,242,255,0.72))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900">Back to login</Link>
          <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
            <HelpCircle className="h-5 w-5" />
            Need help?
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          {!selectedRole ? (
            <div className="auth-enter glass-sheen w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/34 p-8 shadow-[0_32px_120px_rgba(37,99,235,0.16)] backdrop-blur-2xl sm:p-12">
              <BrandMark />
              <div className="mt-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                <div>
                  <h1 className="text-4xl font-bold text-slate-950">Create your SRM account</h1>
                  <p className="mt-5 text-lg leading-8 text-slate-600">Choose the role first. After registration, the correct portal and features open automatically.</p>
                  <p className="mt-8 text-sm text-slate-500">
                    Already registered? <Link to="/login" className="font-bold text-blue-600">Sign in</Link>
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="auth-enter auth-enter-delay-1">
                    <RoleOption role="supplier" selected={selectedRole === 'supplier'} onSelect={setSelectedRole} />
                  </div>
                  <div className="auth-enter auth-enter-delay-2">
                    <RoleOption role="admin" selected={selectedRole === 'admin'} onSelect={setSelectedRole} />
                  </div>
                </div>
              </div>
              <div className="mt-10 border-t border-white/80 pt-6 text-center text-sm text-slate-500">
                Role-specific features are shown only after you enter the selected portal.
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl">
              <RegistrationForm role={selectedRole} onBack={() => setSelectedRole(null)} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
