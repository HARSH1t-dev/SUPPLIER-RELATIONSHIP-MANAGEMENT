import { Check, Circle } from 'lucide-react';

export function OrderProgressBar({ percent = 10, label }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div className="w-full">
      {label ? <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p> : null}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-2.5 rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StepIcon({ state }) {
  if (state === 'completed') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white ring-4 ring-amber-100">
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900">
      <Circle className="h-3 w-3" />
    </span>
  );
}

export function OrderTimeline({ timeline = [], compact = false }) {
  if (!timeline.length) {
    return <p className="text-sm text-slate-500">No tracking events recorded yet.</p>;
  }

  return (
    <ol className={compact ? 'space-y-3' : 'space-y-4'}>
      {timeline.map((step, index) => (
        <li key={step.status} className="relative flex gap-3">
          {index < timeline.length - 1 && (
            <span
              className={`absolute left-3.5 top-8 h-[calc(100%-8px)] w-0.5 ${
                step.state === 'completed' ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          )}
          <StepIcon state={step.state} />
          <div className="min-w-0 flex-1 pb-1">
            <p
              className={`text-sm font-semibold ${
                step.state === 'pending' ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {step.label}
            </p>
            {step.description ? (
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.description}</p>
            ) : null}
            {step.created_at ? (
              <p className="mt-1 text-[10px] text-slate-400">
                {step.created_at}
                {step.updated_by_name ? ` · ${step.updated_by_name}` : ''}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
