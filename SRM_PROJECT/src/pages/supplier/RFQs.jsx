import { Send, Eye, FileText, X, Loader2, Tag, Calendar, IndianRupee, Info, ClipboardList, Package, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { getStoredRfqs, saveStoredRfqs } from '../../utils/rfqStore.js';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export function SupplierRFQs() {
  const navigate = useNavigate();
  const [rfqList, setRfqList] = useState(() => getStoredRfqs());
  const [bidsList, setBidsList] = useState([]);
  
  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [loadingRfq, setLoadingRfq] = useState(false);
  const [drawerError, setDrawerError] = useState(false);

  const currentUser = useMemo(() => {
    return JSON.parse(sessionStorage.getItem('srm_user') || '{"id":2,"fullName":"Supplier User","email":"supplier@srm.local","role":"supplier","companyName":"Apex Industrial Components"}');
  }, []);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    // 1. Fetch RFQs
    fetch(`${apiBaseUrl}/rfqs.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rfqs)) {
          setRfqList(data.rfqs);
          saveStoredRfqs(data.rfqs);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch RFQs from API, using localStorage:', err);
      });

    // 2. Fetch Supplier Bids to show quoted prices
    fetch(`${apiBaseUrl}/bids.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bids)) {
          const filtered = data.bids.filter(b => {
            if (b.user_id === currentUser.id) return true;
            if (b.user_id === null && currentUser.id === 2 && b.id === 'BID-1') return true;
            return false;
          });
          setBidsList(filtered);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch bids from API:', err);
      });
  }, [apiBaseUrl, currentUser.id]);

  const handleOpenDrawer = (rfqRow) => {
    setDrawerOpen(true);
    setLoadingRfq(true);
    setDrawerError(false);
    // Immediately show the row data we already have (title, category, etc.) while items load
    setSelectedRfq({ ...rfqRow, items: [] });

    fetch(`${apiBaseUrl}/rfqs.php?id=${rfqRow.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.rfq) {
          setSelectedRfq(data.rfq);
        } else {
          // API returned success: false, use local row data
          setSelectedRfq({ ...rfqRow, items: [] });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch single RFQ detail:', err);
        // Still show the row data we have, but flag that items couldn't load
        setSelectedRfq({ ...rfqRow, items: [] });
        setDrawerError(true);
      })
      .finally(() => {
        setLoadingRfq(false);
      });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRfq(null);
    setDrawerError(false);
  };

  // ── RFQ Document Content (inside drawer) ──
  const renderDrawerContent = () => {
    if (loadingRfq) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center mb-4">
            <Loader2 className="h-7 w-7 text-brand-600 dark:text-brand-400 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading Sourcing Document</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Fetching RFQ specifications...</p>
        </div>
      );
    }

    if (!selectedRfq) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-500 dark:text-amber-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Could Not Load RFQ</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
            The sourcing document could not be loaded. Please try again or contact the procurement team.
          </p>
        </div>
      );
    }

    const rfq = selectedRfq;
    const items = rfq.items || [];

    return (
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden text-slate-800 dark:text-slate-100 font-sans">
        {/* Watermark */}
        <div className="absolute top-10 right-10 opacity-[0.025] pointer-events-none select-none text-[100px] font-black tracking-widest text-slate-900 dark:text-white rotate-[-15deg] leading-none">
          RFQ
        </div>
        
        {/* ─── Document Header Bar ─── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4 opacity-60" />
              Request for Quotation
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Global Procurement System — Sourcing Document</p>
          </div>
          <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs font-black rounded-lg tracking-wider border border-white/10">
            {rfq.id}
          </span>
        </div>

        {/* ─── Document Body ─── */}
        <div className="p-6">
          {/* Title Block */}
          {rfq.title && (
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{rfq.title}</h3>
            </div>
          )}

          {/* ─── Metadata Cards ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-950/40 p-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                <Tag className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Category</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{rfq.category || '—'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-950/40 p-1.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Deadline</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{rfq.deadline || '—'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/40 p-1.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                <IndianRupee className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Target Budget</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{currency(rfq.value || 0)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-violet-100 dark:bg-violet-950/40 p-1.5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5">
                <Info className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Status</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{rfq.status || '—'}</p>
              </div>
            </div>
          </div>

          {/* ─── Section 1: Scope ─── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-md bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-black">1</div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Scope of Procurement</h3>
            </div>
            <div className="ml-7 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {rfq.description || "The Purchaser invites sealed quotations for the provision of materials or services detailed in the item schedule below. All submissions must represent itemized unit rates, applicable tax percentages, and standard packaging freight charges."}
              </p>
            </div>
          </div>

          {/* ─── Section 2: Sourcing Schedule ─── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded-md bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-black">2</div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Sourcing Schedule</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            {drawerError && items.length === 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 mb-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Line items could not be loaded from the server. The RFQ header data shown above is from cached data.
                </p>
              </div>
            )}

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2.5 w-10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">#</th>
                    <th className="p-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description & Specifications</th>
                    <th className="p-2.5 w-20 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Qty</th>
                    <th className="p-2.5 w-16 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                            {drawerError ? 'Items unavailable — server connection failed.' : 'No sourcing items defined in this package.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="p-2.5">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{item.item_name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                            <ClipboardList className="h-2.5 w-2.5 flex-shrink-0" />
                            {item.specification || 'Standard requirements apply'}
                          </div>
                        </td>
                        <td className="p-2.5 text-right">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity}</span>
                        </td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">{item.unit || 'pcs'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Section 3: Submission Guidelines ─── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-md bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-black">3</div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Submission Guidelines</h3>
            </div>
            <div className="ml-7 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 list-none">
                <li className="flex items-start gap-1.5"><span className="text-brand-500 font-bold mt-px">•</span> All unit prices must be quoted in INR exclusive of taxes.</li>
                <li className="flex items-start gap-1.5"><span className="text-brand-500 font-bold mt-px">•</span> Applicable GST / tax percentages must be itemized per line.</li>
                <li className="flex items-start gap-1.5"><span className="text-brand-500 font-bold mt-px">•</span> Freight and delivery charges to be quoted separately.</li>
                <li className="flex items-start gap-1.5"><span className="text-brand-500 font-bold mt-px">•</span> Quotes must remain valid for a minimum of 30 calendar days.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Document Footer ─── */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-3 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Generated by SRM Procurement System</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500">{rfq.deadline ? `Due: ${rfq.deadline}` : ''}</p>
        </div>
      </div>
    );
  };

  const totalInvitations = rfqList.filter((rfq) => rfq.status !== 'Draft').length;
  const submittedCount = bidsList.length;
  const pendingCount = totalInvitations - submittedCount;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-0 overflow-hidden space-y-4">
      <PageHeader title="RFQs" description="Review buyer sourcing events and submit supplier responses." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* RFQ Invitations Bento Box */}
        <Card className="lg:col-span-2 flex flex-col h-full min-h-0 overflow-hidden">
          <CardHeader title="RFQ Invitations" subtitle="Open and evaluating opportunities" />
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <DataTable
              data={rfqList.filter((rfq) => rfq.status !== 'Draft')}
              columns={[
                { key: 'id', header: 'RFQ' },
                { key: 'title', header: 'Title', nowrap: false },
                { key: 'category', header: 'Category' },
                { key: 'deadline', header: 'Deadline' },
                { key: 'value', header: 'Value', render: (row) => currency(row.value) },
                {
                  key: 'quotedPrice',
                  header: 'Your Quoted Price',
                  render: (row) => {
                    const bid = bidsList.find(b => (b.rfqPackage === row.id || b.rfq_package === row.id));
                    return bid ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{currency(bid.price)}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Not Submitted</span>
                    );
                  }
                },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                { 
                  key: 'action', 
                  header: 'Actions', 
                  render: (row) => {
                    const bid = bidsList.find(b => (b.rfqPackage === row.id || b.rfq_package === row.id));
                    return (
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          className="h-8 px-2.5 text-xs flex items-center gap-1.5"
                          onClick={() => handleOpenDrawer(row)}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        <Button 
                          variant={bid ? "secondary" : "primary"}
                          className="h-8 px-2.5 text-xs flex items-center gap-1.5"
                          onClick={() => navigate('/supplier/bids', { state: { rfqId: row.id } })}
                        >
                          <Send className="h-3.5 w-3.5" /> {bid ? "Re-Bid" : "Bid"}
                        </Button>
                      </div>
                    );
                  } 
                },
              ]}
            />
          </div>
        </Card>

        {/* Side panel bento cards */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-1">
          {/* Bento Stats Card */}
          <Card className="p-5 flex flex-col shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Sourcing Progress</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submitted Bids</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {submittedCount} / {totalInvitations}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Quotes</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                  {pendingCount}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Guidelines Card */}
          <Card className="p-5 flex flex-col shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Submission Guidelines</h3>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
              <li className="flex gap-1.5"><span className="text-emerald-500 font-bold">•</span> Check deadline dates carefully. No late submissions will be accepted.</li>
              <li className="flex gap-1.5"><span className="text-emerald-500 font-bold">•</span> Upload standard technical specs and quality compliance documents.</li>
              <li className="flex gap-1.5"><span className="text-emerald-500 font-bold">•</span> Verify tax declarations and delivery lead times before bidding.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Sliding side panel drawer — only mounted when open */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeDrawer}
          />

          {/* Slide-over RFQ Document Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex-shrink-0 bg-white dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Sourcing Document
              </h2>
              <div className="flex items-center gap-2.5">
                {selectedRfq && (
                  <Button 
                    variant="primary" 
                    className="h-8 text-xs font-semibold py-0 flex items-center gap-1.5"
                    onClick={() => {
                      closeDrawer();
                      navigate('/supplier/bids', { state: { rfqId: selectedRfq.id } });
                    }}
                  >
                    <Send className="h-3.5 w-3.5" /> Bid on RFQ
                  </Button>
                )}
                <button 
                  onClick={closeDrawer}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/50">
              {renderDrawerContent()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
