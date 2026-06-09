import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, ShieldCheck, Network, BarChart2 } from 'lucide-react';
import { GlobeGraphic } from './AnimatedAuthSVGs';
import { GridBackground } from '../../components/ui/GridBackground';
import { HoverBorderGradient } from '../../components/ui/HoverBorderGradient';
import ThemeToggle from '../../../Theme.jsx';
import './LoginPage.css';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }
    setError(''); setIsLoading(true);
    setTimeout(() => { 
      setIsLoading(false); 
      setIsSent(true); 
    }, 1000);
  }

  return (
    <div className="auth-page">
      <GridBackground type="dot" />

      {/* Floating Theme Toggle */}
      <div className="theme-toggle-floating">
        <ThemeToggle />
      </div>

      <div className="auth-frame">
        {/* LEFT PANEL — Globe */}
        <div className="auth-hero">
          <div className="globe-wrapper">
            <div className="globe-ambient" />
            <GlobeGraphic />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-panel">
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 400, margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
            <motion.div 
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
                  textDecoration:'none', marginBottom:'28px', textTransform:'uppercase',
                  letterSpacing:'0.08em', width: 'fit-content'
                }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Back to login
              </Link>

              {!isSent ? (
                <>
                  <h2 className="auth-panel__heading">Reset password</h2>
                  <p className="auth-panel__sub">Enter your email and we'll send reset instructions.</p>
                  
                  <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="relative">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Email</label>
                      <div className="auth-input-wrap" style={{ borderColor: error ? '#ef4444' : '' }}>
                        <Mail size={16} className="auth-input-wrap__icon" />
                        <input 
                          type="email" 
                          className="auth-input" 
                          placeholder="name@company.com" 
                          value={email} 
                          onChange={e=>setEmail(e.target.value)} 
                        />
                      </div>
                      {error && <span className="auth-field__error">{error}</span>}
                    </div>

                    <HoverBorderGradient as="div" containerClassName="w-full mt-2" className="h-11">
                      <button type="submit" className="w-full h-full flex items-center justify-center gap-2 font-bold text-[14px]" disabled={isLoading}>
                        {isLoading ? <span className="auth-spinner"/> : <>Send instructions <ArrowRight size={15}/></>}
                      </button>
                    </HoverBorderGradient>
                  </form>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--accent-light)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                    <Mail size={24} />
                  </div>
                  <h2 className="auth-panel__heading" style={{ textAlign:'center' }}>Check your email</h2>
                  <p className="auth-panel__sub" style={{ textAlign:'center' }}>We've sent reset instructions to <strong>{email}</strong>.</p>
                  
                  <button 
                    type="button" 
                    className="auth-submit bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800" 
                    onClick={()=>setIsSent(false)} 
                    style={{ marginTop:20, boxShadow:'none' }}
                  >
                    Resend email
                  </button>
                </div>
              )}
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
