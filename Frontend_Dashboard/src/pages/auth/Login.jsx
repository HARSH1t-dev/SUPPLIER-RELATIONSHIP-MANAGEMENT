import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Truck,
  User,
  UserPlus,
} from 'lucide-react';

const roles = {
  supplier: {
    title: 'Supplier Portal',
    shortTitle: 'Supplier',
    description: 'Manage bids, track orders and deliveries.',
    button: 'Sign in as Supplier',
    ctaClass: 'from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700',
    icon: Truck,
    accent: 'text-violet-600',
    glow: 'bg-violet-500/10',
    panel: 'from-violet-50 to-white',
    to: '/supplier',
  },
  admin: {
    title: 'Admin Access',
    shortTitle: 'Admin',
    description: 'Access the system dashboard and manage configurations.',
    button: 'Sign in as Admin',
    ctaClass: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
    icon: ShieldCheck,
    accent: 'text-blue-600',
    glow: 'bg-blue-500/10',
    panel: 'from-blue-50 to-white',
    to: '/admin',
  },
};

function BrandMark() {
  return (
    <Link to="/" className="inline-flex items-center gap-3 text-slate-950">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
        <Layers3 className="h-5 w-5" />
      </span>
      <span className="text-xl font-bold">SRM</span>
    </Link>
  );
}

function ProductIllustration({ role }) {
  const Icon = roles[role].icon;

  return (
    <div className="auth-float relative mx-auto mt-10 flex h-52 w-full max-w-sm items-end justify-center">
      <div className="absolute bottom-8 h-28 w-56 rotate-[-8deg] rounded-[2rem] border border-white/80 bg-white/70 shadow-[0_28px_80px_rgba(37,99,235,0.24)]" />
      <div className="auth-pulse absolute bottom-4 h-20 w-48 rotate-[-8deg] rounded-[1.5rem] bg-blue-500/70 shadow-[0_22px_50px_rgba(37,99,235,0.26)]" />
      <div className={`relative flex h-28 w-28 items-center justify-center rounded-[2rem] ${roles[role].glow} shadow-[0_20px_60px_rgba(15,23,42,0.12)] ring-1 ring-white/80 transition duration-500 hover:scale-105`}>
        <Icon className={`h-14 w-14 ${roles[role].accent}`} strokeWidth={1.8} />
      </div>
    </div>
  );
}

function RoleCard({ role, selected, onSelect }) {
  const item = roles[role];
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`role-card auth-enter flex h-64 w-full flex-col items-center justify-between rounded-lg border bg-white/42 p-7 text-center shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-3 hover:border-blue-200 hover:bg-white/58 hover:shadow-[0_28px_80px_rgba(37,99,235,0.22)] ${
        selected ? 'border-blue-300 bg-white/62 ring-4 ring-blue-100/70' : 'border-white/55'
      }`}
    >
      <span className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full ${item.glow}`}>
        <Icon className={`h-11 w-11 ${item.accent}`} strokeWidth={1.8} />
      </span>
      <span className="flex flex-col items-center">
        <span className="block text-xl font-bold text-slate-900">{item.shortTitle}</span>
        <span className="mt-2 block h-12 text-sm leading-6 text-slate-500">{item.description}</span>
      </span>

    </button>
  );
}

function LoginForm({ role, onBack }) {
  const item = roles[role];
  const Icon = item.icon;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const isValidEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  const showEmailError = emailTouched && email.length > 0 && !isValidEmail;

  return (
    <div className="auth-enter glass-sheen grid overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/36 shadow-[0_30px_110px_rgba(15,23,42,0.16)] backdrop-blur-2xl lg:grid-cols-[0.92fr_1.08fr]">
      <aside className={`relative min-h-[34rem] bg-gradient-to-br ${item.panel} p-8 backdrop-blur-xl sm:p-12`}>
        <BrandMark />
        <div className="mt-16 max-w-xs">
          <h1 className="text-3xl font-bold text-slate-950">{item.title}</h1>
          <p className="mt-5 text-base leading-7 text-slate-600">{item.description}</p>
          <div className="mt-7 flex gap-2">
            <span className={`h-1.5 w-10 rounded-full ${role === 'supplier' ? 'bg-violet-600' : 'bg-blue-600'}`} />
            <span className="h-1.5 w-8 rounded-full bg-slate-200" />
          </div>
        </div>
        <ProductIllustration role={role} />
      </aside>

      <section className="flex min-h-[34rem] flex-col justify-center bg-white/44 p-8 backdrop-blur-xl sm:p-12">
        <button type="button" onClick={onBack} className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Change account type
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Welcome back!</h2>
          <p className="mt-2 text-sm text-slate-500">Please sign in to continue</p>
        </div>
        <form className="mt-9 space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Email address</span>
            <span className={`mt-2 flex items-center gap-3 rounded-lg border px-4 py-3.5 text-slate-400 shadow-sm backdrop-blur-xl transition focus-within:ring-4 ${showEmailError ? 'border-rose-400 bg-rose-50/40 focus-within:border-rose-400 focus-within:ring-rose-100/70' : 'border-white/60 bg-white/46 focus-within:border-blue-300 focus-within:bg-white/70 focus-within:ring-blue-100/70'}`}>
              <User className="h-5 w-5 flex-shrink-0" />
              <input
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                type="email"
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
              />
            </span>
            {showEmailError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                <span>⚠</span> Only @gmail.com addresses are accepted
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Password</span>
            <span className="mt-2 flex items-center gap-3 rounded-lg border border-white/60 bg-white/46 px-4 py-3.5 text-slate-400 shadow-sm backdrop-blur-xl transition focus-within:border-blue-300 focus-within:bg-white/70 focus-within:ring-4 focus-within:ring-blue-100/70">
              <LockKeyhole className="h-5 w-5 flex-shrink-0" />
              <input
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="flex-shrink-0 transition hover:text-slate-700">
                {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </span>
          </label>
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Remember me
            </label>
            <Link to="/forgot-password" className={`font-semibold ${item.accent}`}>
              Forgot password?
            </Link>
          </div>
          <Link
            to={isValidEmail ? item.to : '#'}
            onClick={(e) => { if (!isValidEmail) e.preventDefault(); }}
            className={`flex w-full items-center justify-center rounded-lg bg-gradient-to-r px-4 py-3.5 text-sm font-bold text-white shadow-[0_18px_35px_rgba(37,99,235,0.20)] transition ${item.ctaClass} ${!isValidEmail ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {item.button}
          </Link>
        </form>
        <p className="mt-12 text-center text-sm text-slate-500">
          Need help? <span className={`font-semibold ${item.accent}`}>Contact Support</span>
        </p>
      </section>
    </div>
  );
}

export function Login() {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf6ff] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.26),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(96,165,250,0.30),transparent_30%),linear-gradient(135deg,rgba(239,246,255,0.88),rgba(255,255,255,0.58)_42%,rgba(238,242,255,0.72))]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(160deg,transparent_10%,rgba(125,211,252,0.34)_52%,rgba(167,139,250,0.26)_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">Back to home</Link>
          <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
            <HelpCircle className="h-5 w-5" />
            Need help?
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          {!selectedRole ? (
            <div className="auth-enter glass-sheen w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/34 shadow-[0_32px_120px_rgba(37,99,235,0.16)] backdrop-blur-2xl">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <section className="p-8 sm:p-12">
                  <BrandMark />
                  <div className="mt-14 max-w-sm">
                    <h1 className="text-4xl font-bold text-slate-950">Welcome back</h1>
                    <p className="mt-5 text-lg leading-8 text-slate-600">Smart. Reliable. Modern. Supply Chain Management.</p>
                    <div className="mt-8 flex gap-2">
                      <span className="h-1.5 w-12 rounded-full bg-blue-600" />
                      <span className="h-1.5 w-9 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <ProductIllustration role="admin" />
                </section>
                <section className="flex flex-col justify-center border-t border-white/45 bg-white/26 p-8 backdrop-blur-xl sm:p-12 lg:border-l lg:border-t-0">
                  <h2 className="mb-8 text-xl font-bold text-slate-800">Select your account type</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="auth-enter auth-enter-delay-1">
                      <RoleCard role="supplier" selected={selectedRole === 'supplier'} onSelect={setSelectedRole} />
                    </div>
                    <div className="auth-enter auth-enter-delay-2">
                      <RoleCard role="admin" selected={selectedRole === 'admin'} onSelect={setSelectedRole} />
                    </div>
                  </div>
                </section>
              </div>
              <div className="border-t border-white/45 bg-white/26 px-8 py-6 text-center text-sm text-slate-500 backdrop-blur-xl">
                New here?{' '}
                <Link to="/register" className="inline-flex items-center gap-2 font-bold text-blue-600">
                  Create Account <UserPlus className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl">
              <LoginForm role={selectedRole} onBack={() => setSelectedRole(null)} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
