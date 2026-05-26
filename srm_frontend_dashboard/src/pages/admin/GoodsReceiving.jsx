import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { receiving } from '../../data/mockData.js';
import { number } from '../../utils/formatters.js';

export function GoodsReceiving() {
  return (
    <>
      <PageHeader title="Receipts & Reviews" description="Confirm delivered items, record accepted quantities, and review supplier delivery quality." />
      <Card>
        <CardHeader title="Receipt Queue" subtitle="Deliveries awaiting confirmation and supplier review" />
        <DataTable
          data={receiving}
          columns={[
            { key: 'receipt', header: 'Receipt' },
            { key: 'po', header: 'PO' },
            { key: 'item', header: 'Item' },
            { key: 'received', header: 'Delivered Qty', render: (row) => number(row.received) },
            { key: 'accepted', header: 'Accepted Qty', render: (row) => number(row.accepted) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
