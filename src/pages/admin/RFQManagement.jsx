import { Link } from 'react-router-dom';
import { CalendarPlus, Plus } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { rfqs } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function RFQManagement() {
  return (
    <div className="space-y-6">
      <PageHeader title="RFQ Management" description="Create, publish, evaluate, and award sourcing events." />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Create RFQ" subtitle="Draft a new sourcing request" />
          <form className="space-y-4 p-5">
            <FormField label="RFQ title">
              <input className={inputClass} placeholder="Material or service requirement" />
            </FormField>
            <FormField label="Category">
              <select className={inputClass}>
                <option>Manufacturing</option>
                <option>Logistics</option>
                <option>Facilities</option>
                <option>Services</option>
              </select>
            </FormField>
            <FormField label="Deadline">
              <input className={inputClass} type="date" />
            </FormField>
            <FormField label="Target value">
              <input className={inputClass} placeholder="$500,000" />
            </FormField>
            <Button>
              <CalendarPlus className="h-4 w-4" />
              Save RFQ
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="RFQ List" subtitle="Current sourcing events" action={<Button><Plus className="h-4 w-4" /> New RFQ</Button>} />
          <DataTable
            data={rfqs}
            columns={[
              { key: 'id', header: 'RFQ' },
              { key: 'title', header: 'Title', render: (row) => <Link className="font-semibold text-brand-700" to={`/admin/rfqs/${row.id}`}>{row.title}</Link> },
              { key: 'category', header: 'Category' },
              { key: 'deadline', header: 'Deadline' },
              { key: 'bids', header: 'Bids' },
              { key: 'value', header: 'Value', render: (row) => currency(row.value) },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
