import { motion } from 'framer-motion';

/**
 * GlobeGraphic — Glass sphere with animated network nodes and pulsating connections.
 * This is the primary visual for the left panel of all auth pages.
 */
export function GlobeGraphic() {
  const nodes = [
    { id: 1, x: 120, y: 110, r: 4, color: '#60a5fa' },
    { id: 2, x: 280, y: 130, r: 5, color: '#38bdf8' },
    { id: 3, x: 310, y: 230, r: 6, color: '#818cf8' },
    { id: 4, x: 210, y: 310, r: 4, color: '#60a5fa' },
    { id: 5, x: 110, y: 250, r: 5, color: '#818cf8' },
    { id: 6, x: 190, y: 180, r: 7, color: '#38bdf8' },
  ];

  const connections = [
    { source: 6, target: 1 },
    { source: 6, target: 2 },
    { source: 6, target: 3 },
    { source: 6, target: 4 },
    { source: 6, target: 5 },
    { source: 1, target: 2 },
    { source: 2, target: 3 },
    { source: 3, target: 4 },
    { source: 4, target: 5 },
    { source: 5, target: 1 },
  ];

  return (
    <div className="globe-wrapper">
       {/* Ambient bright fog */}
       <div className="globe-ambient" />

       <motion.div
        className="globe-inner"
        animate={{ rotateZ: [0, 2, -2, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
      >

         {/* Base Glass Sphere */}
         <svg viewBox="0 0 400 400" className="globe-layer globe-layer--base">
            <defs>
               <radialGradient id="glassSphereLight" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#f8fafc" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#e0f2fe" stopOpacity="0.3" />
                  <stop offset="90%" stopColor="#bae6fd" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.2" />
               </radialGradient>
               <radialGradient id="rimLightLight" cx="50%" cy="50%" r="50%">
                  <stop offset="88%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="96%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#e0f2fe" stopOpacity="1" />
               </radialGradient>
               <filter id="bottomGlow">
                  <feGaussianBlur stdDeviation="15" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
               </filter>
            </defs>
            <circle cx="200" cy="200" r="160" fill="url(#glassSphereLight)" />
            <circle cx="200" cy="200" r="160" fill="url(#rimLightLight)" />
         </svg>

         {/* Rotating Grids, Lines, Nodes */}
         <motion.svg
            viewBox="0 0 400 400"
            className="globe-layer globe-layer--grid"
            animate={{ rotate: 360, rotateY: [0, 10, -10, 0] }}
            transition={{
               rotate: { duration: 160, repeat: Infinity, ease: 'linear' },
               rotateY: { duration: 20, repeat: Infinity, ease: 'easeInOut' }
            }}
            style={{ transformOrigin: 'center center', transformStyle: 'preserve-3d' }}
         >
            <defs>
               <filter id="nodeGlowLight">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
               </filter>
            </defs>

            {/* Subtle Equator and Grids */}
            <g opacity="0.45">
               <ellipse cx="200" cy="200" rx="160" ry="35" fill="none" stroke="#bae6fd" strokeWidth="1" />
               <ellipse cx="200" cy="200" rx="160" ry="80" fill="none" stroke="#e0f2fe" strokeWidth="0.75" strokeDasharray="4 4" />
               <ellipse cx="200" cy="200" rx="160" ry="120" fill="none" stroke="#e0f2fe" strokeWidth="0.5" strokeDasharray="2 4" />
               <ellipse cx="200" cy="200" rx="35" ry="160" fill="none" stroke="#bae6fd" strokeWidth="0.75" />
               <ellipse cx="200" cy="200" rx="80" ry="160" fill="none" stroke="#e0f2fe" strokeWidth="0.5" strokeDasharray="4 4" />
               <ellipse cx="200" cy="200" rx="120" ry="160" fill="none" stroke="#e0f2fe" strokeWidth="0.5" strokeDasharray="2 4" />
            </g>

            {/* Connections */}
            {connections.map((c, i) => {
              const n1 = nodes.find(n => n.id === c.source);
              const n2 = nodes.find(n => n.id === c.target);
              const dx = n2.x - n1.x;
              const dy = n2.y - n1.y;
              const cpx = n1.x + dx/2 + dy * 0.15;
              const cpy = n1.y + dy/2 - dx * 0.15;
              const pathD = `M ${n1.x} ${n1.y} Q ${cpx} ${cpy} ${n2.x} ${n2.y}`;
              return (
                 <g key={`conn-${i}`}>
                   <path d={pathD} fill="none" stroke="#7dd3fc" strokeWidth="1" opacity="0.4" />
                   <motion.path d={pathD} fill="none" stroke="#eff6ff" strokeWidth="2.5"
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                     transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                     filter="url(#nodeGlowLight)"
                   />
                   <motion.path d={pathD} fill="none" stroke={n2.color} strokeWidth="1.5"
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
                     transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 + 0.2, ease: "easeInOut" }}
                     filter="url(#nodeGlowLight)"
                   />
                 </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => (
               <g key={`node-${node.id}`}>
                  <motion.circle cx={node.x} cy={node.y} r={node.r} fill="none" stroke={node.color} strokeWidth={2}
                    initial={{ scale: 1, opacity: 0.9 }}
                    animate={{ scale: [1, 3], opacity: [0.9, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: node.id * 0.3 }}
                  />
                  <circle cx={node.x} cy={node.y} r={node.r + 1.5} fill="#fff" filter="url(#nodeGlowLight)" />
                  <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} />
               </g>
            ))}
         </motion.svg>

         {/* Orbiting outer elements & ground reflections */}
         <svg viewBox="0 0 400 400" className="globe-layer globe-layer--orbit">
            <ellipse cx="200" cy="360" rx="120" ry="15" fill="none" stroke="#7dd3fc" strokeWidth="1" opacity="0.3" filter="url(#bottomGlow)" />
            <ellipse cx="200" cy="360" rx="160" ry="20" fill="none" stroke="#bae6fd" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.4" />
            <ellipse cx="200" cy="360" rx="200" ry="25" fill="none" stroke="#e0f2fe" strokeWidth="0.5" opacity="0.3" />
            <motion.g animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: 'center' }}>
               <circle cx="200" cy="200" r="180" fill="none" stroke="#e0f2fe" strokeWidth="0.5" strokeDasharray="5 15" opacity="0.6" />
               <circle cx="200" cy="200" r="215" fill="none" stroke="#bae6fd" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.4" />
            </motion.g>
         </svg>

         {/* Front Top Specular */}
         <svg viewBox="0 0 400 400" className="globe-layer globe-layer--specular">
            <defs>
               <radialGradient id="topReflectionLight" cx="30%" cy="20%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
               </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="160" fill="url(#topReflectionLight)" />
         </svg>

      </motion.div>
    </div>
  );
}

export function SupplierGraphic() {
    return (
        <div className="relative w-[80%] aspect-square max-w-[400px] mx-auto flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-emerald-400/10 blur-[60px] rounded-full mix-blend-multiply" />
            <motion.svg viewBox="0 0 200 200" className="w-full h-full relative z-10 overflow-visible">
                {/* Minimal Road */}
                <motion.line x1="20" y1="160" x2="180" y2="160" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 12"
                    animate={{ strokeDashoffset: [0, 24] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                
                {/* Minimal Truck */}
                <motion.g animate={{ y: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                    {/* Trailer Box */}
                    <path d="M 40 80 L 110 80 L 110 140 L 40 140 Z" fill="white" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" />
                    <line x1="60" y1="80" x2="60" y2="140" stroke="#10b981" strokeWidth="2" opacity="0.3" />
                    <line x1="80" y1="80" x2="80" y2="140" stroke="#10b981" strokeWidth="2" opacity="0.3" />
                    
                    {/* Cab */}
                    <path d="M 115 100 L 138 100 Q 145 100 148 108 L 152 140 L 115 140 Z" fill="white" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" />
                    <path d="M 122 106 L 135 106 Q 140 106 142 112 L 144 120 L 122 120 Z" fill="#6ee7b7" opacity="0.4" />
                    
                    {/* Wheels */}
                    <circle cx="65" cy="145" r="12" fill="white" stroke="#10b981" strokeWidth="4" />
                    <circle cx="130" cy="145" r="12" fill="white" stroke="#10b981" strokeWidth="4" />
                    <motion.circle cx="65" cy="145" r="4" fill="#059669" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.circle cx="130" cy="145" r="4" fill="#059669" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                </motion.g>

                {/* Wind Lines */}
                <motion.line x1="10" y1="100" x2="25" y2="100" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"
                    animate={{ x: [0, 8, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <motion.line x1="15" y1="120" x2="35" y2="120" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"
                     animate={{ x: [0, 12, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
            </motion.svg>
        </div>
    )
}

export function AdminGraphic() {
    return (
        <div className="relative w-[80%] aspect-square max-w-[400px] mx-auto flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-purple-400/10 blur-[60px] rounded-full mix-blend-multiply" />
            <motion.svg viewBox="0 0 200 200" className="w-full h-full relative z-10 overflow-visible">
                
                {/* Orbital Rings */}
                <motion.circle cx="100" cy="100" r="75" fill="none" stroke="#d8b4fe" strokeWidth="2" strokeDasharray="20 20"
                    animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '100px 100px' }} />
                <motion.circle cx="100" cy="100" r="60" fill="none" stroke="#e9d5ff" strokeWidth="1.5" strokeDasharray="8 12"
                    animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '100px 100px' }} />
                
                {/* Glowing Dots on Orbit */}
                <motion.g animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '100px 100px' }}>
                    <circle cx="25" cy="100" r="4" fill="#a855f7" />
                    <circle cx="175" cy="100" r="3" fill="#c084fc" />
                </motion.g>

                {/* Minimal Shield */}
                <motion.path 
                    d="M 100 45 L 145 65 L 145 110 C 145 145 100 170 100 170 C 100 170 55 145 55 110 L 55 65 Z" 
                    fill="white" stroke="#a855f7" strokeWidth="4" strokeLinejoin="round"
                    animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                
                {/* Lock / Security Core inside Shield */}
                <motion.g animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    <rect x="86" y="100" width="28" height="22" rx="4" fill="#d8b4fe" stroke="#a855f7" strokeWidth="2" />
                    <path d="M 92 100 L 92 88 C 92 82 108 82 108 88 L 108 100" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="100" cy="111" r="3" fill="white" />
                </motion.g>

            </motion.svg>
        </div>
    )
}

