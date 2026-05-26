import { Plus } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { purchaseOrders } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function PurchaseOrders() {
  return (
    <>
      <PageHeader title="Purchase Orders" description="Monitor issued POs, due dates, shipment states, and order exceptions." action={<Button><Plus className="h-4 w-4" /> Create PO</Button>} />
      <Card>
        <CardHeader title="Order Workbench" subtitle="Open purchase order pipeline" />
        <DataTable
          data={purchaseOrders}
          columns={[
            { key: 'id', header: 'PO Number' },
            { key: 'supplier', header: 'Supplier' },
            { key: 'amount', header: 'Amount', render: (row) => currency(row.amount) },
            { key: 'due', header: 'Due Date' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
