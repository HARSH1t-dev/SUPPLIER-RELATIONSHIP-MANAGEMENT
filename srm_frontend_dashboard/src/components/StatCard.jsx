import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from './Card.jsx';

export function StatCard({ label, value, change, trend = 'up', icon: Icon }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="group relative overflow-hidden p-5 transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(15,23,42,0.10)]">
      {/* Subtle gradient accent in corner */}
      <div
        className={`pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-[2.5rem] opacity-60 transition-opacity duration-300 group-hover:opacity-100 ${
          trend === 'up' ? 'bg-gradient-to-bl from-emerald-100/80' : 'bg-gradient-to-bl from-amber-100/80'
        }`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{value}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {change}
          </span>
        </div>
      </div>
    </Card>
  );
}
