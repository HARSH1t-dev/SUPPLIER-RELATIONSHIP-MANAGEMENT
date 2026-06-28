import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { receiving } from '../../data/mockData.js';
import { number } from '../../utils/formatters.js';

export function GoodsReceiving() {
  return (
    <>
      <PageHeader title="Goods Receiving" description="Validate deliveries, record accepted quantities, and manage receiving variances." />
      <Card>
        <CardHeader title="Receiving Queue" subtitle="Inbound receipts awaiting confirmation" />
        <DataTable
          data={receiving}
          columns={[
            { key: 'receipt', header: 'Receipt' },
            { key: 'po', header: 'PO' },
            { key: 'item', header: 'Item' },
            { key: 'received', header: 'Received', render: (row) => number(row.received) },
            { key: 'accepted', header: 'Accepted', render: (row) => number(row.accepted) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
