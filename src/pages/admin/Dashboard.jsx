import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { OrdersChart, RfqPieChart, SpendChart } from '../../components/Charts.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { activity, adminStats, orderSummary, procurementSpend, rfqActivity } from '../../data/mockData.js';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader title="Procurement Analytics" subtitle="Spend trend by procurement category" />
          <div className="p-5">
            <SpendChart data={procurementSpend} />
          </div>
        </Card>
        <Card>
          <CardHeader title="RFQ Activity" subtitle="Current sourcing pipeline" />
          <div className="p-5">
            <RfqPieChart data={rfqActivity} />
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Order Summaries" subtitle="Created vs fulfilled purchase orders" />
          <div className="p-5">
            <OrdersChart data={orderSummary} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent Activity" subtitle="Operational events across the procurement network" />
          <DataTable
            data={activity}
            columns={[
              { key: 'event', header: 'Event' },
              { key: 'owner', header: 'Owner' },
              { key: 'time', header: 'Time' },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
