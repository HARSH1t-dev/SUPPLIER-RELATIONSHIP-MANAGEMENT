import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const buyerFeedback = [
  {
    id: 'FB-301',
    buyer: 'Apex Industrial Components',
    date: 'May 15, 2026',
    rating: 5,
    category: 'Delivery',
    comment: 'Consistently meets delivery timelines. Proactive communication on shipment updates.',
    status: 'Excellent',
  },
  {
    id: 'FB-298',
    buyer: 'Northstar Logistics',
    date: 'Apr 28, 2026',
    rating: 4,
    category: 'Quality',
    comment: 'Product quality is strong. Minor packaging issue noted in last batch — resolved quickly.',
    status: 'Strong',
  },
  {
    id: 'FB-285',
    buyer: 'Vector Packaging Co.',
    date: 'Apr 10, 2026',
    rating: 3,
    category: 'Service',
    comment: 'Response time on queries needs improvement. Quality is acceptable but invoice accuracy requires attention.',
    status: 'Monitor',
  },
];

const scorecards = [
  { program: 'Apex Industrial Components', quality: 98, delivery: 96, service: 94, overall: 'Excellent' },
  { program: 'Northstar Logistics', quality: 91, delivery: 95, service: 89, overall: 'Strong' },
  { program: 'Vector Packaging Co.', quality: 88, delivery: 84, service: 90, overall: 'Monitor' },
];

function StarRating({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= count ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

export function SupplierReviews() {
  return (
    <>
      <PageHeader title="Reviews & Ratings" description="Buyer feedback and performance ratings from your procurement partners." />

      {/* Summary strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
            <Star className="h-5 w-5 fill-amber-400" />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-medium">Avg. Buyer Rating</p>
            <p className="text-2xl font-bold text-slate-950">4.0 <span className="text-sm font-normal text-slate-400">/ 5</span></p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-950">3</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
            <ThumbsUp className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-medium">Positive Feedback</p>
            <p className="text-2xl font-bold text-slate-950">67%</p>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Buyer feedback cards */}
        <Card>
          <CardHeader title="Buyer Feedback" subtitle="Comments and ratings submitted by your buyers" />
          <div className="divide-y divide-slate-50">
            {buyerFeedback.map((fb) => (
              <div key={fb.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{fb.buyer}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fb.date} · {fb.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating count={fb.rating} />
                    <StatusBadge status={fb.status} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed border-l-2 border-slate-200 pl-3 italic">
                  "{fb.comment}"
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Scorecards */}
        <Card>
          <CardHeader title="My Scorecards" subtitle="Aggregated scores from buyer evaluations" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Program', 'Quality', 'Delivery', 'Service', 'Overall'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scorecards.map((row, i) => (
                  <tr key={row.program} className={`border-b border-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{row.program}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.quality}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.delivery}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{row.service}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.overall} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
