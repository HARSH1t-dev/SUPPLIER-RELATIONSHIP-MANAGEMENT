import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { purchaseOrders } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function SupplierOrders() {
  return (
    <>
      <PageHeader title="Orders" description="Confirm, ship, and monitor purchase orders from buying organizations." />
      <Card>
        <CardHeader title="Order Queue" />
        <DataTable
          data={purchaseOrders}
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
