import { Award } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { bids } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function BidComparison() {
  return (
    <>
      <PageHeader title="Bid Comparison" description="Compare quotations by price, timeline, rating, warranty, and weighted evaluation score." />
      <Card>
        <CardHeader title="RFQ-24061 Bid Matrix" subtitle="Best quotation is highlighted for award review" />
        <DataTable
          data={bids}
          columns={[
            {
              key: 'supplier',
              header: 'Supplier',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-950">{row.supplier}</span>
                  {row.best ? <StatusBadge status="Approved" /> : null}
                </div>
              ),
            },
            { key: 'price', header: 'Price Comparison', render: (row) => currency(row.price) },
            { key: 'delivery', header: 'Delivery Timeline' },
            { key: 'rating', header: 'Supplier Rating', render: (row) => <span>{row.rating} / 5.0</span> },
            { key: 'warranty', header: 'Warranty' },
            {
              key: 'score',
              header: 'Score',
              render: (row) => (
                <div className="flex items-center gap-2">
                  {row.best ? <Award className="h-4 w-4 text-amber-500" /> : null}
                  <span className={row.best ? 'font-bold text-brand-700' : 'font-semibold text-slate-700'}>{row.score}</span>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
