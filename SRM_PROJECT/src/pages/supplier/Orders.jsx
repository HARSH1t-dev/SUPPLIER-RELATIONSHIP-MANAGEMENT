import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, X, FileText, Truck } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { OrderProgressBar, OrderTimeline } from '../../components/OrderTimeline.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { getApiBaseUrl } from '../../utils/apiBase.js';
import { nextSupplierAction, trackingStatusLabel } from '../../utils/orderTracking.js';
import { CustomNotification } from '../../components/CustomNotification.jsx';

function getSupplierUser() {
  try {
    const stored = sessionStorage.getItem('srm_user');
    return stored ? JSON.parse(stored) : { id: 2 };
  } catch {
    return { id: 2 };
  }
}

export function SupplierOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPo, setSelectedPo] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [poDetails, setPoDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const apiBaseUrl = getApiBaseUrl();
  const currentUser = getSupplierUser();

  const fetchSupplierOrders = () => {
    setLoading(true);
    Promise.all([
      fetch(`${apiBaseUrl}/order-tracking.php?supplier_id=${currentUser.id}`).then((res) => res.json()).catch(() => ({ success: false })),
      fetch(`${apiBaseUrl}/invoices.php`).then((res) => res.json()).catch(() => ({ success: false })),
      fetch(`${apiBaseUrl}/receipts.php`).then((res) => res.json()).catch(() => ({ success: false }))
    ])
      .then(([ordersRes, invoicesRes, receiptsRes]) => {
        if (ordersRes.success && Array.isArray(ordersRes.orders)) {
          setOrders(
            ordersRes.orders.filter(
              (order) => order.tracking_status !== 'PAYMENT_COMPLETED' && order.status !== 'fulfilled' && order.status !== 'cancelled',
            ),
          );
        }
        if (invoicesRes.success && Array.isArray(invoicesRes.invoices)) {
          setInvoices(invoicesRes.invoices);
        } else {
          const saved = localStorage.getItem('srm_invoices');
          if (saved) setInvoices(JSON.parse(saved));
        }
        if (receiptsRes.success && Array.isArray(receiptsRes.receipts)) {
          setReceipts(receiptsRes.receipts);
        } else {
          const saved = localStorage.getItem('srm_receipts');
          if (saved) setReceipts(JSON.parse(saved));
        }
      })
      .catch((err) => console.error('Failed to fetch supplier orders and metadata:', err))
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchSupplierOrders();
  }, [currentUser.id]);

  const handleInspectPo = (id) => {
    setSelectedPo(id);
    setLoadingDetails(true);
    setTrackingData(null);
    setPoDetails(null);

    Promise.all([
      fetch(`${apiBaseUrl}/order-tracking.php?po_id=${id}`).then((r) => r.json()),
      fetch(`${apiBaseUrl}/purchase_orders.php?id=${id}`).then((r) => r.json()).catch(() => ({ success: false })),
    ])
      .then(([tracking, poRes]) => {
        if (tracking.success) setTrackingData(tracking);
        if (poRes.success && poRes.po) setPoDetails(poRes.po);
        else if (tracking.success && tracking.order) {
          setPoDetails({
            ...tracking.order,
            items: [],
            legal_terms: 'Terms available on issued PO document.',
          });
        }
      })
      .catch((err) => console.error('Failed to fetch PO details:', err))
      .finally(() => setLoadingDetails(false));
  };

  const handleTrackingAction = (action) => {
    if (!selectedPo || !action) return;
    setActionLoading(true);
    fetch(`${apiBaseUrl}/order-tracking.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        po_id: selectedPo,
        action,
        updated_by: currentUser.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTrackingData(data);
          if (data.order) {
            setPoDetails((prev) => ({ ...prev, ...data.order }));
          }
          fetchSupplierOrders();
        } else {
          setCustomAlert({
            isOpen: true,
            type: 'error',
            title: 'Fulfillment Update Failed',
            message: data.message || 'Failed to update tracking'
          });
        }
      })
      .catch(() => {
        setCustomAlert({
          isOpen: true,
          type: 'error',
          title: 'Update Error',
          message: 'Failed to update order tracking.'
        });
      })
      .finally(() => setActionLoading(false));
  };

  const isInvoiceEligible = (po) => {
    const grnExists = receipts.some(r => r.po === po.po_number);
    if (!grnExists) return false;

    const isDeliveredOrRecorded = 
      po.status?.toLowerCase() === 'grn_recorded' || 
      po.status?.toLowerCase() === 'delivered' ||
      po.tracking_status === 'GRN_GENERATED' || 
      po.tracking_status === 'INVOICE_SUBMITTED' ||
      po.tracking_status === 'DELIVERED';
    if (!isDeliveredOrRecorded) return false;

    const blockingStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Payment Processing', 'Paid'];
    const hasBlockingInvoice = invoices.some(
      inv => inv.po === po.po_number && blockingStatuses.includes(inv.status)
    );
    if (hasBlockingInvoice) return false;

    return true;
  };

  const handleGenerateInvoice = async (po) => {
    setActionLoading(true);
    try {
      let detailedPo = null;
      try {
        const poRes = await fetch(`${apiBaseUrl}/purchase_orders.php?id=${po.id}`).then(res => res.json());
        if (poRes.success && poRes.po) {
          detailedPo = poRes.po;
        }
      } catch (err) {
        console.warn('Failed to fetch detailed PO, using fallback PO:', err);
      }

      if (!detailedPo) {
        detailedPo = {
          ...po,
          items: []
        };
      }

      const poReceipts = receipts.filter(r => r.po === po.po_number);
      const totalAccepted = poReceipts.reduce((sum, r) => sum + (Number(r.accepted) || 0), 0);
      const firstReceipt = poReceipts[0];
      const grnId = firstReceipt ? firstReceipt.receipt : 'REC-TEMP';

      let billedItems = [];
      let subtotal = 0;

      let grnItems = [];
      if (firstReceipt && firstReceipt.remarks) {
        try {
          grnItems = JSON.parse(firstReceipt.remarks);
        } catch (e) {
          console.warn('Failed to parse GRN items from remarks:', e);
        }
      }

      if (detailedPo.items && detailedPo.items.length > 0) {
        billedItems = detailedPo.items.map(item => {
          let acceptedQty = 0;
          if (grnItems.length > 0) {
            const matchedGrnItem = grnItems.find(gi => 
              gi.name.toLowerCase().trim() === item.item_name.toLowerCase().trim()
            );
            if (matchedGrnItem) {
              acceptedQty = Number(matchedGrnItem.accepted) || 0;
            }
          }
          
          if (acceptedQty === 0) {
            const matchingReceipts = poReceipts.filter(r => 
              r.item.toLowerCase().includes(item.item_name.toLowerCase()) ||
              item.item_name.toLowerCase().includes(r.item.toLowerCase())
            );
            acceptedQty = matchingReceipts.reduce((sum, r) => sum + (Number(r.accepted) || 0), 0);
          }

          const itemQty = acceptedQty > 0 ? acceptedQty : item.quantity;
          const totalPrice = itemQty * item.unit_price;
          subtotal += totalPrice;
          return {
            item_name: item.item_name,
            quantity: itemQty,
            unit_price: item.unit_price,
            total_price: totalPrice
          };
        });
      } else {
        const itemQty = totalAccepted > 0 ? totalAccepted : 2500;
        const poTotal = po.total_amount;
        subtotal = (poTotal - 200) / 1.18;
        if (subtotal <= 0) subtotal = poTotal;
        const unitPrice = itemQty > 0 ? (subtotal / itemQty) : subtotal;
        billedItems = [{
          item_name: `Billed Components / Services (${po.po_number})`,
          quantity: itemQty,
          unit_price: Number(unitPrice.toFixed(2)),
          total_price: Number(subtotal.toFixed(2))
        }];
      }

      const taxRate = 0.18;
      const tax = Number((subtotal * taxRate).toFixed(2));
      const freight = 200.00;
      const grandTotal = Number((subtotal + tax + freight).toFixed(2));

      const year = new Date().getFullYear();
      let nextNum = 1;
      invoices.forEach(inv => {
        const match = inv.id.match(/INV-\d+-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= nextNum) nextNum = num + 1;
        }
      });
      const invoiceId = `INV-${year}-${String(nextNum).padStart(4, '0')}`;

      const draftInvoice = {
        id: invoiceId,
        po: po.po_number,
        amount: grandTotal,
        submitted: new Date().toISOString().split('T')[0],
        due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft',
        quantity: totalAccepted || 2500,
        generated_from_po_id: po.id,
        generated_from_grn_id: grnId,
        items: billedItems
      };

      try {
        await fetch(`${apiBaseUrl}/invoices.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftInvoice)
        }).then(res => res.json());
      } catch (err) {
        console.warn('Failed to save Draft invoice to database, using localStorage only:', err);
      }

      const updatedInvoices = [draftInvoice, ...invoices];
      setInvoices(updatedInvoices);
      localStorage.setItem('srm_invoices', JSON.stringify(updatedInvoices));

      setCustomAlert({
        isOpen: true,
        type: 'success',
        title: 'Invoice Generated',
        message: `Draft invoice ${invoiceId} generated successfully!`,
        onClose: () => {
          navigate('/supplier/invoices', { state: { openInvoiceId: invoiceId } });
        }
      });
    } catch (err) {
      console.error(err);
      setCustomAlert({
        isOpen: true,
        type: 'error',
        title: 'Generation Failed',
        message: 'Error generating invoice'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'po_number', header: 'PO Number', render: (row) => <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{row.po_number}</span> },
    { key: 'buyer', header: 'Buyer Account', render: () => <span className="font-semibold text-slate-900 dark:text-slate-100">Nexus Manufacturing Ltd.</span> },
    { key: 'total_amount', header: 'Amount', render: (row) => <span className="font-bold text-slate-950 dark:text-slate-100">{currency(row.total_amount)}</span> },
    { key: 'order_date', header: 'Order Date', render: (row) => <span>{row.order_date ? row.order_date.split(' ')[0] : '-'}</span> },
    { key: 'delivery_date', header: 'Commit Date', render: (row) => <span>{row.delivery_date || '-'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.tracking_status || row.status} />,
    },
    {
      key: 'progress_percent',
      header: 'Progress',
      render: (row) => `${row.progress_percent ?? 10}%`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {isInvoiceEligible(row) && (
            <button
              onClick={() => handleGenerateInvoice(row)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-semibold shadow transition"
            >
              <FileText className="h-3.5 w-3.5" /> Generate Invoice
            </button>
          )}
          <button
            onClick={() => handleInspectPo(row.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Eye className="h-3.5 w-3.5" /> Inspect
          </button>
          <a
            href={`${apiBaseUrl}/generate_pdf.php?id=${row.id}`}
            download
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition"
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </a>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Active Orders" description="View, confirm, and track ongoing purchase orders issued to your company." />
      <Card>
        <CardHeader title="Active Order Queue" subtitle="Open POs that still require delivery or fulfillment updates" />
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <DataTable
            data={orders}
            columns={columns}
            empty="No active purchase orders have been issued to your account."
          />
        )}
      </Card>

      {/* PO Detail Drawer / Modal for Supplier */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">PO Summary</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Read line items and legally binding terms</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedPo(null); setPoDetails(null); }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : poDetails ? (
              <div className="mt-5 space-y-6">
                {trackingData?.order && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                    <OrderProgressBar
                      percent={trackingData.order.progress_percent}
                      label={`${trackingStatusLabel(trackingData.order.tracking_status)} — fulfillment progress`}
                    />
                    {(() => {
                      const next = nextSupplierAction(trackingData.order.tracking_status);
                      return next ? (
                        <Button
                          variant="primary"
                          className="mt-3 w-full"
                          disabled={actionLoading}
                          onClick={() => handleTrackingAction(next.action)}
                        >
                          <Truck className="h-4 w-4" />
                          {actionLoading ? 'Updating…' : next.label}
                        </Button>
                      ) : (
                        <p className="mt-2 text-xs text-slate-600">No further supplier actions for this order.</p>
                      );
                    })()}
                  </div>
                )}

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PO NUMBER</span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{poDetails.po_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ORDER STATUS</span>
                    <div className="mt-0.5">
                      <StatusBadge status={trackingData?.order?.tracking_status || poDetails.status} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TRACKING #</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{trackingData?.order?.tracking_number || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BUYER</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Nexus Manufacturing Ltd.</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL ORDER VALUE</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">{currency(poDetails.total_amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ORDER ISSUED</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{poDetails.order_date ? poDetails.order_date.split(' ')[0] : '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COMMITMENT DATE</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{poDetails.delivery_date || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RFQ REFERENCE</span>
                    <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{poDetails.rfq_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SOURCING MANAGER</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{poDetails.awarded_by_name || '-'}</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Line Items</h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400">
                          <th className="p-2.5">Item Description</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Unit Price</th>
                          <th className="p-2.5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {poDetails.items && poDetails.items.map((item, idx) => (
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

                {trackingData?.timeline && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fulfillment timeline</h4>
                    <OrderTimeline timeline={trackingData.timeline} compact />
                  </div>
                )}

                {/* Legal Terms Preview */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contract Agreement Terms</h4>
                  <div className="h-32 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-[9px] leading-4 font-mono text-slate-500 dark:text-slate-400">
                    {poDetails.legal_terms || 'Standard procurement terms apply.'}
                  </div>
                </div>

                {/* PDF Action */}
                <div className="border-t border-slate-100 dark:border-slate-900 pt-4 flex justify-between items-center">
                  <a
                    href={`${apiBaseUrl}/generate_pdf.php?id=${poDetails.id}`}
                    download
                    className="flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-bold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow"
                  >
                    <Download className="h-4 w-4" /> Download PO PDF
                  </a>
                  <button 
                    onClick={() => { setSelectedPo(null); setPoDetails(null); }}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                  >
                    Close Drawer
                  </button>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

      <CustomNotification
        isOpen={customAlert.isOpen}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => {
          if (customAlert.onClose) {
            customAlert.onClose();
          }
          setCustomAlert(a => ({ ...a, isOpen: false }));
        }}
      />
    </>
  );
}
