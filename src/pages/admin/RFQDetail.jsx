import { useParams } from 'react-router-dom';
import { Alert } from '../../components/Alert.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { bids, rfqs } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function RFQDetail() {
  const { id } = useParams();
  const rfq = rfqs.find((item) => item.id === id) || rfqs[0];

  return (
    <div className="space-y-6">
      <PageHeader title={rfq.title} description={`${rfq.id} • ${rfq.category} • Deadline ${rfq.deadline}`} />
      <Alert>Evaluation is in progress. Commercial score, delivery lead time, and supplier rating are weighted for the award recommendation.</Alert>
      <Card>
        <CardHeader title="RFQ Overview" />
        <div className="grid gap-4 p-5 sm:grid-cols-4">
          <Metric label="Status" value={<StatusBadge status={rfq.status} />} />
          <Metric label="Target Value" value={currency(rfq.value)} />
          <Metric label="Received Bids" value={rfq.bids} />
          <Metric label="Category" value={rfq.category} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Supplier Quotations" subtitle="Shortlisted bid submissions" />
        <DataTable
          data={bids}
          columns={[
            { key: 'supplier', header: 'Supplier' },
            { key: 'price', header: 'Price', render: (row) => currency(row.price) },
            { key: 'delivery', header: 'Delivery' },
            { key: 'rating', header: 'Rating' },
            { key: 'score', header: 'Score' },
          ]}
        />
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-bold text-slate-950">{value}</div>
    </div>
  );
}
