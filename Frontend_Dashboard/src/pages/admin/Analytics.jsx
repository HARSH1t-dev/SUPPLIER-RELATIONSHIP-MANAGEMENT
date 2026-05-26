import { Card, CardHeader } from '../../components/Card.jsx';
import { OrdersChart, RfqPieChart, SpendChart } from '../../components/Charts.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { orderSummary, procurementSpend, rfqActivity } from '../../data/mockData.js';

export function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Strategic procurement performance, spend movement, and RFQ conversion visibility." />
      <Card>
        <CardHeader title="Spend by Category" />
        <div className="p-5">
          <SpendChart data={procurementSpend} />
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Order Throughput" />
          <div className="p-5">
            <OrdersChart data={orderSummary} />
          </div>
        </Card>
        <Card>
          <CardHeader title="RFQ Conversion" />
          <div className="p-5">
            <RfqPieChart data={rfqActivity} />
          </div>
        </Card>
      </div>
    </div>
  );
}
