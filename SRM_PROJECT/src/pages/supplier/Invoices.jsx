import { FilePlus2, ReceiptText, Plus, Check, UploadCloud } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { currency } from '../../utils/formatters.js';
import { useState, useEffect } from 'react';

const mockInvoices = [
  { id: 'INV-5401', po: 'PO-88021', amount: 218000, submitted: '2026-05-20', due: '2026-06-04', status: 'Submitted' },
  { id: 'INV-5402', po: 'PO-88022', amount: 650000, submitted: '2026-05-22', due: '2026-06-06', status: 'Approved' },
  { id: 'INV-5403', po: 'PO-88023', amount: 92000, submitted: '2026-05-24', due: '2026-06-08', status: 'Pending' },
  { id: 'INV-5398', po: 'PO-87991', amount: 184000, submitted: '2026-04-22', due: '2026-05-07', status: 'Paid' },
];

const initialForm = {
  id: '',
  po: 'PO-88021',
  amount: '',
  submitted: '',
  due: '',
};

export function SupplierInvoices() {
  const submitInvoiceModal = useDisclosure(false);
  const [invoicesList, setInvoicesList] = useState(() => {
    const saved = localStorage.getItem('srm_invoices');
    if (saved) return JSON.parse(saved);
    return mockInvoices;
  });
  
  const [form, setForm] = useState(initialForm);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
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
  }, [apiBaseUrl]);

  const updateForm = (field, value) => {
    setForm(curr => ({ ...curr, [field]: value }));
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsing(true);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(URL.createObjectURL(file));
    try {
      const { extractTextFromPdf, parseInvoicePdf } = await import('../../utils/pdfParser.js');
      const text = await extractTextFromPdf(file);
      const parsed = parseInvoicePdf(text, file.name);
      setForm({
        id: parsed.id,
        po: parsed.po,
        amount: parsed.amount,
        submitted: parsed.submitted,
        due: parsed.due,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const resetAndClose = () => {
    setForm(initialForm);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    submitInvoiceModal.close();
  };

  const handleSave = () => {
    const newInvoice = {
      id: form.id || 'INV-' + Math.floor(5400 + Math.random() * 100),
      po: form.po,
      amount: Number(form.amount) || 150000,
      submitted: form.submitted || new Date().toISOString().split('T')[0],
      due: form.due || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Submitted',
    };
    const updated = [newInvoice, ...invoicesList];
    setInvoicesList(updated);
    localStorage.setItem('srm_invoices', JSON.stringify(updated));

    fetch(`${apiBaseUrl}/invoices.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice),
    })
      .then((res) => res.json())
      .catch((err) => console.error('Failed to sync Invoice to database:', err));

    resetAndClose();
  };

  // Calculate totals dynamically
  const outstanding = invoicesList
    .filter(inv => inv.status === 'Submitted' || inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const approved = invoicesList
    .filter(inv => inv.status === 'Approved')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const paid = invoicesList
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Submit invoices, track approval status, and monitor payment timelines."
        action={
          <Button onClick={submitInvoiceModal.open}>
            <FilePlus2 className="h-4 w-4" />
            Submit Invoice
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <ReceiptText className="h-6 w-6 text-blue-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{currency(outstanding)}</p>
        </Card>
        <Card className="p-5">
          <ReceiptText className="h-6 w-6 text-emerald-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{currency(approved)}</p>
        </Card>
        <Card className="p-5">
          <ReceiptText className="h-6 w-6 text-violet-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Paid</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{currency(paid)}</p>
        </Card>
      </div>
      <Card>
        <CardHeader title="Invoice Tracker" subtitle="Submitted invoices and payment status" />
        <DataTable
          data={invoicesList}
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

      <Modal title="Submit Invoice" isOpen={submitInvoiceModal.isOpen} onClose={resetAndClose} size={pdfBlobUrl ? 'xxl' : 'lg'}>
        <div className={`grid gap-6 ${pdfBlobUrl ? 'md:grid-cols-2' : ''}`}>
          <div>
            <div className="mb-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5 text-center transition hover:bg-slate-100/50 dark:hover:bg-slate-900">
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-full bg-blue-50 dark:bg-blue-950/40 p-2.5 text-blue-600 dark:text-blue-400 mb-2">
                  <UploadCloud className={`h-5 w-5 ${isParsing ? 'animate-bounce' : ''}`} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Auto-fill from Document
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                  Upload a commercial invoice PDF to automatically extract billing fields
                </p>
                
                <input
                  type="file"
                  accept=".pdf"
                  id="invoices-pdf-upload-input"
                  className="hidden"
                  onChange={handlePdfUpload}
                  disabled={isParsing}
                />
                <label
                  htmlFor="invoices-pdf-upload-input"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-150 mb-2.5"
                >
                  Choose PDF File
                </label>

                <div className="flex items-center justify-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Or get a template:</span>
                  <a 
                    href={`${import.meta.env.BASE_URL}samples/supplier-invoice.pdf`} 
                    download 
                    className="text-brand-600 hover:text-brand-500 hover:underline font-semibold"
                  >
                    Download Sample Invoice
                  </a>
                </div>
                
                {isParsing && (
                  <p className="mt-3 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
                    Analyzing invoice document...
                  </p>
                )}
              </div>
            </div>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Invoice Number">
                  <input 
                    className={inputClass} 
                    value={form.id} 
                    onChange={e => updateForm('id', e.target.value)} 
                    placeholder="e.g. INV-5404"
                  />
                </FormField>
                <FormField label="PO Reference">
                  <input 
                    className={inputClass} 
                    value={form.po} 
                    onChange={e => updateForm('po', e.target.value)} 
                    placeholder="e.g. PO-88021"
                  />
                </FormField>
                <FormField label="Invoice Amount ($)">
                  <input 
                    className={inputClass} 
                    type="number"
                    value={form.amount} 
                    onChange={e => updateForm('amount', e.target.value)} 
                    placeholder="150000"
                  />
                </FormField>
                <FormField label="Submission Date">
                  <input 
                    className={inputClass} 
                    type="date"
                    value={form.submitted} 
                    onChange={e => updateForm('submitted', e.target.value)} 
                  />
                </FormField>
                <FormField label="Payment Due Date">
                  <input 
                    className={inputClass} 
                    type="date"
                    value={form.due} 
                    onChange={e => updateForm('due', e.target.value)} 
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
                <Button onClick={handleSave}><Check className="h-4 w-4" /> Submit Invoice</Button>
              </div>
            </form>
          </div>

          {pdfBlobUrl && (
            <div className="flex flex-col h-[520px] rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 p-2">
              <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <span>Verification Invoice Document View</span>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(pdfBlobUrl);
                    setPdfBlobUrl(null);
                  }}
                  className="text-rose-600 hover:underline"
                >
                  Hide PDF
                </button>
              </div>
              <iframe
                src={pdfBlobUrl}
                title="PDF Verification"
                className="w-full flex-1 rounded border border-slate-200 dark:border-slate-800 bg-white"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
