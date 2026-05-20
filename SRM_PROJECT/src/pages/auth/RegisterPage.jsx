import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, Shield, ArrowRight, ArrowLeft, Eye, ShieldCheck, Network, BarChart2, CheckCircle2, User, Building2, Mail, Lock } from 'lucide-react';
import { GlobeGraphic } from './AnimatedAuthSVGs';
import './LoginPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'supplier');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = role === 'admin';
  const steps = isAdmin
    ? ['Account Details', 'Department', 'Verification']
    : ['Account Details', 'Business Details', 'Verification'];

  function validate() {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Required';
    if (!companyName.trim()) e.companyName = 'Required';
    if (!email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password.trim()) e.password = 'Required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords don\'t match';
    if (!agreed) e.agreed = 'Required';
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); navigate(isAdmin ? '/admin' : '/supplier'); }, 1200);
  }

  return (
    <div className="auth-page">
      <div className="auth-frame">

        {/* LEFT PANEL — Globe */}
        <div className="auth-hero">
          <div className="auth-hero__glow-bottom" />
          <GlobeGraphic />
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-panel" style={{ overflowY: 'auto' }}>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 540, margin: '0 auto', width: '100%' }}>
            <div className="auth-step-wrapper auth-step-wrapper--visible">

              {/* Back link */}
              <Link to="/login" style={{
                display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:600,
                color:'#94a3b8', textDecoration:'none', marginBottom:'24px', textTransform:'uppercase',
                letterSpacing:'0.08em', transition:'color .2s', width: 'fit-content'
              }}
                onMouseEnter={e=>e.currentTarget.style.color='#0f172a'} onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>
                <ArrowLeft size={14} /> Back to login
              </Link>

              <h2 className="auth-panel__heading">Create your account</h2>
              <p className="auth-panel__sub">Fill in the details below to get started</p>

              {/* PROGRESS STEPPER */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, position:'relative', padding:'0 12px' }}>
                <div style={{ position:'absolute', top:13, left:42, right:42, height:2, background:'#e2e8f0', zIndex:0, borderRadius:1 }} />
                <div style={{ position:'absolute', top:13, left:42, width:'15%', height:2, background:'#2563eb', zIndex:1, borderRadius:1, transition:'width .4s' }} />
                {steps.map((s, i) => (
                  <div key={i} style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{
                      width:26, height:26, borderRadius:'50%',
                      background: i===0 ? '#2563eb' : '#f1f5f9',
                      color: i===0 ? '#fff' : '#94a3b8',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:11, fontWeight:700,
                      boxShadow: i===0 ? '0 0 0 4px rgba(37,99,235,0.12)' : 'none',
                      transition:'all .3s',
                      border: i===0 ? 'none' : '1px solid #e2e8f0',
                    }}>{i+1}</div>
                    <span style={{ fontSize:10, fontWeight:600, color: i===0 ? '#0f172a' : '#94a3b8', transition:'all .3s' }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* ROLE SELECTOR */}
              <div style={{ display:'flex', gap:10, marginBottom:22 }}>
                {[
                  { key:'supplier', icon:Truck, label:'Supplier', sub:'Join as a supplier' },
                  { key:'admin', icon:Shield, label:'Admin', sub:'Join as an administrator' },
                ].map(r => (
                  <div key={r.key} onClick={() => setRole(r.key)} style={{
                    flex:1, display:'flex', alignItems:'center', gap:12,
                    padding:'12px 16px', borderRadius:14, cursor:'pointer',
                    border: `1.5px solid ${role===r.key ? '#2563eb' : '#e2e8f0'}`,
                    background: role===r.key ? 'rgba(37,99,235,0.04)' : '#fff',
                    transition:'all .25s',
                    transform: role===r.key ? 'translateY(-1px)' : 'none',
                    boxShadow: role===r.key ? '0 4px 14px rgba(37,99,235,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ width:34, height:34, borderRadius:9, background: role===r.key ? 'rgba(37,99,235,0.08)' : '#f8fafc', color:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <r.icon size={16} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{r.label}</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>{r.sub}</div>
                    </div>
                    {role===r.key && <CheckCircle2 size={16} color="#2563eb" />}
                  </div>
                ))}
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Full name</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.fullName?'#ef4444':'', height:42 }}>
                      <User size={15} className="auth-input-wrap__icon" />
                      <input type="text" className="auth-input" placeholder="Enter your full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Company name</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.companyName?'#ef4444':'', height:42 }}>
                      <Building2 size={15} className="auth-input-wrap__icon" />
                      <input type="text" className="auth-input" placeholder="Enter company name" value={companyName} onChange={e=>setCompanyName(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ gridColumn:'span 2' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Email address</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.email?'#ef4444':'', height:42 }}>
                      <Mail size={15} className="auth-input-wrap__icon" />
                      <input type="email" className="auth-input" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Password</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.password?'#ef4444':'', height:42 }}>
                      <Lock size={15} className="auth-input-wrap__icon" />
                      <input type={showPw?'text':'password'} className="auth-input" placeholder="Create a password" value={password} onChange={e=>setPassword(e.target.value)} />
                      <button type="button" className="auth-pw-toggle" onClick={()=>setShowPw(!showPw)}><Eye size={14}/></button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#475569', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Confirm password</label>
                    <div className="auth-input-wrap" style={{ borderColor:errors.confirmPassword?'#ef4444':'', height:42 }}>
                      <Lock size={15} className="auth-input-wrap__icon" />
                      <input type={showCPw?'text':'password'} className="auth-input" placeholder="Confirm password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                      <button type="button" className="auth-pw-toggle" onClick={()=>setShowCPw(!showCPw)}><Eye size={14}/></button>
                    </div>
                  </div>
                  <div style={{ gridColumn:'span 2' }}>
                    <div className="auth-security-notice">
                      <ShieldCheck size={16} />
                      <div><div style={{ fontWeight:600, color:'#0f172a', fontSize:12 }}>Your data is protected</div><div style={{ fontSize:10, color:'#64748b' }}>Industry-standard encryption keeps your information safe.</div></div>
                    </div>
                  </div>
                  <div style={{ gridColumn:'span 2', display:'flex', alignItems:'center', gap:7, marginTop:4 }}>
                    <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ width:14, height:14, accentColor:'#2563eb', borderRadius:3, cursor:'pointer' }} />
                    <span style={{ fontSize:11, color:'#64748b' }}>I agree to the <a href="#" style={{ color:'#2563eb', textDecoration:'none', fontWeight:600 }}>Terms</a> and <a href="#" style={{ color:'#2563eb', textDecoration:'none', fontWeight:600 }}>Privacy Policy</a></span>
                  </div>
                  <div style={{ gridColumn:'span 2', marginTop:6 }}>
                    <button type="submit" className="auth-submit" disabled={isLoading}>
                      {isLoading ? <span className="auth-spinner"/> : <>Continue <ArrowRight size={15}/></>}
                    </button>
                  </div>
                  <div style={{ gridColumn:'span 2', textAlign:'center', fontSize:12, color:'#64748b' }}>
                    Already have an account? <Link to="/login" style={{ color:'#2563eb', fontWeight:700, textDecoration:'none' }}>Sign in →</Link>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Footer Features */}
          <div className="auth-footer-features">
            <div className="auth-footer-feature"><ShieldCheck /><div className="auth-footer-feature__text"><strong>Secure & Compliant</strong><span>Enterprise grade</span></div></div>
            <div className="auth-footer-feature"><Network /><div className="auth-footer-feature__text"><strong>Connected Globally</strong><span>Partners worldwide</span></div></div>
            <div className="auth-footer-feature"><BarChart2 /><div className="auth-footer-feature__text"><strong>Data Driven</strong><span>Smart decisions</span></div></div>
          </div>

        </div>
      </div>
    </div>
  );
}
