import React, { useState, useEffect } from 'react';
import { Download, Eye, X, CheckCircle, FileText } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';

export function SupplierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPo, setSelectedPo] = useState(null);
  const [poDetails, setPoDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  // Get active supplier user ID
  const storedUser = sessionStorage.getItem('srm_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : { id: 2 }; // Default/fallback for supplier testing

  const fetchSupplierOrders = () => {
    setLoading(true);
    fetch(`${apiBaseUrl}/purchase_orders.php?supplier_id=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.purchase_orders)) {
          // Filter out fulfilled/closed orders if desired, but let's show all active orders
          setOrders(data.purchase_orders.filter(order => order.status !== 'fulfilled' && order.status !== 'cancelled'));
        }
      })
      .catch((err) => console.error('Failed to fetch supplier orders:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSupplierOrders();
  }, [currentUser.id]);

  const handleInspectPo = (id) => {
    setSelectedPo(id);
    setLoadingDetails(true);
    fetch(`${apiBaseUrl}/purchase_orders.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.po) {
          setPoDetails(data.po);
        }
      })
      .catch((err) => console.error('Failed to fetch PO details:', err))
      .finally(() => setLoadingDetails(false));
  };

  const columns = [
    { key: 'po_number', header: 'PO Number', render: (row) => <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{row.po_number}</span> },
    { key: 'buyer', header: 'Buyer Account', render: () => <span className="font-semibold text-slate-900 dark:text-slate-100">Tata Motors Ltd.</span> },
    { key: 'total_amount', header: 'Amount', render: (row) => <span className="font-bold text-slate-950 dark:text-slate-100">{currency(row.total_amount)}</span> },
    { key: 'order_date', header: 'Order Date', render: (row) => <span>{row.order_date ? row.order_date.split(' ')[0] : '-'}</span> },
    { key: 'delivery_date', header: 'Commit Date', render: (row) => <span>{row.delivery_date || '-'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
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
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PO NUMBER</span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{poDetails.po_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ORDER STATUS</span>
                    <div className="mt-0.5"><StatusBadge status={poDetails.status} /></div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BUYER</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Tata Motors Ltd.</span>
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

                {/* Legal Terms Preview */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contract Agreement Terms</h4>
                  <div className="h-32 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-[9px] leading-4 font-mono text-slate-500 dark:text-slate-400">
                    {poDetails.legal_terms}
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
    </>
  );
}
