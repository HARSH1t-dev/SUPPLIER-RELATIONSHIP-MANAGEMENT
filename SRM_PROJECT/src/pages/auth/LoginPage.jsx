import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Server, ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock, ShieldCheck, Network, BarChart2, Check, Globe } from 'lucide-react';
import { GlobeGraphic, SupplierGraphic, AdminGraphic } from './AnimatedAuthSVGs';
import './LoginPage.css';

const supplierCardTheme = {
    outerHover: "hover:border-emerald-500/20",
    blobBg: "bg-emerald-50/50 group-hover:bg-emerald-50",
    iconText: "text-emerald-600",
    iconGroupHover: "group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:border-emerald-400",
    checkBg: "bg-emerald-50 text-emerald-600",
    arrowGroupHover: "group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
};

const adminCardTheme = {
    outerHover: "hover:border-purple-500/20",
    blobBg: "bg-purple-50/50 group-hover:bg-purple-50",
    iconText: "text-purple-600",
    iconGroupHover: "group-hover:bg-purple-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:border-purple-400",
    checkBg: "bg-purple-50 text-purple-600",
    arrowGroupHover: "group-hover:border-purple-600 group-hover:bg-purple-600 group-hover:text-white"
};

function SRMLogo({ size = 28, fill = '#2563eb' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={fill} />
      <path d="M8 20l8-4 8 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16l8-4 8 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <path d="M8 12l8-4 8 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".4" />
    </svg>
  );
}

function FeatureCheck({ checkBg }) {
  const [bgClass, textClass] = checkBg ? checkBg.split(' ') : ['bg-blue-50', 'text-blue-600'];
  return (
    <div className={`w-3.5 h-3.5 rounded-full ${bgClass} flex items-center justify-center shrink-0`}>
      <Check size={10} className={textClass} strokeWidth={3} />
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, features, isSelected, onClick, theme }) {
  return (
    <div className={`auth-role-card ${isSelected ? 'auth-role-card--active' : ''} ${theme?.outerHover || ''}`} onClick={onClick}>
      {theme?.blobBg && (
        <div className={`absolute top-0 right-0 w-32 h-32 ${theme.blobBg} rounded-bl-full translate-x-10 -translate-y-10 transition-colors pointer-events-none z-0`} />
      )}
      <div className={`auth-role-card__icon-box ${theme?.iconText || ''} ${theme?.iconGroupHover || ''} relative z-10`}><Icon size={20} /></div>
      <h3 className="auth-role-card__title relative z-10">{title}</h3>
      <p className="auth-role-card__desc relative z-10">{desc}</p>
      <ul className="auth-role-card__list relative z-10">
        {features.map((f, i) => <li key={i} className="flex items-center gap-2"><FeatureCheck checkBg={theme?.checkBg} />{f}</li>)}
      </ul>
      <div className={`auth-role-card__arrow ${theme?.arrowGroupHover || ''} relative z-10`}><ArrowRight size={14} /></div>
    </div>
  );
}

const Feature = ({ icon, title, sub, theme }) => (
  <div className="auth-footer-feature">
    <div className={theme.textAc}>
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
    </div>
    <div className="auth-footer-feature__text">
      <strong>{title}</strong>
      <span>{sub}</span>
    </div>
  </div>
);


export function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('select');
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = useCallback((r) => {
    setRole(r); setIsAnimating(true);
    setTimeout(() => { setStep('login'); setIsAnimating(false); }, 300);
  }, []);

  const goBack = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => { setStep('select'); setRole(null); setEmail(''); setPassword(''); setErrors({}); setIsAnimating(false); }, 300);
  }, []);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password.trim()) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); navigate(role === 'admin' ? '/admin' : '/supplier'); }, 1200);
  }

  const footerTheme = role === 'supplier'
    ? { textAc: 'text-emerald-600' }
    : role === 'admin'
      ? { textAc: 'text-purple-600' }
      : { textAc: 'text-blue-600' };

  return (
    <div className="auth-page">
      <div className="auth-frame">

        {/* LEFT PANEL — Globe */}
        <div className="auth-hero">
          <div className="auth-hero__glow-bottom" />
          {role === 'supplier' ? (
            <SupplierGraphic />
          ) : role === 'admin' ? (
            <AdminGraphic />
          ) : (
            <GlobeGraphic />
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-panel">

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 640, margin: '0 auto', width: '100%' }}>
            {/* STEP 1: Role Selection */}
            {step === 'select' && (
              <div className={`auth-step-wrapper ${isAnimating ? 'auth-step-wrapper--hidden' : 'auth-step-wrapper--visible'}`}>
                <h2 className="auth-panel__heading">Let's get started</h2>
                <p className="auth-panel__sub">Select your role to continue to the platform</p>
                <div className="auth-role-grid">
                  <RoleCard icon={Truck} title="Supplier" desc="Manage your business and grow with us"
                    features={['Manage Bids & RFQs', 'Track Orders & Deliveries', 'Upload Invoices', 'View Performance']}
                    isSelected={role === 'supplier'} onClick={() => handleRoleSelect('supplier')}
                    theme={supplierCardTheme} />
                  <RoleCard icon={Server} title="Admin" desc="Manage system and platform operations"
                    features={['User & Role Management', 'System Configuration', 'Analytics Dashboard', 'Audit & Compliance']}
                    isSelected={role === 'admin'} onClick={() => handleRoleSelect('admin')}
                    theme={adminCardTheme} />
                </div>
                <div className="auth-security-notice" style={{ justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                  Your data is safe with enterprise-grade security
                </div>
              </div>
            )}

            {/* STEP 2: Login Form */}
            {step === 'login' && (
              <div className={`auth-step-wrapper ${isAnimating ? 'auth-step-wrapper--hidden' : 'auth-step-wrapper--visible'}`}>
                <div className="auth-form-card">
                  <button type="button" onClick={goBack} style={{
                    background:'none', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:600,
                    color:'#94a3b8', padding:0, marginBottom:'28px', display:'flex', alignItems:'center',
                    gap:'6px', fontFamily:'inherit', textTransform:'uppercase', letterSpacing:'0.08em',
                    transition:'color .2s'
                  }}
                    onMouseEnter={e=>e.target.style.color='#0f172a'} onMouseLeave={e=>e.target.style.color='#94a3b8'}>
                    <ArrowLeft size={14} /> Back
                  </button>

                  <h2 className="auth-panel__heading">{role === 'supplier' ? 'Supplier Login' : 'Admin Login'}</h2>
                  <p className="auth-panel__sub">Sign in to your account</p>

                  <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div>
                      <label style={{ fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Email</label>
                      <div className="auth-input-wrap" style={{ borderColor: errors.email ? '#ef4444' : '' }}>
                        <Mail size={16} className="auth-input-wrap__icon" />
                        <input type="email" className="auth-input" placeholder="name@company.com" value={email} onChange={e=>setEmail(e.target.value)} />
                      </div>
                      {errors.email && <span className="auth-field__error">{errors.email}</span>}
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Password</label>
                      <div className="auth-input-wrap" style={{ borderColor: errors.password ? '#ef4444' : '' }}>
                        <Lock size={16} className="auth-input-wrap__icon" />
                        <input type={showPw?'text':'password'} className="auth-input" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
                        <button type="button" className="auth-pw-toggle" onClick={()=>setShowPw(!showPw)}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                      </div>
                      {errors.password && <span className="auth-field__error">{errors.password}</span>}
                    </div>

                    <div className="auth-extras">
                      <label className="auth-remember">
                        <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="auth-remember__checkbox" /> Remember me
                      </label>
                      <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
                    </div>

                    <button type="submit" className="auth-submit" disabled={isLoading}>
                      {isLoading ? <span className="auth-spinner"/> : <>Sign In to {role === 'supplier' ? 'Portal' : 'Dashboard'} <ArrowRight size={15}/></>}
                    </button>
                  </form>

                  <div className="auth-sso">
                    <div className="auth-sso__divider">Or continue with</div>
                    <div className="auth-sso__buttons">
                      <button type="button" className="auth-sso-btn"><svg viewBox="0 0 21 21"><path d="M10 0H0v10h10V0zM21 0H11v10h10V0zM10 11H0v10h10V11zM21 11H11v10h10V11z" fill="#0f172a"/></svg>Microsoft</button>
                      <button type="button" className="auth-sso-btn"><svg viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Google</button>
                      <button type="button" className="auth-sso-btn"><Globe size={14} color="#0f172a"/>SSO</button>
                    </div>
                  </div>
                </div>
                <div className="auth-bottom-link">Don't have an account?<Link to={`/register?role=${role}`}>Register now →</Link></div>
              </div>
            )}
          </div>

          {/* Footer Features */}
          <div className="auth-footer-features">
            <Feature icon={<ShieldCheck />} title="Secure & Compliant" sub="Enterprise grade" theme={footerTheme} />
            <Feature icon={<Network />} title="Connected Globally" sub="Partners worldwide" theme={footerTheme} />
            <Feature icon={<BarChart2 />} title="Data Driven" sub="Smart decisions" theme={footerTheme} />
          </div>

        </div>
      </div>
    </div>
  );
}
