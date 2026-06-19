import { Send } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { rfqs } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function SupplierRFQs() {
  return (
    <>
      <PageHeader title="RFQs" description="Review buyer sourcing events and submit supplier responses." />
      <Card>
        <CardHeader title="RFQ Invitations" subtitle="Open and evaluating opportunities" />
        <DataTable
          data={rfqs.filter((rfq) => rfq.status !== 'Draft')}
          columns={[
            { key: 'id', header: 'RFQ' },
            { key: 'title', header: 'Title' },
            { key: 'category', header: 'Category' },
            { key: 'deadline', header: 'Deadline' },
            { key: 'value', header: 'Value', render: (row) => currency(row.value) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            { key: 'action', header: 'Action', render: () => <Button variant="secondary"><Send className="h-4 w-4" /> Bid</Button> },
          ]}
        />
      </Card>
    </>
  );
}
