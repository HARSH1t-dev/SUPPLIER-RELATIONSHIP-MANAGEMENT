export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
            active === tab 
              ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-400 dark:shadow-none' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
