export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded px-3 py-1.5 text-sm font-semibold transition ${active === tab ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
