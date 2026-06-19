import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from './Card.jsx';

export function StatCard({ label, value, change, trend = 'up' }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {change}
        </span>
      </div>
    </Card>
  );
}
