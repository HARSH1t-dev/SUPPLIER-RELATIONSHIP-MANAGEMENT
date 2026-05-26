import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { purchaseOrders } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function SupplierOrders() {
  return (
    <>
      <PageHeader title="Active Orders" description="View, confirm, ship, and track ongoing purchase orders." />
      <Card>
        <CardHeader title="Active Order Queue" subtitle="Open POs that still require fulfillment updates" />
        <DataTable
          data={purchaseOrders.filter((order) => order.status !== 'Delivered')}
          columns={[
            { key: 'id', header: 'PO' },
            { key: 'supplier', header: 'Buyer Account' },
            { key: 'amount', header: 'Amount', render: (row) => currency(row.amount) },
            { key: 'due', header: 'Commit Date' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
