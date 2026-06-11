import { Award, MessageSquare } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CustomNotification } from '../../components/CustomNotification.jsx';

export function BidComparison() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqQueryId = searchParams.get('rfqId');

  const [rfqList, setRfqList] = useState([]);
  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [allBids, setAllBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfqDetails, setSelectedRfqDetails] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [awardingBid, setAwardingBid] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  const handleConfirmAward = () => {
    if (!awardingBid) return;
    setIsSubmitting(true);

    const stored = sessionStorage.getItem('srm_user');
    const currentUser = stored ? JSON.parse(stored) : { id: 1 };

    fetch(`${apiBaseUrl}/award_contract.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proposal_id: awardingBid.id,
        awarded_by: currentUser.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setShowConfirmModal(false);
          setCustomAlert({
            isOpen: true,
            type: 'success',
            title: 'Contract Awarded',
            message: 'Contract successfully awarded! The legally binding PO has been generated and issued.',
            onConfirm: () => navigate('/admin/orders')
          });
        } else {
          setCustomAlert({
            isOpen: true,
            type: 'error',
            title: 'Award Failed',
            message: 'Failed to award contract: ' + data.message
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setCustomAlert({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'An error occurred while awarding contract.'
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    // 1. Fetch RFQs
    fetch(`${apiBaseUrl}/rfqs.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rfqs)) {
          setRfqList(data.rfqs);
          if (data.rfqs.length > 0) {
            if (rfqQueryId) {
              setSelectedRfqId(rfqQueryId);
            } else {
              const activeRfq = data.rfqs.find(r => r.status === 'Active' || r.status === 'Under Evaluation');
              setSelectedRfqId(activeRfq ? activeRfq.id : data.rfqs[0].id);
            }
          }
        }
      })
      .catch((err) => console.error('Failed to fetch RFQs:', err));

    // 2. Fetch all bids
    fetch(`${apiBaseUrl}/bids.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bids)) {
          setAllBids(data.bids);
        }
      })
      .catch((err) => console.error('Failed to fetch Bids:', err))
      .finally(() => setLoading(false));
  }, [apiBaseUrl, rfqQueryId]);

  useEffect(() => {
    if (selectedRfqId) {
      fetch(`${apiBaseUrl}/rfqs.php?id=${selectedRfqId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.rfq) {
            setSelectedRfqDetails(data.rfq);
          }
        })
        .catch((err) => console.error('Failed to fetch RFQ details:', err));
    }
  }, [selectedRfqId, apiBaseUrl]);

  const selectedRfq = useMemo(() => {
    return rfqList.find(r => r.id === selectedRfqId);
  }, [rfqList, selectedRfqId]);

  const filteredBids = useMemo(() => {
    return allBids
      .filter((b) => (b.rfq_package || b.rfqPackage) === selectedRfqId)
      .map((b) => {
        let supplier = b.supplier_name || b.supplier || 'Apex Industrial Components';
        
        // Use the real supplier rating from the database if available
        let rating = b.supplier_rating !== undefined && b.supplier_rating !== null
          ? parseFloat(b.supplier_rating)
          : null;

        if (rating === null) {
          if (b.id === 'BID-1' || b.id === '1') {
            rating = 4.8;
          } else if (b.id === 'BID-2' || b.id === '2') {
            rating = 4.4;
          } else if (b.id === 'BID-3' || b.id === '3') {
            rating = 4.6;
          } else if (b.id === 'BID-4' || b.id === '4') {
            rating = 4.1;
          } else {
            rating = 5.0;
          }
        }

        return {
          ...b,
          supplier,
          rating,
        };
      });
  }, [allBids, selectedRfqId]);

  const comparisonColumns = useMemo(() => {
    const cols = [
      {
        key: 'supplier',
        header: 'Supplier',
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-950 dark:text-slate-200">{row.supplier}</span>
            {row.best ? <StatusBadge status="Approved" /> : null}
          </div>
        ),
      }
    ];

    if (selectedRfqDetails && Array.isArray(selectedRfqDetails.items)) {
      selectedRfqDetails.items.forEach((item) => {
        cols.push({
          key: `item_${item.id}`,
          header: `${item.item_name} (₹)`,
          render: (row) => {
            const quoteItem = (row.items || []).find((qi) => qi.rfq_item_id === item.id);
            if (quoteItem) {
              return (
                <div className="text-xs">
                  <div className="font-semibold">{currency(quoteItem.unit_price)}</div>
                  <div className="text-[10px] text-slate-400">Total: {currency(quoteItem.line_total)}</div>
                </div>
              );
            }
            return <span className="text-slate-400">-</span>;
          }
        });
      });
    }

    cols.push(
      { key: 'subtotal', header: 'Subtotal', render: (row) => currency(row.subtotal || row.price) },
      { key: 'tax_total', header: 'Taxes', render: (row) => currency(row.tax_total || 0) },
      { key: 'freight', header: 'Freight', render: (row) => currency(row.freight || 0) },
      {
        key: 'grand_total',
        header: 'Grand Total',
        render: (row) => (
          <span className="font-bold text-brand-600 dark:text-brand-400">
            {currency(row.grand_total || row.price)}
          </span>
        ),
      },
      { key: 'delivery', header: 'Delivery' },
      { key: 'rating', header: 'Rating', render: (row) => <span>{row.rating} / 5.0</span> },
      { key: 'warranty', header: 'Warranty' },
      {
        key: 'score',
        header: 'Score',
        render: (row) => (
          <div className="flex items-center gap-2">
            {row.best ? <Award className="h-4 w-4 text-amber-500" /> : null}
            <span className={row.best ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-semibold text-slate-700 dark:text-slate-400'}>{row.score}</span>
          </div>
        ),
      }
    );

    if (selectedRfq && selectedRfq.status !== 'Awarded') {
      cols.push({
        key: 'actions',
        header: 'Action',
        render: (row) => (
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setAwardingBid(row);
                setShowConfirmModal(true);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 transition shadow-sm"
            >
              <Award className="h-3.5 w-3.5" /> Award
            </button>
            <button
              onClick={() => navigate(`/admin/bids/negotiate/${row.id}`)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Negotiate
            </button>
          </div>
        ),
      });
    } else if (selectedRfq && selectedRfq.status === 'Awarded') {
      cols.push({
        key: 'actions',
        header: 'Action',
        render: (row) => (
          row.status === 'awarded' || row.best ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Winner
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-semibold">Rejected</span>
          )
        ),
      });
    }

    return cols;
  }, [selectedRfqDetails, selectedRfq]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-0 overflow-hidden space-y-4">
      <PageHeader 
        title="Bid Comparison" 
        description="Compare quotations by price, timeline, rating, warranty, and weighted evaluation score." 
        action={
          rfqList.length > 0 && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2 shadow-sm min-w-[280px]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">RFQ Scope:</span>
              <select 
                className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-0 cursor-pointer h-9"
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
              >
                {rfqList.map((r) => (
                  <option key={r.id} value={r.id} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {r.id} - {r.title.substring(0, 30)}{r.title.length > 30 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Bid Comparison Bento Box */}
        <Card className="lg:col-span-3 flex flex-col h-full min-h-0 overflow-hidden">
          <CardHeader 
            title={`${selectedRfqId} Bid Matrix`} 
            subtitle={selectedRfq ? selectedRfq.title : "Best quotation is highlighted for award review"} 
          />
          <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
            <DataTable
              data={filteredBids}
              empty="No supplier quotations have been submitted yet for this RFQ."
              columns={comparisonColumns}
            />
          </div>
        </Card>

        {/* Side Panel Bento boxes */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-1">
          {/* RFQ Details Card */}
          <Card className="p-5 flex flex-col shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">RFQ Sourcing Scope</h3>
            {selectedRfqDetails ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Title</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-250 leading-relaxed block">{selectedRfqDetails.title}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedRfqDetails.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Deadline</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedRfqDetails.deadline}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Value</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400 mt-0.5 block">{currency(selectedRfqDetails.value || 0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Quotes Received</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{filteredBids.length} proposals</span>
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">No RFQ details loaded.</span>
            )}
          </Card>

          {/* Quick Guidelines Card */}
          <Card className="p-5 flex flex-col shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Award Guidance</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Compare bidder metrics including unit pricing, delivery schedules, and system scorecards. Clicking "Award" issues the binding Purchase Order automatically.
            </p>
          </Card>
        </div>
      </div>

      {showConfirmModal && awardingBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-900 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Award Procurement Contract</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Confirm purchase order generation for sourcing event {selectedRfqId}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">SELECTED WINNER</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{awardingBid.supplier}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">TOTAL QUOTED VALUE</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{currency(awardingBid.grand_total || awardingBid.price)}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">DELIVERY SCHEDULE</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{awardingBid.delivery}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">WARRANTY TERMS</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{awardingBid.warranty}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">CONTRACT LEGAL TERMS & CONDITIONS</span>
                <div className="h-44 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-[10px] leading-5 font-mono text-slate-600 dark:text-slate-300">
                  {`PURCHASE ORDER AGREEMENT — NEXUS MANUFACTURING LTD

PO Number      : PO-${new Date().getFullYear()}-XXXX
Issued Date    : ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
Supplier       : ${awardingBid.supplier}
Order Date     : ${new Date().toISOString().split('T')[0]}
Delivery By    : (Quoted Lead Time: ${awardingBid.delivery})
Total Value    : INR ${Number(awardingBid.grand_total || awardingBid.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}

TERMS & CONDITIONS:
1. This Purchase Order constitutes a legally binding procurement contract issued by Nexus Manufacturing Ltd.
2. The Supplier agrees to deliver all items specified herein in full, on or before the delivery date.
3. Payment Terms: Net 30 days upon delivery and submission of a valid GST tax invoice.
4. Any deviation in quantity, specifications, or delivery schedule requires prior written approval.
5. Goods not conforming to specifications will be rejected at the Supplier's expense.
6. Nexus Manufacturing reserves the right to cancel this PO with written notice of 7 business days.
7. Governing Law: Laws of India. Jurisdiction: Jharkhand High Court.

This Purchase Order is issued electronically and is legally valid without physical signature.`}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900 pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAward}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 transition flex items-center gap-1.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Awarding...' : 'Confirm & Issue PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomNotification 
        isOpen={customAlert.isOpen}
        onClose={() => {
          setCustomAlert(prev => ({ ...prev, isOpen: false }));
          if (customAlert.onConfirm) customAlert.onConfirm();
        }}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
      />
    </div>
  );
}
