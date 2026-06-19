import { BellRing } from 'lucide-react';
import { Alert } from '../../components/Alert.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { activity, notifications, purchaseOrders, rfqs, supplierStats } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function SupplierDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {supplierStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <Alert>
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4" />
          {notifications[0]}
        </div>
      </Alert>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Open RFQs" subtitle="Invitations requiring supplier response" />
          <DataTable
            data={rfqs.filter((rfq) => rfq.status !== 'Draft')}
            columns={[
              { key: 'id', header: 'RFQ' },
              { key: 'title', header: 'Title' },
              { key: 'deadline', header: 'Deadline' },
              { key: 'value', header: 'Value', render: (row) => currency(row.value) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Active Orders" subtitle="Purchase orders in execution" />
          <DataTable
            data={purchaseOrders}
            columns={[
              { key: 'id', header: 'PO' },
              { key: 'amount', header: 'Amount', render: (row) => currency(row.amount) },
              { key: 'due', header: 'Due' },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </Card>
      </div>
      <Card>
        <CardHeader title="Activity Feed" subtitle="Supplier workspace events" />
        <DataTable
          data={activity}
          columns={[
            { key: 'event', header: 'Event' },
            { key: 'time', header: 'Time' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </div>
  );
}
