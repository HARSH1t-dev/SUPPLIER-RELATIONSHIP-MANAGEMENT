export function Card({ children, className = '' }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-soft ${className}`}>{children}</section>;
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
