import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function RootRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
      <div className="relative flex items-center justify-center">
        {/* Ambient glow */}
        <div className="absolute h-24 w-24 rounded-full bg-blue-500/10 blur-xl" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-16 w-16 rounded-full bg-blue-500/20" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
        {/* Spinning gradient border */}
        <div className="h-12 w-12 rounded-full border-[3px] border-blue-500/30 border-t-blue-500" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase" style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        Connecting to SRM Portal
      </p>
    </div>
  );
}
