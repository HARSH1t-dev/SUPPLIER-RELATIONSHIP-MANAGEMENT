import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { reviews } from '../../data/mockData.js';

export function Reviews() {
  return (
    <>
      <PageHeader title="Supplier Reviews" description="Review quality, delivery, and service metrics across strategic suppliers." />
      <Card>
        <CardHeader title="Performance Scorecards" subtitle="Quarterly review cycle" />
        <DataTable
          data={reviews}
          columns={[
            { key: 'supplier', header: 'Supplier' },
            { key: 'quality', header: 'Quality' },
            { key: 'delivery', header: 'Delivery' },
            { key: 'service', header: 'Service' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
