export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
