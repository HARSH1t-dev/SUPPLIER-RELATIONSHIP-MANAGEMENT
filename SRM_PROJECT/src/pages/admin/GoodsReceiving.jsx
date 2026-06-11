import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Check, UploadCloud, Star, Users, AlertTriangle, Clock,
  RefreshCw, FileText, Award, BarChart3, ShieldAlert, PackageOpen, Loader2
} from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { receiving as mockReceiving } from '../../data/mockData.js';
import { number, currency } from '../../utils/formatters.js';
import { pushNotification } from '../../utils/notificationStore.js';
import { CustomNotification } from '../../components/CustomNotification.jsx';

const initialForm = {
  receipt: '',
  po: 'PO-88021',
  item: 'Industrial Bearings',
  received: 2500,
  accepted: 2490,
  items: [{ name: 'Industrial Bearings', received: 2500, accepted: 2490 }]
};

export function GoodsReceiving() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadGrnModal = useDisclosure(false);
  const submitReviewModal = useDisclosure(false);

  // Success screen state
  const [grnSuccessData, setGrnSuccessData] = useState(null);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState(null);

  // Custom alert state
  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const showAlert = (title, message, type = 'success') => setCustomAlert({ isOpen: true, type, title, message });

  // Core Data Lists
  const [receiptsList, setReceiptsList] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('receipts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  
  // GRN Form States
  const [form, setForm] = useState(initialForm);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Review Form States
  const [ratingPo, setRatingPo] = useState(null);
  const [formReviewText, setFormReviewText] = useState('');
  const [formRatingQuality, setFormRatingQuality] = useState(5);
  const [formRatingPrice, setFormRatingPrice] = useState(5);
  const [formRatingDelivery, setFormRatingDelivery] = useState(5);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const currentUser = useMemo(() => {
    const stored = sessionStorage.getItem('srm_user');
    return stored ? JSON.parse(stored) : { id: 1, fullName: 'Admin User' };
  }, []);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Receipts
      const recRes = await fetch(`${apiBaseUrl}/receipts.php`).then(res => res.json());
      if (recRes.success && Array.isArray(recRes.receipts)) {
        setReceiptsList(recRes.receipts);
        localStorage.setItem('srm_receipts', JSON.stringify(recRes.receipts));
      }

      // 2. Fetch POs
      const poRes = await fetch(`${apiBaseUrl}/purchase_orders.php`).then(res => res.json());
      if (poRes.success && Array.isArray(poRes.purchase_orders)) {
        setPurchaseOrders(poRes.purchase_orders);
      }

      // 3. Fetch Invoices
      const invRes = await fetch(`${apiBaseUrl}/invoices.php`).then(res => res.json());
      if (invRes.success && Array.isArray(invRes.invoices)) {
        setInvoicesList(invRes.invoices);
        localStorage.setItem('srm_invoices', JSON.stringify(invRes.invoices));
      }

      // 4. Fetch Suppliers/Scorecards
      const supRes = await fetch(`${apiBaseUrl}/ratings.php`).then(res => res.json());
      if (supRes.success && Array.isArray(supRes.suppliers)) {
        setSuppliers(supRes.suppliers);
      }
    } catch (err) {
      console.warn('API fetch failed. Falling back to local sandbox data.', err);
      // Seeding mock fallback states
      const cachedReceipts = localStorage.getItem('srm_receipts');
      setReceiptsList(cachedReceipts ? JSON.parse(cachedReceipts) : mockReceiving);

      setPurchaseOrders([
        { id: 1, po_number: 'PO-88021', supplier_name: 'Apex Industrial Components', db_supplier_id: 1, status: 'delivered', order_date: 'May 20, 2026', total_amount: 120000 },
        { id: 2, po_number: 'PO-88022', supplier_name: 'Vector Packaging Co.', db_supplier_id: 2, status: 'delivered', order_date: 'May 22, 2026', total_amount: 95000 },
        { id: 3, po_number: 'PO-88023', supplier_name: 'Delta Precision Parts', db_supplier_id: 4, status: 'delivered', order_date: 'May 24, 2026', total_amount: 150000 },
        { id: 4, po_number: 'PO-87991', supplier_name: 'Apex Industrial Components', db_supplier_id: 1, status: 'delivered', order_date: 'April 22, 2026', total_amount: 184000 }
      ]);

      const cachedInvoices = localStorage.getItem('srm_invoices');
      setInvoicesList(cachedInvoices ? JSON.parse(cachedInvoices) : [
        { id: 'INV-5401', po: 'PO-88021', amount: 218000, submitted: '2026-05-20', due: '2026-06-04', status: 'Submitted', quantity: 2500 },
        { id: 'INV-5402', po: 'PO-88022', amount: 650000, submitted: '2026-05-22', due: '2026-06-06', status: 'Approved', quantity: 800 },
        { id: 'INV-5403', po: 'PO-88023', amount: 92000, submitted: '2026-05-24', due: '2026-06-08', status: 'Under Review', quantity: 1200 },
        { id: 'INV-5398', po: 'PO-87991', amount: 184000, submitted: '2026-04-22', due: '2026-05-07', status: 'Paid', quantity: 1500 }
      ]);

      setSuppliers([
        { supplier_id: 1, name: 'Apex Industrial Components', category: 'Mechanical', region: 'North America', rating: 4.8, avg_quality: 4.8, avg_price: 4.6, avg_delivery: 4.8, feasibility_score: 96, review_count: 5 },
        { supplier_id: 2, name: 'Vector Packaging Co.', category: 'Packaging', region: 'Europe', rating: 4.4, avg_quality: 4.4, avg_price: 4.2, avg_delivery: 4.4, feasibility_score: 86, review_count: 2 },
        { supplier_id: 3, name: 'Northstar Logistics', category: 'Logistics', region: 'APAC', rating: 4.6, avg_quality: 4.6, avg_price: 4.5, avg_delivery: 4.6, feasibility_score: 91, review_count: 3 },
        { supplier_id: 4, name: 'Delta Precision Parts', category: 'Mechanical', region: 'North America', rating: 3.2, avg_quality: 3.0, avg_price: 3.5, avg_delivery: 3.0, feasibility_score: 64, review_count: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [apiBaseUrl]);

  // Derive Scorecards List
  const scorecards = useMemo(() => {
    return suppliers.map((s) => {
      const qualityScore = Math.round(s.avg_quality * 20);
      const deliveryScore = Math.round(s.avg_delivery * 20);
      const priceScore = Math.round(s.avg_price * 20);
      const overall = s.feasibility_score >= 90 ? 'Excellent' : (s.feasibility_score >= 80 ? 'Strong' : (s.feasibility_score >= 70 ? 'Monitor' : 'Exception'));
      const risk = s.feasibility_score >= 85 ? 'Low' : (s.feasibility_score >= 70 ? 'Medium' : 'High');

      return {
        supplier: s.name || s.company_name,
        category: s.category || 'Mechanical',
        quality: qualityScore,
        delivery: deliveryScore,
        service: priceScore,
        overall,
        risk
      };
    });
  }, [suppliers]);

  // Derive Pending Evaluations List: PO status is delivered AND matching Invoice status is Paid
  const pendingReviewsList = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchedInv = invoicesList.find(inv => inv.po === po.po_number);
      return po.status === 'delivered' && matchedInv?.status === 'Paid';
    });
  }, [purchaseOrders, invoicesList]);

  // Derive Risk List
  const atRiskList = useMemo(() => {
    return suppliers
      .filter((s) => s.feasibility_score < 80)
      .map((s) => {
        const severity = s.feasibility_score < 70 ? 'High' : 'Medium';
        const flag = `Feasibility index is at ${s.feasibility_score}/100. Average Quality rating is ${s.avg_quality} ⭐.`;
        const action = s.feasibility_score < 70 
          ? 'Initiate corrective action plan and freeze contract awards.'
          : 'Schedule review meeting and monitor next 3 PO deliveries.';
        return {
          supplier: s.name || s.company_name,
          flag,
          severity,
          action
        };
      });
  }, [suppliers]);

  // GRN items change handlers
  const updateForm = (field, value) => {
    setForm(curr => ({ ...curr, [field]: value }));
  };

  const updateItems = (newItems) => {
    const itemNames = newItems.map(x => x.name).filter(Boolean).join(', ');
    const totalReceived = newItems.reduce((sum, x) => sum + (Number(x.received) || 0), 0);
    const totalAccepted = newItems.reduce((sum, x) => sum + (Number(x.accepted) || 0), 0);
    
    setForm(curr => ({
      ...curr,
      items: newItems,
      item: itemNames,
      received: totalReceived,
      accepted: totalAccepted
    }));
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
      const { extractTextFromPdf, parseGrnPdf } = await import('../../utils/pdfParser.js');
      const text = await extractTextFromPdf(file);
      const parsed = parseGrnPdf(text, file.name);
      setForm({
        receipt: parsed.receipt,
        po: parsed.po,
        item: parsed.item,
        received: parsed.received,
        accepted: parsed.accepted,
        items: parsed.items || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleVerifyReceipt = async (po) => {
    setSelectedPoForGrn(po);
    setGrnSuccessData(null);
    
    // Automatically generate GRN number
    const year = new Date().getFullYear();
    let nextNum = 1;
    receiptsList.forEach(r => {
      const match = r.receipt.match(/GRN-\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) nextNum = num + 1;
      }
    });
    const generatedReceiptId = `GRN-${year}-${String(nextNum).padStart(4, '0')}`;

    let poItems = [];
    try {
      const poRes = await fetch(`${apiBaseUrl}/purchase_orders.php?id=${po.id}`).then(res => res.json());
      if (poRes.success && poRes.po && Array.isArray(poRes.po.items)) {
        poItems = poRes.po.items.map(item => ({
          name: item.item_name,
          ordered: item.quantity,
          received: item.quantity,
          accepted: item.quantity,
          rejected: 0,
          reason: ''
        }));
      }
    } catch (err) {
      console.warn('Failed to load PO line items, fallback to single item', err);
    }

    if (poItems.length === 0) {
      poItems = [{
        name: `Components for ${po.po_number}`,
        ordered: 2500,
        received: 2500,
        accepted: 2500,
        rejected: 0,
        reason: ''
      }];
    }

    const totalOrdered = poItems.reduce((sum, item) => sum + item.ordered, 0);

    setForm({
      receipt: generatedReceiptId,
      po: po.po_number,
      po_id: po.id,
      item: poItems.map(x => x.name).join(', '),
      received: totalOrdered,
      accepted: totalOrdered,
      items: poItems
    });

    uploadGrnModal.open();
  };

  const resetAndClose = () => {
    setForm(initialForm);
    setSelectedPoForGrn(null);
    setGrnSuccessData(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    uploadGrnModal.close();
  };

  // Save GRN Receipt
  const handleSave = async () => {
    const totalDelivered = form.items ? form.items.reduce((sum, x) => sum + (Number(x.received) || 0), 0) : 0;
    const totalAccepted = form.items ? form.items.reduce((sum, x) => sum + (Number(x.accepted) || 0), 0) : 0;
    const totalRejected = form.items ? form.items.reduce((sum, x) => sum + (Number(x.rejected) || 0), 0) : 0;

    const newReceipt = {
      receipt: form.receipt || 'GRN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      po: form.po,
      item: form.items ? form.items.map(x => x.name).join(', ') : form.item,
      received: totalDelivered,
      accepted: totalAccepted,
      damaged_items: totalRejected,
      remarks: JSON.stringify(form.items || []),
      po_id: form.po_id || null,
      status: 'Approved',
    };

    // 1. Sync Receipt with DB
    try {
      await fetch(`${apiBaseUrl}/receipts.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReceipt),
      });
    } catch (err) {
      console.error('Failed to sync Receipt to database:', err);
    }

    const updated = [newReceipt, ...receiptsList];
    setReceiptsList(updated);
    localStorage.setItem('srm_receipts', JSON.stringify(updated));

    // 2. Resolve PO ID and update PO status to grn_recorded, and add timeline tracking event
    try {
      const poIdToUpdate = form.po_id;
      if (poIdToUpdate) {
        await fetch(`${apiBaseUrl}/purchase_orders.php`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: poIdToUpdate,
            status: 'grn_recorded'
          })
        });

        await fetch(`${apiBaseUrl}/order-tracking.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            po_id: poIdToUpdate,
            status: 'GRN_GENERATED',
            description: `Goods receipt note ${newReceipt.receipt} created. Accepted: ${totalAccepted}, Rejected: ${totalRejected}.`,
            updated_by: currentUser.id
          })
        });

        await fetch(`${apiBaseUrl}/audit-logs.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GRN_CREATED',
            details: `Goods receipt note ${newReceipt.receipt} created for PO ${form.po}.`,
            user_id: currentUser.id
          })
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to update PO status / tracking timeline:', err);
    }

    // Notify supplier that their delivery was verified and they can now invoice
    pushNotification({
      category: 'orders',
      icon: 'CheckCircle',
      iconColor: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20',
      title: `GRN Recorded — ${form.po}`,
      body: `Accepted: ${totalAccepted} units. Rejected: ${totalRejected} units. You may now submit an invoice.`,
      type: 'Orders',
    }, 'supplier');

    setGrnSuccessData({
      receipt: newReceipt.receipt,
      po: newReceipt.po,
      accepted: totalAccepted,
      rejected: totalRejected
    });
    loadAllData();
  };

  // Review Form handlers
  const handleOpenReviewModal = (po) => {
    setRatingPo(po);
    setFormReviewText('');
    setFormRatingQuality(5);
    setFormRatingPrice(5);
    setFormRatingDelivery(5);
    setSubmitSuccess('');
    setSubmitError('');
    submitReviewModal.open();
  };

  const handleCloseReviewModal = () => {
    setRatingPo(null);
    submitReviewModal.close();
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!ratingPo) return;
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');

    const targetSupplierId = ratingPo.db_supplier_id || 1;

    const payload = {
      supplier_id: targetSupplierId,
      po_id: ratingPo.id,
      review: formReviewText,
      reviewed_by: currentUser.id,
      rating_quality: formRatingQuality,
      rating_price: formRatingPrice,
      rating_delivery: formRatingDelivery
    };

    try {
      // 1. Submit review
      const res = await fetch(`${apiBaseUrl}/ratings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        // 2. Set PO status to fulfilled
        await fetch(`${apiBaseUrl}/purchase_orders.php`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: ratingPo.id,
            status: 'fulfilled'
          })
        });

        // 3. Post to tracking
        await fetch(`${apiBaseUrl}/order-tracking.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            po_id: ratingPo.id,
            status: 'FULFILLED',
            description: `Supplier evaluation submitted. Sourcing workflow completed.`,
            updated_by: currentUser.id
          })
        });

        // 4. Log audit log
        await fetch(`${apiBaseUrl}/audit-logs.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'PO_FULFILLED',
            details: `PO ${ratingPo.po_number} marked as fulfilled after review submission.`,
            user_id: currentUser.id
          })
        }).catch(() => {});

        setSubmitSuccess('Thank you! Evaluation successfully recorded and PO has been marked as Fulfilled.');
        setTimeout(() => {
          submitReviewModal.close();
          setRatingPo(null);
          loadAllData();
        }, 1500);
      } else {
        setSubmitError(res.message || 'Failed to submit rating.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Connection to rating service failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Interactive Star Rating helper
  function StarInput({ label, rating, onChange }) {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{label}</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="cursor-pointer hover:scale-110 transition-transform focus:outline-none"
            >
              <Star
                className={`h-4 w-4 ${
                  star <= rating
                    ? 'fill-amber-500 stroke-amber-500'
                    : 'fill-transparent stroke-slate-300 dark:stroke-slate-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard Stats summary
  const summaryStats = useMemo(() => {
    const pendingGRNs = purchaseOrders.filter(p => p.status === 'shipped').length;
    const totalScorecards = scorecards.length;
    const pendingEvals = pendingReviewsList.length;
    const atRiskCount = atRiskList.length;

    return [
      { label: 'Pending Warehouse GRNs', value: pendingGRNs, icon: PackageOpen, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20' },
      { label: 'Suppliers Evaluated', value: totalScorecards, icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20' },
      { label: 'Pending Evaluations', value: pendingEvals, icon: Star, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20' },
      { label: 'At-Risk Relationships', value: atRiskCount, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20' }
    ];
  }, [purchaseOrders, scorecards, pendingReviewsList, atRiskList]);

  const totalDelivered = form.items ? form.items.reduce((sum, x) => sum + (Number(x.received) || 0), 0) : 0;
  const totalAccepted = form.items ? form.items.reduce((sum, x) => sum + (Number(x.accepted) || 0), 0) : 0;
  const totalRejected = form.items ? form.items.reduce((sum, x) => sum + (Number(x.rejected) || 0), 0) : 0;
  const acceptanceRate = totalDelivered > 0 ? (totalAccepted / totalDelivered) * 100 : 100;
  
  let varianceStatus = '🟢 No Variance';
  let varianceColor = 'border-slate-100 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300';
  if (totalRejected > 0) {
    if (acceptanceRate >= 95) {
      varianceStatus = '🟡 Minor Variance';
      varianceColor = 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400';
    } else {
      varianceStatus = '🔴 Major Variance';
      varianceColor = 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400';
    }
  }

  const pendingReceiptsList = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'awaiting_receipt');
  }, [purchaseOrders]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Receipts & Reviews" 
        description="Inspect incoming shipments, log warehouse Goods Receipt Notes (GRN), submit supplier performance scores, and inspect quality compliance metrics."
        action={
          activeTab === 'receipts' && (
            <Button onClick={uploadGrnModal.open}>
              <Plus className="h-4 w-4" /> Record Goods Receipt
            </Button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((s) => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white mt-0.5">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1 w-fit">
        {[
          ['receipts', 'Goods Receipts (GRN)'],
          ['pending_receipts', 'Pending Receipts'],
          ['evaluations', 'Pending Evaluations'],
          ['scorecards', 'Supplier Scorecards'],
          ['risk', 'Risk Flags']
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === key
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Tab 1: Receipts List */}
          {activeTab === 'receipts' && (
            <Card>
              <CardHeader title="Warehouse GRN Logs" subtitle="Incoming cargo inspection and accepted quantities" />
              <DataTable
                data={receiptsList}
                empty="No warehouse goods receipt records are registered yet."
                columns={[
                  { key: 'receipt', header: 'GRN Number', render: (row) => <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{row.receipt}</span> },
                  { key: 'po', header: 'PO Ref', render: (row) => <span className="font-mono text-slate-600 dark:text-slate-400">{row.po}</span> },
                  { key: 'item', header: 'Delivered Item', render: (row) => <span className="font-semibold">{row.item}</span> },
                  { key: 'received', header: 'Delivered Qty', render: (row) => number(row.received) },
                  { key: 'accepted', header: 'Accepted Qty', render: (row) => <span className="font-semibold text-emerald-600">{number(row.accepted)}</span> },
                  { 
                    key: 'variance', 
                    header: 'Variance Qty', 
                    render: (row) => {
                      const diff = row.received - row.accepted;
                      return diff > 0 ? (
                        <span className="font-semibold text-rose-600">{number(diff)} units rejected</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      );
                    }
                  },
                  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                ]}
              />
            </Card>
          )}

          {/* Tab: Pending Receipts */}
          {activeTab === 'pending_receipts' && (
            <Card>
              <CardHeader title="Pending Cargo Receipts" subtitle="Shipped supplier orders awaiting warehouse inspection and GRN validation" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {pendingReceiptsList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 italic">
                    No supplier shipments are awaiting warehouse receipt validation.
                  </div>
                ) : (
                  pendingReceiptsList.map((po) => (
                    <div key={po.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{po.supplier_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">PO #{po.po_number} · Total: {currency(po.total_amount)} · Ordered: {po.order_date?.split(' ')[0]}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/30">Awaiting Receipt</span>
                        <Button
                          onClick={() => handleVerifyReceipt(po)}
                          className="h-8 px-3.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm"
                        >
                          Verify & Record GRN
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Tab 2: Pending Evaluations */}
          {activeTab === 'evaluations' && (
            <Card>
              <CardHeader title="Fulfillment Evaluations" subtitle="Paid orders requiring buyer supplier reviews before closing" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {pendingReviewsList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 italic">
                    All paid purchase orders have been reviewed. Sourcing workflow fully complete.
                  </div>
                ) : (
                  pendingReviewsList.map((po) => (
                    <div key={po.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{po.supplier_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Order #{po.po_number} · Total: {currency(po.total_amount)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/30">Awaiting Feedback</span>
                        <Button
                          onClick={() => handleOpenReviewModal(po)}
                          className="h-8 px-3.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm"
                        >
                          Submit Rating
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Tab 3: Performance Scorecards */}
          {activeTab === 'scorecards' && (
            <Card>
              <CardHeader title="Supplier Scorecards" subtitle="Consolidated performance indices calculated from historical evaluations" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
                      {['Supplier Name', 'Category', 'Quality (Index)', 'Delivery (Index)', 'Cost Value', 'Feasibility Status', 'Risk Level'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {scorecards.length === 0 ? (
                      <tr>
                        <td className="px-5 py-8 text-center text-slate-400 italic" colSpan={7}>No supplier scorecard records available.</td>
                      </tr>
                    ) : (
                      scorecards.map((row) => (
                        <tr key={row.supplier} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.supplier}</td>
                          <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{row.category}</td>
                          <td className="px-5 py-3.5 tabular-nums text-slate-700 dark:text-slate-300 font-semibold">{row.quality} / 100</td>
                          <td className="px-5 py-3.5 tabular-nums text-slate-700 dark:text-slate-300 font-semibold">{row.delivery} / 100</td>
                          <td className="px-5 py-3.5 tabular-nums text-slate-700 dark:text-slate-300 font-semibold">{row.service} / 100</td>
                          <td className="px-5 py-3.5"><StatusBadge status={row.overall} /></td>
                          <td className="px-5 py-3.5"><StatusBadge status={row.risk} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 4: Risk Flags */}
          {activeTab === 'risk' && (
            <Card>
              <CardHeader title="Supplier Risk Flags" subtitle="Identified partnerships with composite Feasibility score under 80" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {atRiskList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/20 dark:bg-emerald-950/10">
                    ✓ All registered suppliers are currently performing within normal feasibility levels.
                  </div>
                ) : (
                  atRiskList.map((flag) => (
                    <div key={flag.supplier} className="px-5 py-4 flex flex-wrap items-start gap-4 justify-between hover:bg-rose-50/5 dark:hover:bg-rose-950/5 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{flag.supplier}</p>
                          <StatusBadge status={flag.severity} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{flag.flag}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 italic">Action Required: {flag.action}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Record Goods Receipt Note Modal */}
      <Modal title={grnSuccessData ? "Verification Complete" : "Record Goods Receipt"} isOpen={uploadGrnModal.isOpen} onClose={resetAndClose} size="xl">
        {grnSuccessData ? (
          /* Render Success Screen */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6 animate-in fade-in duration-300">
            <div className="rounded-full bg-emerald-100 p-4 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Check className="h-10 w-10 stroke-[3]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Goods Receipt Recorded</h3>
              <p className="text-xs text-slate-500">The warehouse inspection results have been successfully registered.</p>
            </div>

            <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 text-left text-xs divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
              <div className="flex justify-between pb-3">
                <span className="text-slate-500 font-medium">GRN Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{grnSuccessData.receipt}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-500 font-medium">PO Reference</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{grnSuccessData.po}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-500 font-medium">Accepted Units</span>
                <span className="font-bold text-emerald-600">{number(grnSuccessData.accepted)} Units</span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-slate-500 font-medium">Rejected Units</span>
                <span className="font-bold text-rose-600">{number(grnSuccessData.rejected)} Units</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
              <Button 
                variant="primary" 
                onClick={() => {
                  resetAndClose();
                  loadAllData();
                }}
              >
                Return to Receipts
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  resetAndClose();
                  navigate('/admin/orders');
                }}
              >
                View PO
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  showAlert(
                    'Supplier Notified',
                    `Receipt validation for ${grnSuccessData?.po} has been sent to the supplier via the live portal.`,
                    'success'
                  );
                }}
              >
                Notify Supplier
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            <div>
              <div className="mb-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5 text-center transition hover:bg-slate-100/50 dark:hover:bg-slate-900">
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-full bg-blue-50 dark:bg-blue-950/40 p-2.5 text-blue-600 dark:text-blue-400 mb-2">
                    <UploadCloud className={`h-5 w-5 ${isParsing ? 'animate-bounce' : ''}`} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Auto-fill from Document</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-3">Upload a delivery receipt PDF to automatically extract line items</p>
                  
                  <input
                    type="file"
                    accept=".pdf"
                    id="grn-pdf-upload-input"
                    className="hidden"
                    onChange={handlePdfUpload}
                    disabled={isParsing}
                  />
                  <label
                    htmlFor="grn-pdf-upload-input"
                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-150 mb-2.5"
                  >
                    Choose PDF File
                  </label>

                  <div className="flex items-center justify-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Or get a template:</span>
                    <a 
                      href={`${import.meta.env.BASE_URL}samples/delivery-receipt.pdf`} 
                      download 
                      className="text-brand-600 hover:text-brand-500 hover:underline font-semibold"
                    >
                      Download Sample Delivery Receipt
                    </a>
                  </div>
                  
                  {isParsing && (
                    <p className="mt-3 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
                      Extracting delivery records...
                    </p>
                  )}
                </div>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Receipt ID">
                    <input 
                      className={inputClass} 
                      value={form.receipt} 
                      onChange={e => updateForm('receipt', e.target.value)} 
                      placeholder="e.g. REC-9081"
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
                </div>

                {/* Itemized Grid Editor */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Line Items
                    </label>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        className="h-8 px-3 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30"
                        onClick={() => {
                          const newItems = form.items.map(item => ({
                            ...item,
                            accepted: item.received,
                            rejected: 0,
                            reason: ''
                          }));
                          updateItems(newItems);
                        }}
                      >
                        ✓ Accept All
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        className="h-8 px-2 py-0 text-xs font-semibold"
                        onClick={() => {
                          const newItems = [...(form.items || []), { name: '', ordered: 0, received: 0, accepted: 0, rejected: 0, reason: '' }];
                          updateItems(newItems);
                        }}
                      >
                        + Add Item
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                          <th className="p-2 font-semibold">Item Description</th>
                          <th className="p-2 font-semibold w-20">Ordered</th>
                          <th className="p-2 font-semibold w-24">Delivered</th>
                          <th className="p-2 font-semibold w-24">Accepted</th>
                          <th className="p-2 font-semibold w-24">Rejected</th>
                          <th className="p-2 font-semibold">Discrepancy Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(form.items || []).map((itemRow, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="p-2">
                              <input
                                className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white font-medium"
                                value={itemRow.name}
                                placeholder="e.g. Steel Brackets"
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  newItems[index].name = e.target.value;
                                  updateItems(newItems);
                                }}
                              />
                            </td>
                            <td className="p-2 font-semibold text-slate-500 dark:text-slate-400 pl-3">
                              {itemRow.ordered ?? itemRow.received}
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white"
                                value={itemRow.received}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const newItems = [...form.items];
                                  newItems[index].received = val;
                                  newItems[index].accepted = val - newItems[index].rejected;
                                  updateItems(newItems);
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white text-emerald-600 font-bold"
                                value={itemRow.accepted}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const newItems = [...form.items];
                                  newItems[index].accepted = val;
                                  newItems[index].rejected = Math.max(0, newItems[index].received - val);
                                  updateItems(newItems);
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white text-rose-600 font-bold"
                                value={itemRow.rejected}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const newItems = [...form.items];
                                  newItems[index].rejected = val;
                                  newItems[index].accepted = Math.max(0, newItems[index].received - val);
                                  updateItems(newItems);
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white text-xs italic"
                                value={itemRow.reason || ''}
                                placeholder="Reason if rejected..."
                                onChange={(e) => {
                                  const newItems = [...form.items];
                                  newItems[index].reason = e.target.value;
                                  updateItems(newItems);
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary Panel */}
                    <div className={`mt-0 rounded-b-lg border-t p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-bold ${varianceColor}`}>
                      <div className="flex gap-6 flex-wrap">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Total Delivered</span>
                          <span className="text-sm text-slate-900 dark:text-white">{number(totalDelivered)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block text-emerald-600">Total Accepted</span>
                          <span className="text-sm text-emerald-600">{number(totalAccepted)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block text-rose-600">Total Rejected</span>
                          <span className="text-sm text-rose-600">{number(totalRejected)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Acceptance Rate</span>
                          <span className="text-sm text-slate-900 dark:text-white">{acceptanceRate.toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Variance Status</span>
                        <span className="text-sm block font-black">{varianceStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
                  <Button onClick={handleSave}><Check className="h-4 w-4" /> Save Receipt</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Supplier Evaluation Rating Modal */}
      {submitReviewModal.isOpen && ratingPo && (
        <Modal title={`Submit Supplier Evaluation — ${ratingPo.po_number}`} isOpen={submitReviewModal.isOpen} onClose={handleCloseReviewModal} size="lg">
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit your evaluation scores for <strong>{ratingPo.supplier_name}</strong> for Purchase Order <strong>{ratingPo.po_number}</strong>. This feedback directly adjusts their composite scorecard rankings.
            </p>

            {submitSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <StarInput label="Quality of Goods" rating={formRatingQuality} onChange={setFormRatingQuality} />
              <StarInput label="Price Competitiveness" rating={formRatingPrice} onChange={setFormRatingPrice} />
              <StarInput label="On-Time Delivery" rating={formRatingDelivery} onChange={setFormRatingDelivery} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Evaluation Comments</label>
              <textarea
                placeholder="Submit detailed compliance, logistics quality and pricing feedback..."
                rows="3"
                required
                value={formReviewText}
                onChange={(e) => setFormReviewText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white px-3 py-2 text-xs outline-none focus:border-brand-500 resize-none transition"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900 pt-3">
              <Button type="button" variant="secondary" onClick={handleCloseReviewModal} disabled={submitLoading}>Cancel</Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? 'Submitting Review...' : 'Submit Evaluation & Close PO'}
              </Button>
            </div>
          </form>
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
