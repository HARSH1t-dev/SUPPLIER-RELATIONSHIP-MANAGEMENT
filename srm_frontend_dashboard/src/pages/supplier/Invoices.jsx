import { FilePlus2, ReceiptText } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';

const invoices = [
  { id: 'INV-5401', po: 'PO-88021', amount: 218000, submitted: '2026-05-20', due: '2026-06-04', status: 'Submitted' },
  { id: 'INV-5402', po: 'PO-88022', amount: 650000, submitted: '2026-05-22', due: '2026-06-06', status: 'Approved' },
  { id: 'INV-5403', po: 'PO-88023', amount: 92000, submitted: '2026-05-24', due: '2026-06-08', status: 'Pending' },
  { id: 'INV-5398', po: 'PO-87991', amount: 184000, submitted: '2026-04-22', due: '2026-05-07', status: 'Paid' },
];

export function SupplierInvoices() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Submit invoices, track approval status, and monitor payment timelines."
        action={
          <Button>
            <FilePlus2 className="h-4 w-4" />
            Submit Invoice
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <ReceiptText className="h-6 w-6 text-blue-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{currency(310000)}</p>
        </Card>
        <Card className="p-5">
          <ReceiptText className="h-6 w-6 text-emerald-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{currency(650000)}</p>
        </Card>
        <Card className="p-5">
          <ReceiptText className="h-6 w-6 text-violet-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Paid</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{currency(184000)}</p>
        </Card>
      </div>
      <Card>
        <CardHeader title="Invoice Tracker" subtitle="Submitted invoices and payment status" />
        <DataTable
          data={invoices}
          columns={[
            { key: 'id', header: 'Invoice' },
            { key: 'po', header: 'PO' },
            { key: 'amount', header: 'Amount', render: (row) => currency(row.amount) },
            { key: 'submitted', header: 'Submitted' },
            { key: 'due', header: 'Payment Due' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </div>
  );
}
