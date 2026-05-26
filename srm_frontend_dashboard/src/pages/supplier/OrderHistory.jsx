import { Archive, RotateCcw } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { purchaseOrders } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

const historicalOrders = [
  ...purchaseOrders.filter((order) => order.status === 'Delivered'),
  { id: 'PO-87991', supplier: 'Apex Industrial Components', amount: 184000, status: 'Completed', due: '2026-04-18', closed: '2026-04-20' },
  { id: 'PO-87982', supplier: 'Vector Packaging Co.', amount: 76000, status: 'Cancelled', due: '2026-04-12', closed: '2026-04-09' },
  { id: 'PO-87964', supplier: 'Northstar Logistics', amount: 425000, status: 'Completed', due: '2026-03-29', closed: '2026-03-28' },
];

export function SupplierOrderHistory() {
  return (
    <div className="space-y-6">
      <PageHeader title="Order History" description="View completed, cancelled, and closed purchase orders." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <Archive className="h-6 w-6 text-emerald-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Completed Orders</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">3</p>
        </Card>
        <Card className="p-5">
          <RotateCcw className="h-6 w-6 text-amber-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Cancelled Orders</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">1</p>
        </Card>
      </div>
      <Card>
        <CardHeader title="Closed Orders" subtitle="Historical PO records and closure dates" />
        <DataTable
          data={historicalOrders}
          columns={[
            { key: 'id', header: 'PO' },
            { key: 'supplier', header: 'Buyer Account' },
            { key: 'amount', header: 'Amount', render: (row) => currency(row.amount) },
            { key: 'due', header: 'Commit Date' },
            { key: 'closed', header: 'Closed Date', render: (row) => row.closed || row.due },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </div>
  );
}
