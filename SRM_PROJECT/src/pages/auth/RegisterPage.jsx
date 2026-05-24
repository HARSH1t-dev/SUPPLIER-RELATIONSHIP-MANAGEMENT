import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Shield, ArrowRight, ArrowLeft, Eye, ShieldCheck, Network, BarChart2, CheckCircle2, User, Building2, Mail, Lock } from 'lucide-react';
import { GlobeGraphic } from './AnimatedAuthSVGs';
import { GridBackground } from '../../components/ui/GridBackground';
import { HoverBorderGradient } from '../../components/ui/HoverBorderGradient';
import ThemeToggle from '../../../Theme.jsx';
import './LoginPage.css';

function LoaderDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 h-5">
      {[0, 1, 2].map((idx) => (
        <motion.span
          key={idx}
          className="w-2.5 h-2.5 rounded-full bg-current"
          animate={{
            y: ["0%", "-40%", "0%"]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: idx * 0.15
          }}
        />
      ))}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/SRM_PROJECT/backend/api';
  const [role, setRole] = useState(searchParams.get('role') || 'supplier');
  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = role === 'admin';
  const steps = isAdmin
    ? ['Account Details', 'Department', 'Verification']
    : ['Account Details', 'Business Details', 'Verification'];

  function validateStep(stepIndex) {
    const e = {};
    if (stepIndex === 0) {
      if (!fullName.trim()) e.fullName = 'Required';
      if (!email.trim()) e.email = 'Required';
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
      if (!password.trim()) e.password = 'Required';
      else if (password.length < 6) e.password = 'Min 6 characters';
      if (!confirmPassword.trim()) e.confirmPassword = 'Required';
      else if (password !== confirmPassword) e.confirmPassword = 'Passwords don\'t match';
    }
    if (stepIndex === 1 && !companyName.trim()) e.companyName = 'Required';
    if (stepIndex === 2) {
      if (!verificationCode.trim()) e.verificationCode = 'Required';
      else if (!/^\d{6}$/.test(verificationCode)) e.verificationCode = 'Enter the 6-digit code';
      if (!agreed) e.agreed = 'Required';
    }
    return e;
  }

  function handleNext(ev) {
    ev.preventDefault();
    const e = validateStep(currentStep);
    setErrors(e);
    if (Object.keys(e).length) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = { ...validateStep(0), ...validateStep(1), ...validateStep(2) };
    setErrors(e);
    if (Object.keys(e).length) return;
    setIsLoading(true);

    fetch(`${apiBaseUrl}/register.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        companyName,
        email,
        password,
        role,
        verificationCode,
      }),
    })
      .then(async (response) => {
        const raw = await response.text();
        let data = {};

        if (raw.trim()) {
          try {
            data = JSON.parse(raw);
          } catch {
            throw new Error('Unexpected server response.');
          }
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to create account.');
        }

        return data;
      })
      .then(() => {
        navigate('/login', { replace: true, state: { message: 'Account created. Please sign in.' } });
      })
      .catch((error) => {
        setErrors((currentErrors) => ({
          ...currentErrors,
          general: error.message,
        }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function goBack() {
    setErrors({});
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  const footerTheme = role === 'supplier'
    ? { textAc: 'text-emerald-600 dark:text-emerald-400' }
    : { textAc: 'text-purple-600 dark:text-purple-400' };

  return (
    <div className="auth-page">
      <GridBackground type="dot" />

      <div className="auth-frame">
        {/* LEFT PANEL — Globe */}
        <div className="auth-hero">
          <div className="globe-wrapper">
            <div className="globe-ambient" />
            <GlobeGraphic />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-panel auth-panel--register">
          {/* Floating Theme Toggle */}
          <div className="theme-toggle-floating">
            <ThemeToggle />
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyStyle: 'center', justifyContent: 'center', maxWidth: 540, margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="auth-step-wrapper auth-step-wrapper--visible"
            >
              {/* Back link */}
              <Link 
                to="/login" 
                style={{
                  display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:700,
                  textDecoration:'none', marginBottom:'24px', textTransform:'uppercase',
                  letterSpacing:'0.08em', width: 'fit-content'
                }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Back to login
              </Link>

              <h2 className="auth-panel__heading">Create your account</h2>
              <p className="auth-panel__sub">
                {currentStep === 0
                  ? 'Fill in the details below to get started'
                  : currentStep === 1
                    ? 'Add your business or department details'
                    : 'Verify your account and finish registration'}
              </p>

              {/* PROGRESS STEPPER */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, position:'relative', padding:'0 12px' }}>
                <div style={{ position:'absolute', top:13, left:42, right:42, height:2, zIndex:0, borderRadius:1 }} className="bg-slate-200 dark:bg-slate-800" />
                <div
                  style={{
                    position:'absolute',
                    top:13,
                    left:42,
                    width:`${steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0}%`,
                    height:2,
                    background: 'var(--accent)',
                    zIndex:1,
                    borderRadius:1,
                    transition:'width .4s'
                  }}
                />
                {steps.map((s, i) => (
                  <div key={i} style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div 
                      style={{
                        width:26, height:26, borderRadius:'50%',
                        display:'flex', alignItems:'center', justifyStyle:'center', justifyContent: 'center',
                        fontSize:11, fontWeight:700,
                        boxShadow: i===currentStep ? '0 0 0 4px var(--accent-glow)' : 'none',
                        transition:'all .3s',
                      }}
                      className={i <= currentStep ? 'bg-blue-600 text-white border-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'}
                    >
                      {i+1}
                    </div>
                    <span 
                      style={{ fontSize:10, fontWeight:600, transition:'all .3s' }}
                      className={i === currentStep ? 'text-slate-950 dark:text-white' : i < currentStep ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}
                    >
                      {s}
                    </span>
                  </div>
                ))}
              </div>

              {/* FORM */}
              <form onSubmit={currentStep === 2 ? handleSubmit : handleNext} noValidate>
                {errors.general && (
                  <div className="auth-field__error" style={{ marginBottom: 8 }}>
                    {errors.general}
                  </div>
                )}
                {currentStep === 0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Full name</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.fullName?'#ef4444':'', height:42 }}>
                      <User size={15} className="auth-input-wrap__icon" />
                      <input type="text" className="auth-input" placeholder="Your name" value={fullName} onChange={e=>setFullName(e.target.value)} />
                    </div>
                    {errors.fullName && <span className="auth-field__error">{errors.fullName}</span>}
                  </div>
                  <div style={{ gridColumn:'span 2' }}>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Email address</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.email?'#ef4444':'', height:42 }}>
                      <Mail size={15} className="auth-input-wrap__icon" />
                      <input type="email" className="auth-input" placeholder="name@company.com" value={email} onChange={e=>setEmail(e.target.value)} />
                    </div>
                    {errors.email && <span className="auth-field__error">{errors.email}</span>}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.password?'#ef4444':'', height:42 }}>
                      <Lock size={15} className="auth-input-wrap__icon" />
                      <input type={showPw?'text':'password'} className="auth-input" placeholder="Min 6 chars" value={password} onChange={e=>setPassword(e.target.value)} />
                      <button type="button" className="auth-pw-toggle" onClick={()=>setShowPw(!showPw)}><Eye size={14}/></button>
                    </div>
                    {errors.password && <span className="auth-field__error">{errors.password}</span>}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Confirm</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.confirmPassword?'#ef4444':'', height:42 }}>
                      <Lock size={15} className="auth-input-wrap__icon" />
                      <input type={showCPw?'text':'password'} className="auth-input" placeholder="Confirm" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                      <button type="button" className="auth-pw-toggle" onClick={()=>setShowCPw(!showCPw)}><Eye size={14}/></button>
                    </div>
                    {errors.confirmPassword && <span className="auth-field__error">{errors.confirmPassword}</span>}
                  </div>
                  <div style={{ gridColumn:'span 2', marginTop:6 }}>
                    <button type="submit" className="auth-step-button auth-step-button--primary">
                      Continue <ArrowRight size={15}/>
                    </button>
                  </div>
                </div>
                )}

                {currentStep === 1 && (
                  <div style={{ display:'grid', gap:14 }}>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                        {isAdmin ? 'Department name' : 'Business name'}
                      </label>
                      <div className="auth-input-wrap" style={{ borderColor:errors.companyName?'#ef4444':'', height:42 }}>
                        <Building2 size={15} className="auth-input-wrap__icon" />
                        <input
                          type="text"
                          className="auth-input"
                          placeholder={isAdmin ? 'Department name' : 'Company name'}
                          value={companyName}
                          onChange={e=>setCompanyName(e.target.value)}
                        />
                      </div>
                      {errors.companyName && <span className="auth-field__error">{errors.companyName}</span>}
                    </div>

                    <div className="auth-security-notice">
                      <ShieldCheck size={16} />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-200 text-[11.5px]">Your data is protected</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Industry-standard encryption keeps your information safe.</div>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:12, marginTop:6 }}>
                      <button type="button" className="auth-step-button auth-step-button--ghost" onClick={goBack}>
                        <ArrowLeft size={15} /> Back
                      </button>
                      <button type="submit" className="auth-step-button auth-step-button--primary">
                        Continue <ArrowRight size={15}/>
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div style={{ display:'grid', gap:14 }}>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Verification code</label>
                      <div className="auth-input-wrap" style={{ borderColor:errors.verificationCode?'#ef4444':'', height:42 }}>
                        <Mail size={15} className="auth-input-wrap__icon" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="auth-input"
                          placeholder="6-digit code"
                          value={verificationCode}
                          onChange={e=>setVerificationCode(e.target.value)}
                        />
                      </div>
                      {errors.verificationCode && <span className="auth-field__error">{errors.verificationCode}</span>}
                    </div>

                    <div className="auth-security-notice">
                      <ShieldCheck size={16} />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-200 text-[11.5px]">Verify your account</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Demo code: 123456. Enter any 6 digits to finish registration.</div>
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:4 }}>
                      <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ width:14, height:14, accentColor:'var(--accent)', borderRadius:3, cursor:'pointer' }} />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        I agree to the <a href="#" className="text-blue-500 font-bold hover:underline">Terms</a> and <a href="#" className="text-blue-500 font-bold hover:underline">Privacy Policy</a>
                      </span>
                    </div>
                    {errors.agreed && <span className="auth-field__error">Please accept the Terms and Privacy Policy.</span>}

                    <div style={{ display:'flex', gap:12, marginTop:6 }}>
                      <button type="button" className="auth-step-button auth-step-button--ghost" onClick={goBack}>
                        <ArrowLeft size={15} /> Back
                      </button>
                      <button type="submit" className="auth-step-button auth-step-button--primary" disabled={isLoading}>
                        {isLoading ? <LoaderDots /> : <>Create account <ArrowRight size={15}/></>}
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div className="auth-bottom-link auth-bottom-link--register" style={{ marginTop: 18 }}>
                Already have an account? <Link to="/login" className="text-blue-500 font-bold hover:underline">Sign in →</Link>
              </div>
            </motion.div>
          </div>

          {/* Footer Features */}
          <div className="auth-footer-features">
            <div className="auth-footer-feature">
              <ShieldCheck />
              <div className="auth-footer-feature__text">
                <strong className="dark:text-slate-300">Secure & Compliant</strong>
                <span className="dark:text-slate-400">Enterprise grade</span>
              </div>
            </div>
            <div className="auth-footer-feature">
              <Network />
              <div className="auth-footer-feature__text">
                <strong className="dark:text-slate-300">Connected Globally</strong>
                <span className="dark:text-slate-400">Partners worldwide</span>
              </div>
            </div>
            <div className="auth-footer-feature">
              <BarChart2 />
              <div className="auth-footer-feature__text">
                <strong className="dark:text-slate-300">Data Driven</strong>
                <span className="dark:text-slate-400">Smart decisions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
