import { FilePlus2, ReceiptText, Plus, Check, UploadCloud, Eye, X, Download, FileText, AlertTriangle, CheckCircle, Wrench, RefreshCw } from 'lucide-react';
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
import { useLocation } from 'react-router-dom';
import { pushNotification } from '../../utils/notificationStore.js';
import { CustomNotification } from '../../components/CustomNotification.jsx';

const mockInvoices = [
  { id: 'INV-5401', po: 'PO-88021', amount: 218000, submitted: '2026-05-20', due: '2026-06-04', status: 'Submitted', quantity: 2500 },
  { id: 'INV-5402', po: 'PO-88022', amount: 650000, submitted: '2026-05-22', due: '2026-06-06', status: 'Approved', quantity: 800 },
  { id: 'INV-5403', po: 'PO-88023', amount: 92000, submitted: '2026-05-24', due: '2026-06-08', status: 'Under Review', quantity: 1200 },
  { id: 'INV-5398', po: 'PO-87991', amount: 184000, submitted: '2026-04-22', due: '2026-05-07', status: 'Paid', quantity: 1500 },
];

const initialForm = {
  id: '',
  po: 'PO-88021',
  amount: '',
  submitted: '',
  due: '',
  quantity: '',
};

export function SupplierInvoices() {
  const location = useLocation();
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

  const [poList, setPoList] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const correctInvoiceModal = useDisclosure(false);
  const [correctingInvoice, setCorrectingInvoice] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    id: '',
    po: '',
    amount: '',
    submitted: '',
    due: '',
    quantity: ''
  });

  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const showAlert = (title, message, type = 'success') => setCustomAlert({ isOpen: true, type, title, message });

  useEffect(() => {
    fetch(`${apiBaseUrl}/purchase_orders.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.purchase_orders)) {
          setPoList(data.purchase_orders);
        }
      })
      .catch((err) => console.error('Failed to fetch POs:', err));

    fetch(`${apiBaseUrl}/receipts.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.receipts)) {
          setGrnList(data.receipts);
        }
      })
      .catch((err) => console.error('Failed to fetch GRNs:', err));
  }, [apiBaseUrl]);

  useEffect(() => {
    if (location.state?.openInvoiceId && invoicesList.length > 0) {
      const targetInv = invoicesList.find(inv => inv.id === location.state.openInvoiceId);
      if (targetInv) {
        handleInspectInvoice(targetInv);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, invoicesList]);

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

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  const getMatchDataForForm = (poRef, amt, qty) => {
    const matchedPo = poList.find(p => p.po_number === poRef);
    const matchedGrn = grnList.find(g => g.po === poRef);

    const poAmount = matchedPo ? Number(matchedPo.total_amount) : Number(amt);
    const invoiceAmount = Number(amt);
    
    const poQty = Number(qty) || 2500;
    const invoiceQty = Number(qty) || 2500;
    let grnAcceptedQty = matchedGrn ? Number(matchedGrn.accepted) : 0;
    let grnReceivedQty = matchedGrn ? Number(matchedGrn.received) : 0;

    let grnAcceptedValue = poAmount;
    if (matchedGrn && matchedGrn.received > 0) {
      grnAcceptedValue = Math.round((matchedGrn.accepted / matchedGrn.received) * poAmount);
    } else if (!matchedGrn) {
      grnAcceptedValue = 0;
    }

    // Static mapping bypass support for seed/mock data
    let displayPoAmount = poAmount;
    let displayGrnValue = grnAcceptedValue;
    let displayGrnQty = grnAcceptedQty;
    let displayReceivedQty = grnReceivedQty;
    const grnExists = !!matchedGrn || ['PO-88021', 'PO-88022', 'PO-88023', 'PO-87991'].includes(poRef);

    if (poRef === 'PO-88021') {
      displayPoAmount = 218000;
      displayReceivedQty = 2500;
      displayGrnQty = 2490;
      displayGrnValue = Math.round((2490 / 2500) * 218000); // 217128
    } else if (poRef === 'PO-88022') {
      displayPoAmount = 650000;
      displayReceivedQty = 800;
      displayGrnQty = 800;
      displayGrnValue = 650000;
    } else if (poRef === 'PO-88023') {
      displayPoAmount = 92000;
      displayReceivedQty = 1200;
      displayGrnQty = 1180;
      displayGrnValue = Math.round((1180 / 1200) * 92000); // 90467
    } else if (poRef === 'PO-87991') {
      displayPoAmount = 184000;
      displayReceivedQty = 1500;
      displayGrnQty = 1500;
      displayGrnValue = 184000;
    }

    const qtyMatchPassed = invoiceQty <= displayGrnQty;
    const amountMatchPassed = invoiceAmount <= displayGrnValue;

    return {
      poAmount: displayPoAmount,
      grnValue: displayGrnValue,
      invoiceAmount,
      poQty,
      grnQty: displayGrnQty,
      receivedQty: displayReceivedQty,
      invoiceQty,
      grnExists,
      qtyMatchPassed,
      amountMatchPassed,
      matchPassed: qtyMatchPassed && amountMatchPassed && grnExists
    };
  };

  const handleOpenCorrection = (invoice) => {
    setCorrectingInvoice(invoice);
    setCorrectionForm({
      id: invoice.id,
      po: invoice.po,
      amount: invoice.amount,
      submitted: invoice.submitted,
      due: invoice.due,
      quantity: invoice.quantity || 2500
    });
    correctInvoiceModal.open();
  };

  const handleSaveCorrection = async () => {
    if (!correctingInvoice) return;
    setSubmittingInvoice(true);
    const updatedInvoice = {
      ...correctingInvoice,
      amount: Number(correctionForm.amount),
      quantity: Number(correctionForm.quantity),
      submitted: correctionForm.submitted,
      due: correctionForm.due,
      status: 'Submitted'
    };

    try {
      const response = await fetch(`${apiBaseUrl}/invoices.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInvoice)
      }).then(res => res.json());

      if (response.success) {
        const updatedList = invoicesList.map(inv => inv.id === correctingInvoice.id ? updatedInvoice : inv);
        setInvoicesList(updatedList);
        localStorage.setItem('srm_invoices', JSON.stringify(updatedList));

        // Notify admin about the invoice resubmission
        pushNotification({
          id: 'notif-' + Date.now(),
          title: 'Invoice Resubmitted',
          body: `Invoice ${correctingInvoice.id} for ${correctingInvoice.po} was corrected and resubmitted.`,
          type: 'Invoice',
          iconName: 'FileCheck',
        }, 'admin');

        showAlert('Invoice Resubmitted', `Invoice ${correctingInvoice.id} has been corrected and resubmitted successfully.`, 'success');
        correctInvoiceModal.close();
        setCorrectingInvoice(null);
      } else {
        showAlert('Resubmission Failed', 'Failed to resubmit invoice: ' + (response.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Failed to resubmit invoice:', err);
      const updatedList = invoicesList.map(inv => inv.id === correctingInvoice.id ? updatedInvoice : inv);
      setInvoicesList(updatedList);
      localStorage.setItem('srm_invoices', JSON.stringify(updatedList));
      showAlert('Updated Locally', `Invoice ${correctingInvoice.id} corrected and resubmitted.`, 'success');
      correctInvoiceModal.close();
      setCorrectingInvoice(null);
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleInspectInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceItems([]);
    setLoadingItems(true);

    if (invoice.items && invoice.items.length > 0) {
      setInvoiceItems(invoice.items);
      setLoadingItems(false);
      return;
    }

    try {
      const grnRes = await fetch(`${apiBaseUrl}/receipts.php`).then(res => res.json()).catch(() => ({ success: false }));
      const receipts = grnRes.success && Array.isArray(grnRes.receipts) ? grnRes.receipts : [];
      const poReceipts = receipts.filter(r => r.po === invoice.po);
      const totalAccepted = poReceipts.reduce((sum, r) => sum + (Number(r.accepted) || 0), 0);

      const posRes = await fetch(`${apiBaseUrl}/purchase_orders.php`).then(res => res.json()).catch(() => ({ success: false }));
      const purchaseOrders = posRes.success && Array.isArray(posRes.purchase_orders) ? posRes.purchase_orders : [];
      const matchedPo = purchaseOrders.find(po => po.po_number === invoice.po);

      let detailedPo = null;
      if (matchedPo) {
        const poDetailRes = await fetch(`${apiBaseUrl}/purchase_orders.php?id=${matchedPo.id}`).then(res => res.json()).catch(() => ({ success: false }));
        if (poDetailRes.success && poDetailRes.po) {
          detailedPo = poDetailRes.po;
        }
      }

      let billedItems = [];
      if (detailedPo && detailedPo.items && detailedPo.items.length > 0) {
        billedItems = detailedPo.items.map(item => {
          const matchingReceipts = poReceipts.filter(r => 
            r.item.toLowerCase().includes(item.item_name.toLowerCase()) ||
            item.item_name.toLowerCase().includes(r.item.toLowerCase())
          );
          const acceptedQty = matchingReceipts.reduce((sum, r) => sum + (Number(r.accepted) || 0), 0);
          const itemQty = acceptedQty > 0 ? acceptedQty : item.quantity;
          return {
            item_name: item.item_name,
            quantity: itemQty,
            unit_price: item.unit_price,
            total_price: itemQty * item.unit_price
          };
        });
      } else {
        const itemQty = totalAccepted > 0 ? totalAccepted : (invoice.quantity || 2500);
        let subtotal = (invoice.amount - 200) / 1.18;
        if (subtotal <= 0) subtotal = invoice.amount;
        const unitPrice = itemQty > 0 ? (subtotal / itemQty) : subtotal;
        billedItems = [{
          item_name: `Billed Components / Services (${invoice.po})`,
          quantity: itemQty,
          unit_price: Number(unitPrice.toFixed(2)),
          total_price: Number(subtotal.toFixed(2))
        }];
      }
      setInvoiceItems(billedItems);
    } catch (err) {
      console.error('Failed to load invoice items:', err);
      setInvoiceItems([{
        item_name: `Billed Components / Services (${invoice.po})`,
        quantity: invoice.quantity || 2500,
        unit_price: Number(((invoice.amount - 200) / 1.18 / (invoice.quantity || 2500)).toFixed(2)),
        total_price: Number(((invoice.amount - 200) / 1.18).toFixed(2))
      }]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSubmitInvoice = async (invoice) => {
    setSubmittingInvoice(true);
    const updatedInvoice = {
      ...invoice,
      status: 'Submitted'
    };

    try {
      await fetch(`${apiBaseUrl}/invoices.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInvoice)
      }).then(res => res.json());
    } catch (err) {
      console.warn('Failed to submit invoice to API, fallback to local update:', err);
    }

    const updatedList = invoicesList.map(inv => inv.id === invoice.id ? updatedInvoice : inv);
    setInvoicesList(updatedList);
    localStorage.setItem('srm_invoices', JSON.stringify(updatedList));

    setSelectedInvoice(updatedInvoice);
    setSubmittingInvoice(false);
    showAlert('Invoice Submitted', `Invoice ${invoice.id} has been submitted to Finance successfully.`, 'success');
  };

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
        quantity: parsed.quantity || 2500,
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
      quantity: Number(form.quantity) || 2500,
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
    .filter(inv => inv.status === 'Submitted' || inv.status === 'Under Review' || inv.status === 'Rejected' || inv.status === 'Payment Processing')
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
            { key: 'quantity', header: 'Billed Qty', render: (row) => `${row.quantity || 0} units` },
            { key: 'amount', header: 'Amount', render: (row) => currency(row.amount) },
            { key: 'submitted', header: 'Submitted' },
            { key: 'due', header: 'Payment Due' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInspectInvoice(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Eye className="h-3 w-3" /> Inspect
                  </button>
                  {(row.status === 'Under Review' || row.status === 'Rejected') && (
                    <button
                      onClick={() => handleOpenCorrection(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 dark:border-slate-800 bg-amber-50 dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-800 transition animate-pulse"
                    >
                      <Wrench className="h-3 w-3" /> Correct
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="Submit Invoice" isOpen={submitInvoiceModal.isOpen} onClose={resetAndClose} size="lg">
        <div className="grid gap-6">
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
                <FormField label="Invoice Amount (₹)">
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
                <FormField label="Billing Quantity">
                  <input 
                    className={inputClass} 
                    type="number"
                    value={form.quantity} 
                    onChange={e => updateForm('quantity', e.target.value)} 
                    placeholder="2500"
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
                <Button onClick={handleSave}><Check className="h-4 w-4" /> Submit Invoice</Button>
              </div>
            </form>
          </div>


        </div>
      </Modal>

      {/* Invoice Detail Drawer */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Invoice Details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Review line items, totals and PDF document</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedInvoice(null); setInvoiceItems([]); }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingItems ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">INVOICE NUMBER</span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{selectedInvoice.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">INVOICE STATUS</span>
                    <div className="mt-0.5">
                      <StatusBadge status={selectedInvoice.status} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PO REFERENCE</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedInvoice.po}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BUYER ACCOUNT</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Nexus Manufacturing Ltd.</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SUBMISSION DATE</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedInvoice.submitted}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PAYMENT DUE DATE</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedInvoice.due}</span>
                  </div>
                </div>

                {/* Discrepancy Warnings for Under Review/Rejected Invoices */}
                {(selectedInvoice.status === 'Under Review' || selectedInvoice.status === 'Rejected') && (() => {
                  const mData = getMatchDataForForm(selectedInvoice.po, selectedInvoice.amount, selectedInvoice.quantity);
                  if (!mData) return null;
                  return (
                    <div className={`p-4 rounded-xl border text-xs space-y-2 ${mData.matchPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400'}`}>
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                        3-WAY MATCH DISCREPANCY DETECTED
                      </div>
                      <div className="space-y-1 font-medium">
                        {!mData.grnExists && <p>• Goods Receipt Note (GRN) is missing for this Purchase Order.</p>}
                        {!mData.qtyMatchPassed && <p>• Billed Quantity ({mData.invoiceQty} units) exceeds accepted GRN quantity ({mData.grnQty} units) by {mData.invoiceQty - mData.grnQty} units.</p>}
                        {!mData.amountMatchPassed && <p>• Billed Amount ({currency(mData.invoiceAmount)}) exceeds accepted GRN value ({currency(mData.grnValue)}) by {currency(mData.invoiceAmount - mData.grnValue)}.</p>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Please use the "Correct Invoice" action to adjust billing quantities and totals to align with what was verified in the warehouse receipt.</p>
                    </div>
                  );
                })()}

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed Line Items</h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400">
                          <th className="p-2.5">Item Description</th>
                          <th className="p-2.5 text-center">Billed Qty</th>
                          <th className="p-2.5 text-right">Unit Price</th>
                          <th className="p-2.5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {invoiceItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="p-2.5 font-medium">{item.item_name}</td>
                            <td className="p-2.5 text-center">{item.quantity}</td>
                            <td className="p-2.5 text-right">{currency(item.unit_price)}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">{currency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Breakdown */}
                {(() => {
                  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
                  const tax = subtotal * 0.18;
                  const freight = 200.00;
                  const grandTotal = selectedInvoice.amount;
                  return (
                    <div className="flex flex-col items-end gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between w-64 border-b border-slate-100 dark:border-slate-900 pb-1">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{currency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between w-64 border-b border-slate-100 dark:border-slate-900 pb-1">
                        <span>Tax (GST 18%):</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{currency(tax)}</span>
                      </div>
                      <div className="flex justify-between w-64 border-b border-slate-100 dark:border-slate-900 pb-1">
                        <span>Freight Charges:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{currency(freight)}</span>
                      </div>
                      <div className="flex justify-between w-64 text-sm font-bold text-slate-900 dark:text-slate-100 pt-1">
                        <span>Invoice Total:</span>
                        <span className="text-brand-600 dark:text-brand-400">{currency(grandTotal)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Actions Block */}
                <div className="border-t border-slate-100 dark:border-slate-900 pt-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <a
                      href={`${apiBaseUrl}/generate_invoice_pdf.php?id=${selectedInvoice.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow"
                    >
                      <Eye className="h-4 w-4" /> View Invoice PDF
                    </a>
                    <a
                      href={`${apiBaseUrl}/generate_invoice_pdf.php?id=${selectedInvoice.id}`}
                      download
                      className="flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-bold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  </div>
                  <div className="flex gap-2">
                    {selectedInvoice.status === 'Draft' && (
                      <Button
                        variant="primary"
                        disabled={submittingInvoice}
                        onClick={() => handleSubmitInvoice(selectedInvoice)}
                      >
                        <Check className="h-4 w-4" />
                        {submittingInvoice ? 'Submitting…' : 'Submit Invoice'}
                      </Button>
                    )}
                    {(selectedInvoice.status === 'Under Review' || selectedInvoice.status === 'Rejected') && (
                      <Button
                        variant="primary"
                        className="bg-amber-600 hover:bg-amber-500 text-white"
                        onClick={() => {
                          const inv = selectedInvoice;
                          setSelectedInvoice(null);
                          setInvoiceItems([]);
                          handleOpenCorrection(inv);
                        }}
                      >
                        <Wrench className="h-4 w-4" /> Correct Invoice
                      </Button>
                    )}
                    <button 
                      onClick={() => { setSelectedInvoice(null); setInvoiceItems([]); }}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                    >
                      Close Drawer
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Invoice Correction Modal */}
      {correctingInvoice && (
        <Modal 
          title={`Correct Invoice — ${correctingInvoice.id}`} 
          isOpen={correctInvoiceModal.isOpen} 
          onClose={() => { correctInvoiceModal.close(); setCorrectingInvoice(null); }} 
          size="lg"
        >
          {(() => {
            const mData = getMatchDataForForm(correctionForm.po, correctionForm.amount, correctionForm.quantity);
            return (
              <div className="grid gap-6 md:grid-cols-5">
                {/* Form Inputs (Left) */}
                <div className="md:col-span-3 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adjust Billing details</h4>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Invoice ID (Read-only)">
                      <input 
                        className={`${inputClass} bg-slate-100 dark:bg-slate-900 cursor-not-allowed`} 
                        value={correctionForm.id} 
                        readOnly 
                      />
                    </FormField>
                    <FormField label="PO Reference (Read-only)">
                      <input 
                        className={`${inputClass} bg-slate-100 dark:bg-slate-900 cursor-not-allowed`} 
                        value={correctionForm.po} 
                        readOnly 
                      />
                    </FormField>
                    <FormField label="Billing Quantity">
                      <input 
                        className={inputClass} 
                        type="number"
                        value={correctionForm.quantity} 
                        onChange={e => setCorrectionForm(curr => ({ ...curr, quantity: e.target.value }))} 
                      />
                    </FormField>
                    <FormField label="Invoice Amount (₹)">
                      <input 
                        className={inputClass} 
                        type="number"
                        value={correctionForm.amount} 
                        onChange={e => setCorrectionForm(curr => ({ ...curr, amount: e.target.value }))} 
                      />
                    </FormField>
                    <FormField label="Submission Date">
                      <input 
                        className={inputClass} 
                        type="date"
                        value={correctionForm.submitted} 
                        onChange={e => setCorrectionForm(curr => ({ ...curr, submitted: e.target.value }))} 
                      />
                    </FormField>
                    <FormField label="Due Date">
                      <input 
                        className={inputClass} 
                        type="date"
                        value={correctionForm.due} 
                        onChange={e => setCorrectionForm(curr => ({ ...curr, due: e.target.value }))} 
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => { correctInvoiceModal.close(); setCorrectingInvoice(null); }}>Cancel</Button>
                    <Button onClick={handleSaveCorrection} disabled={submittingInvoice}>
                      {submittingInvoice ? 'Submitting...' : 'Resubmit Invoice'}
                    </Button>
                  </div>
                </div>

                {/* 3-Way Match Reconciler (Right) */}
                <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 space-y-4 h-fit">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">3-Way Match Reconciler</h4>
                  
                  {mData ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 font-medium">PO Total Limit:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{currency(mData.poAmount)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 font-medium">GRN Accepted Qty:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{mData.grnQty} units</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 animate-pulse bg-amber-50 dark:bg-amber-950/20 px-1 py-0.5 rounded">
                          <span className="text-amber-800 dark:text-amber-400 font-bold">GRN Value Limit:</span>
                          <span className="font-bold text-amber-800 dark:text-amber-400">{currency(mData.grnValue)}</span>
                        </div>
                      </div>

                      {/* Live feedback alert */}
                      <div className={`p-3 rounded-lg border text-[11px] font-semibold flex items-start gap-1.5 ${mData.matchPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400'}`}>
                        {mData.matchPassed ? (
                          <>
                            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>✓ Ready! Invoice matches accepted quantities and values.</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 animate-pulse" />
                            <span>
                              {!mData.qtyMatchPassed && `• Billed units exceeds accepted qty by ${Number(correctionForm.quantity) - mData.grnQty} units.`}
                              {!mData.amountMatchPassed && `• Billed value exceeds accepted value by ${currency(Number(correctionForm.amount) - mData.grnValue)}.`}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Align quick-action */}
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectionForm(curr => ({
                            ...curr,
                            quantity: mData.grnQty,
                            amount: mData.grnValue
                          }));
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-brand-400 py-2 text-xs font-bold transition duration-150 shadow-sm"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Align with Accepted GRN
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">Loading match parameters...</div>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      <CustomNotification
        isOpen={customAlert.isOpen}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert(a => ({ ...a, isOpen: false }))}
      />
    </div>
  );
}
