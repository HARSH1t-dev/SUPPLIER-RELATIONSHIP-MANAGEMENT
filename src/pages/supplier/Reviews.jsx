import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { reviews } from '../../data/mockData.js';

export function SupplierReviews() {
  return (
    <>
      <PageHeader title="Reviews" description="View performance scorecards and buyer feedback." />
      <Card>
        <CardHeader title="My Scorecards" />
        <DataTable
          data={reviews}
          columns={[
            { key: 'supplier', header: 'Program' },
            { key: 'quality', header: 'Quality' },
            { key: 'delivery', header: 'Delivery' },
            { key: 'service', header: 'Service' },
            { key: 'status', header: 'Rating', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
