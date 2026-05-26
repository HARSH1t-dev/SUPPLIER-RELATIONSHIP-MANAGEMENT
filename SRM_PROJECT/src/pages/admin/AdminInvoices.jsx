import { Check, CreditCard, Ban } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/Button.jsx';
import { currency } from '../../utils/formatters.js';
import { useState, useEffect } from 'react';

const mockInvoices = [
  { id: 'INV-5401', po: 'PO-88021', amount: 218000, submitted: '2026-05-20', due: '2026-06-04', status: 'Submitted' },
  { id: 'INV-5402', po: 'PO-88022', amount: 650000, submitted: '2026-05-22', due: '2026-06-06', status: 'Approved' },
  { id: 'INV-5403', po: 'PO-88023', amount: 92000, submitted: '2026-05-24', due: '2026-06-08', status: 'Pending' },
  { id: 'INV-5398', po: 'PO-87991', amount: 184000, submitted: '2026-04-22', due: '2026-05-07', status: 'Paid' },
];

export function AdminInvoices() {
  const [invoicesList, setInvoicesList] = useState(() => {
    const saved = localStorage.getItem('srm_invoices');
    if (saved) return JSON.parse(saved);
    return mockInvoices;
  });

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  const fetchInvoices = () => {
    fetch(`${apiBaseUrl}/invoices.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.invoices)) {
          setInvoicesList(data.invoices);
          localStorage.setItem('srm_invoices', JSON.stringify(data.invoices));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Invoices from API, using localStorage:', err);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, [apiBaseUrl]);

  const updateInvoiceStatus = (invoice, newStatus) => {
    const updatedInvoice = { ...invoice, status: newStatus };
    
    // Update local state and localStorage
    const updatedList = invoicesList.map((inv) => inv.id === invoice.id ? updatedInvoice : inv);
    setInvoicesList(updatedList);
    localStorage.setItem('srm_invoices', JSON.stringify(updatedList));

    // Post to API
    fetch(`${apiBaseUrl}/invoices.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedInvoice),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchInvoices(); // Refresh from backend to ensure data integrity
        }
      })
      .catch((err) => console.error('Failed to update invoice status:', err));
  };

  const outstanding = invoicesList
    .filter((x) => x.status === 'Submitted' || x.status === 'Pending')
    .reduce((sum, x) => sum + x.amount, 0);

  const approved = invoicesList
    .filter((x) => x.status === 'Approved')
    .reduce((sum, x) => sum + x.amount, 0);

  const paid = invoicesList
    .filter((x) => x.status === 'Paid')
    .reduce((sum, x) => sum + x.amount, 0);

  return (
    <>
      <PageHeader 
        title="Supplier Invoices" 
        description="Review supplier invoice submissions, approve billings, and record outbound payments." 
      />
      
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-500">Awaiting Action</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{currency(outstanding)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-500">Approved (Unpaid)</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{currency(approved)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-500">Paid</p>
          <p className="mt-2 text-3xl font-bold text-violet-700">{currency(paid)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Invoice Approval Workbench" subtitle="Review and approve billing requests" />
        <DataTable
          data={invoicesList}
          columns={[
            { key: 'id', header: 'Invoice ID' },
            { key: 'po', header: 'PO Ref' },
            { key: 'amount', header: 'Amount', render: (row) => currency(row.amount) },
            { key: 'submitted', header: 'Submitted' },
            { key: 'due', header: 'Payment Due' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex gap-2">
                  {(row.status === 'Submitted' || row.status === 'Pending') && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-2 py-0 text-xs font-semibold border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                        onClick={() => updateInvoiceStatus(row, 'Approved')}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      {row.status !== 'Pending' && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 px-2 py-0 text-xs font-semibold border-rose-200 hover:bg-rose-50 text-rose-700"
                          onClick={() => updateInvoiceStatus(row, 'Pending')}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      )}
                    </>
                  )}
                  {row.status === 'Approved' && (
                    <Button
                      type="button"
                      className="h-8 px-2 py-0 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white"
                      onClick={() => updateInvoiceStatus(row, 'Paid')}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1" /> Record Payment
                    </Button>
                  )}
                  {row.status === 'Paid' && (
                    <span className="text-xs font-medium text-slate-400">No actions pending</span>
                  )}
                  {row.status === 'Pending' && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-2 py-0 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-600"
                      onClick={() => updateInvoiceStatus(row, 'Submitted')}
                    >
                      Reset to Review
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
