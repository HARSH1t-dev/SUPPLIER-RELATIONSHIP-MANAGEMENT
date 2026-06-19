import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { bids } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function MyBids() {
  return (
    <>
      <PageHeader title="My Bids" description="Track submitted quotations and commercial evaluation status." />
      <Card>
        <CardHeader title="Submitted Bids" subtitle="Supplier quotation history" />
        <DataTable
          data={bids.slice(0, 3)}
          columns={[
            { key: 'supplier', header: 'Bid Package', render: (_row, index) => `RFQ-2406${index + 1}` },
            { key: 'price', header: 'Quoted Price', render: (row) => currency(row.price) },
            { key: 'delivery', header: 'Delivery' },
            { key: 'warranty', header: 'Warranty' },
            { key: 'score', header: 'Evaluation Score' },
            { key: 'best', header: 'Status', render: (row) => <StatusBadge status={row.best ? 'Approved' : 'Evaluating'} /> },
          ]}
        />
      </Card>
    </>
  );
}
