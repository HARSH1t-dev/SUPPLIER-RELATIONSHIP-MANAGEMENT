import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { currency } from '../../utils/formatters.js';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Check, UploadCloud, FileText, Send, ArrowLeftRight, Loader2, ClipboardList, Package, Calendar, IndianRupee, Tag, Info, AlertCircle, MessageSquare } from 'lucide-react';
import { CustomNotification } from '../../components/CustomNotification.jsx';
import { pushNotification } from '../../utils/notificationStore.js';

const initialForm = {
  rfqPackage: 'RFQ-24061',
  delivery: '',
  warranty: '',
  items: [],
  freight: 0
};

export function MyBids() {
  const submitBidModal = useDisclosure(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  const currentUser = useMemo(() => {
    return JSON.parse(sessionStorage.getItem('srm_user') || '{"id":2,"fullName":"Supplier User","email":"supplier@srm.local","role":"supplier","companyName":"Apex Industrial Components"}');
  }, []);
  
  const [bidsList, setBidsList] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rfqItems, setRfqItems] = useState([]);
  const [selectedRfqDetails, setSelectedRfqDetails] = useState(null);
  const [loadingRfqDetails, setLoadingRfqDetails] = useState(false);
  const [rfqFetchError, setRfqFetchError] = useState(false);
  const parsedPdfItemsRef = useRef(null);

  // Toggle between Bid Quote form and RFQ Details — single inline view
  const [activeView, setActiveView] = useState('bid'); // 'bid' | 'rfq'

  // Auto-close countdown
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  // Helper to map parsed PDF items to RFQ items
  const mapItems = useCallback((targetItems, parsedList) => {
    if (!parsedList || !targetItems) return [];
    return targetItems.map((item, idx) => {
      const parsedItem = parsedList.find(pi => 
        pi.item_name?.toLowerCase().includes(item.item_name?.toLowerCase()) ||
        item.item_name?.toLowerCase().includes(pi.item_name?.toLowerCase())
      ) || parsedList[idx];
      
      const unitPrice = parsedItem ? parsedItem.unit_price : '';
      const taxPercent = parsedItem ? parsedItem.tax_percent : 18.00;
      const lineTotal = parsedItem ? (item.quantity * unitPrice * (1 + taxPercent / 100)) : 0;
      
      return {
        rfq_item_id: item.id,
        item_name: item.item_name,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: unitPrice,
        tax_percent: taxPercent,
        line_total: lineTotal,
        remarks: parsedItem?.remarks || ''
      };
    });
  }, []);

  // Fetch RFQ details when rfqPackage changes — uses ref for parsed PDF items to avoid re-fetch loops
  useEffect(() => {
    if (!form.rfqPackage) return;
    
    setLoadingRfqDetails(true);
    setRfqFetchError(false);

    fetch(`${apiBaseUrl}/rfqs.php?id=${form.rfqPackage}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rfq && Array.isArray(data.rfq.items)) {
          setSelectedRfqDetails(data.rfq);
          setRfqItems(data.rfq.items);
          
          let finalItems = data.rfq.items.map((item) => ({
            rfq_item_id: item.id,
            item_name: item.item_name,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: '',
            tax_percent: 18.00,
            line_total: 0,
            remarks: ''
          }));

          // Use ref to avoid re-fetch loop
          if (parsedPdfItemsRef.current) {
            finalItems = mapItems(data.rfq.items, parsedPdfItemsRef.current);
            parsedPdfItemsRef.current = null;
          }

          setForm((curr) => ({
            ...curr,
            items: finalItems,
            freight: curr.freight || 0
          }));
        } else {
          setRfqItems([]);
          setSelectedRfqDetails(null);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch RFQ items:', err);
        setRfqItems([]);
        setSelectedRfqDetails(null);
        setRfqFetchError(true);
      })
      .finally(() => {
        setLoadingRfqDetails(false);
      });
  }, [form.rfqPackage, apiBaseUrl, mapItems]);

  const updateQuoteItem = (index, field, val) => {
    setForm((curr) => {
      const updatedItems = [...(curr.items || [])];
      const item = { ...updatedItems[index], [field]: val };

      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const taxPercent = Number(item.tax_percent) || 0;
      item.line_total = qty * unitPrice * (1 + taxPercent / 100);

      updatedItems[index] = item;
      return { ...curr, items: updatedItems };
    });
  };

  const totals = useMemo(() => {
    const items = form.items || [];
    let subtotal = 0;
    let taxTotal = 0;
    
    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const taxPercent = Number(item.tax_percent) || 0;
      
      const lineSub = qty * unitPrice;
      const lineTax = lineSub * (taxPercent / 100);
      
      subtotal += lineSub;
      taxTotal += lineTax;
    });

    const freight = Number(form.freight) || 0;
    const grandTotal = subtotal + taxTotal + freight;

    return { subtotal, taxTotal, freight, grandTotal };
  }, [form.items, form.freight]);

  const fetchBids = useCallback(() => {
    fetch(`${apiBaseUrl}/bids.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bids)) {
          const filtered = data.bids
            .filter(b => {
              if (b.user_id === currentUser.id) return true;
              if (b.user_id === null && currentUser.id === 2 && b.id === 'BID-1') return true;
              return false;
            })
            .map(b => ({
              ...b,
              rfqPackage: b.rfq_package || b.rfqPackage,
            }));
          setBidsList(filtered);
          localStorage.setItem('srm_bids', JSON.stringify(filtered));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Bids from API, using localStorage:', err);
      });
  }, [apiBaseUrl, currentUser.id]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  useEffect(() => {
    if (location.state && location.state.rfqId) {
      setForm(curr => ({ ...curr, rfqPackage: location.state.rfqId }));
      setIsSubmitted(false);
      setActiveView('bid');
      submitBidModal.open();
      window.history.replaceState({}, document.title);
    }
  }, [location, submitBidModal]);

  const updateForm = (field, value) => {
    setForm(curr => ({ ...curr, [field]: value }));
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsing(true);
    const blobUrl = URL.createObjectURL(file);
    setPdfBlobUrl(blobUrl);
    try {
      const { extractTextFromPdf, parseBidPdf } = await import('../../utils/pdfParser.js');
      const text = await extractTextFromPdf(file);
      const parsed = parseBidPdf(text, file.name);
      
      const isSamePackage = parsed.rfqPackage === form.rfqPackage;
      
      if (isSamePackage && rfqItems.length > 0 && Array.isArray(parsed.items)) {
        setForm((curr) => ({
          ...curr,
          price: parsed.price || curr.price,
          delivery: parsed.delivery || curr.delivery,
          warranty: parsed.warranty || curr.warranty,
          items: mapItems(rfqItems, parsed.items)
        }));
      } else {
        // Store in ref instead of state to avoid triggering useEffect re-fetch loop
        parsedPdfItemsRef.current = parsed.items || null;
        setForm((curr) => ({
          ...curr,
          rfqPackage: parsed.rfqPackage || curr.rfqPackage,
          price: parsed.price || curr.price,
          delivery: parsed.delivery || curr.delivery,
          warranty: parsed.warranty || curr.warranty,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const resetAndClose = useCallback(() => {
    setForm(initialForm);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setIsSubmitted(false);
    setActiveView('bid');
    setCountdown(null);
    parsedPdfItemsRef.current = null;
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    submitBidModal.close();
  }, [pdfBlobUrl, submitBidModal]);

  // Auto-close after submission with countdown
  useEffect(() => {
    if (isSubmitted) {
      setCountdown(5);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            resetAndClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isSubmitted, resetAndClose]);

  const handleSave = () => {
    const newBid = {
      id: `BID-${Date.now()}`,
      rfqPackage: form.rfqPackage,
      price: totals.grandTotal,
      delivery: form.delivery || '15 Days',
      warranty: form.warranty || '2 Years',
      score: 85,
      best: false,
      userId: currentUser.id,
      supplierName: currentUser.companyName || currentUser.fullName || 'Apex Industrial Components',
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      freight: totals.freight,
      grandTotal: totals.grandTotal,
      items: form.items || []
    };
    const updated = [newBid, ...bidsList];
    setBidsList(updated);
    localStorage.setItem('srm_bids', JSON.stringify(updated));

    // Notify admin that a bid has been submitted
    pushNotification({
      category: 'sourcing',
      icon: 'FileText',
      iconColor: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20',
      title: `New Bid: ${newBid.id}`,
      body: `"${newBid.supplierName}" submitted a proposal for ${newBid.rfqPackage}. Quoted: ${currency(newBid.price)}.`,
      type: 'Bid',
    }, 'admin');

    fetch(`${apiBaseUrl}/bids.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBid),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          resetAndClose();
          fetchBids();
          setCustomAlert({
            isOpen: true,
            type: 'success',
            title: 'Proposal Submitted',
            message: `Your quote for RFQ ${form.rfqPackage} has been successfully submitted.`
          });
        }
      })
      .catch((err) => {
        console.error('Failed to sync Bid to database:', err);
        resetAndClose();
        fetchBids();
        setCustomAlert({
          isOpen: true,
          type: 'success',
          title: 'Proposal Submitted',
          message: `Your quote for RFQ ${form.rfqPackage} has been successfully submitted (local fallback synced).`
        });
      });
  };

  // ── Render: RFQ Spec Sheet (the PDF-like view) — with loading, error, and rich design ──
  const renderRfqSpecSheet = () => {
    // Loading state
    if (loadingRfqDetails) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-brand-600 dark:text-brand-400 animate-spin" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading RFQ Details</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Fetching sourcing document for {form.rfqPackage}...</p>
        </div>
      );
    }

    // Error state
    if (rfqFetchError || (!selectedRfqDetails && !loadingRfqDetails)) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-500 dark:text-amber-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Could Not Load RFQ</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
            The RFQ sourcing document for <strong>{form.rfqPackage}</strong> could not be fetched. Check the RFQ Package ID and ensure the backend server is running.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('bid')}
            className="mt-4 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            ← Back to Bid Quote
          </button>
        </div>
      );
    }

    const rfq = selectedRfqDetails;

    // Full RFQ Document
    return (
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden text-slate-800 dark:text-slate-100 font-sans">
        {/* Watermark */}
        <div className="absolute top-10 right-10 opacity-[0.025] pointer-events-none select-none text-[100px] font-black tracking-widest text-slate-900 dark:text-white rotate-[-15deg] leading-none">
          RFQ
        </div>
        
        {/* ─── Document Top Header Bar ─── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4 opacity-60" />
              Request for Quotation
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Global Procurement System — Sourcing Document</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs font-black rounded-lg tracking-wider border border-white/10">
              {rfq.id}
            </span>
          </div>
        </div>

        {/* ─── Document Body ─── */}
        <div className="p-6">
          {/* ─── Metadata Cards ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-950/40 p-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                <Tag className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Category</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{rfq.category || '—'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-950/40 p-1.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Deadline</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{rfq.deadline || '—'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/40 p-1.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                <IndianRupee className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Target Budget</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{currency(rfq.value || 0)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
              <div className="rounded-lg bg-violet-100 dark:bg-violet-950/40 p-1.5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5">
                <Info className="h-3.5 w-3.5" />
              </div>
              <div>
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
              <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{rfqItems.length} item{rfqItems.length !== 1 ? 's' : ''}</span>
            </div>
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
                  {(!rfqItems || rfqItems.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No sourcing items defined in this package.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rfqItems.map((item, idx) => (
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
          <div className="mb-2">
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
          <button
            type="button"
            onClick={() => setActiveView('bid')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition flex items-center gap-1"
          >
            <Send className="h-3 w-3" /> Switch to Bid Quote →
          </button>
        </div>
      </div>
    );
  };

  // ── Render: Bid Quote Form ──
  const renderBidForm = () => (
    <div>
      {/* Quoted Price Banner */}
      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-brand-50 via-brand-50/50 to-emerald-50 border border-brand-100 dark:from-brand-950/20 dark:via-brand-950/10 dark:to-emerald-950/20 dark:border-brand-900/50 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Quoted Price (Grand Total)</p>
          <h4 className="text-2xl font-black text-brand-700 dark:text-brand-400 mt-1">{currency(totals.grandTotal)}</h4>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-semibold space-y-0.5">
          <p>Line Items: {form.items?.length || 0}</p>
          <p>Lead Time: {form.delivery || '—'}</p>
        </div>
      </div>

      {/* PDF Auto-fill */}
      <div className="mb-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 text-center transition hover:bg-slate-100/50 dark:hover:bg-slate-900">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full bg-blue-50 dark:bg-blue-950/40 p-2 text-blue-600 dark:text-blue-400 mb-2">
            <UploadCloud className={`h-4 w-4 ${isParsing ? 'animate-bounce' : ''}`} />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Auto-fill from Document</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">Upload a bid quotation PDF to automatically extract bid fields</p>
          
          <input
            type="file"
            accept=".pdf"
            id="bids-pdf-upload-input"
            className="hidden"
            onChange={handlePdfUpload}
            disabled={isParsing}
          />
          <label
            htmlFor="bids-pdf-upload-input"
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-150 mb-2"
          >
            Choose PDF File
          </label>

          <div className="flex items-center justify-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Or get a template:</span>
            <a 
              href={`${import.meta.env.BASE_URL}samples/bid-quotation.pdf`} 
              download 
              className="text-brand-600 hover:text-brand-500 hover:underline font-semibold"
            >
              Download Sample
            </a>
          </div>
          
          {isParsing && (
            <p className="mt-2 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
              Extracting quotation details...
            </p>
          )}

          {pdfBlobUrl && !isParsing && (
            <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Check className="h-3 w-3" /> PDF data extracted successfully
            </p>
          )}
        </div>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-2 mb-3">
          <FormField label="Target RFQ Package">
            <input 
              className={inputClass} 
              value={form.rfqPackage} 
              onChange={e => updateForm('rfqPackage', e.target.value)} 
              placeholder="e.g. RFQ-24061"
            />
          </FormField>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Quotation Sheet</h3>

          {loadingRfqDetails ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading items...
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg mb-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <th className="p-2.5 font-semibold">Item & Specifications</th>
                    <th className="p-2.5 font-semibold" style={{ width: '80px' }}>Qty / Unit</th>
                    <th className="p-2.5 font-semibold" style={{ width: '110px' }}>Unit Price (₹)</th>
                    <th className="p-2.5 font-semibold" style={{ width: '80px' }}>Tax (%)</th>
                    <th className="p-2.5 font-semibold">Remarks</th>
                    <th className="p-2.5 font-semibold text-right" style={{ width: '120px' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(!form.items || form.items.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center">
                        <div className="flex flex-col items-center gap-1.5 text-slate-400">
                          <Package className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                          <p className="text-xs">No items loaded. Enter a valid RFQ Package above.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    form.items.map((item, index) => (
                      <tr key={index} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-2">
                          <div className="font-semibold text-slate-900 dark:text-white">{item.item_name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.specification || 'No specs'}</div>
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          {item.quantity} {item.unit || 'pcs'}
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateQuoteItem(index, 'unit_price', e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.tax_percent}
                            onChange={(e) => updateQuoteItem(index, 'tax_percent', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition"
                            value={item.remarks}
                            onChange={(e) => updateQuoteItem(index, 'remarks', e.target.value)}
                            placeholder="Optional"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-900 dark:text-white">
                          {currency(item.line_total || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Panel */}
          <div className="flex flex-col md:flex-row md:justify-between items-start gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-3 w-full md:max-w-xs text-xs">
              <FormField label="Delivery Lead Time">
                <input
                  className={inputClass}
                  value={form.delivery}
                  onChange={(e) => updateForm('delivery', e.target.value)}
                  placeholder="e.g. 10 Days"
                />
              </FormField>
              <FormField label="Warranty Period">
                <input
                  className={inputClass}
                  value={form.warranty}
                  onChange={(e) => updateForm('warranty', e.target.value)}
                  placeholder="e.g. 3 Years"
                />
              </FormField>
            </div>

            <div className="w-full md:max-w-xs space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxes:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currency(totals.taxTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Freight (₹):</span>
                <input
                  className="w-24 px-2 py-0.5 text-xs text-right border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none focus:border-brand-400 transition"
                  type="number"
                  min="0"
                  value={form.freight}
                  onChange={(e) => updateForm('freight', Number(e.target.value))}
                />
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-900 dark:text-white">Quoted Price (Grand Total):</span>
                <span className="text-brand-600 dark:text-brand-400">{currency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={loadingRfqDetails || !form.items?.length}>
            <Check className="h-4 w-4" /> Submit Proposal
          </Button>
        </div>
      </form>
    </div>
  );

  // ── Render: Success Confirmation (auto-closes) ──
  const renderSubmissionConfirmation = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="mb-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-4 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10">
        <Check className="h-10 w-10" strokeWidth={2.5} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Proposal Submitted Successfully!</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        Your bid for <span className="font-semibold text-slate-800 dark:text-slate-200">{form.rfqPackage}</span> has been recorded.
      </p>
      
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-left space-y-2.5 mb-6">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Target RFQ:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{form.rfqPackage}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Quoted Price:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currency(totals.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Delivery Lead Time:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{form.delivery || '15 Days'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Warranty Period:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{form.warranty || '2 Years'}</span>
        </div>
      </div>

      {/* Auto-close countdown */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Closing automatically in <span className="font-bold text-slate-600 dark:text-slate-300">{countdown ?? 5}s</span>
      </p>
      
      <Button onClick={resetAndClose} variant="secondary" className="w-full max-w-xs">
        Close Now
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader 
        title="My Bids" 
        description="Track submitted quotations and commercial evaluation status." 
        action={
          <Button onClick={() => { setIsSubmitted(false); setActiveView('bid'); submitBidModal.open(); }}>
            <Plus className="h-4 w-4" /> Submit Bid
          </Button>
        }
      />
      <Card>
        <CardHeader title="Submitted Bids" subtitle="Supplier quotation history" />
        <DataTable
          data={bidsList}
          columns={[
            { key: 'rfqPackage', header: 'Bid Package' },
            { key: 'price', header: 'Quoted Price', render: (row) => (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{currency(row.price)}</span>
            )},
            { key: 'delivery', header: 'Delivery' },
            { key: 'warranty', header: 'Warranty' },
            { key: 'score', header: 'Evaluation Score', render: (row) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-brand-500 transition-all" 
                    style={{ width: `${row.score}%` }} 
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{row.score}</span>
              </div>
            )},
            { key: 'best', header: 'Status', render: (row) => <StatusBadge status={row.status || (row.best ? 'Approved' : 'Evaluating')} /> },
            { 
              key: 'negotiate', 
              header: 'Negotiation', 
              render: (row) => (
                <button
                  onClick={() => navigate(`/supplier/bids/negotiate/${row.id}`)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Room
                </button>
              )
            },
          ]}
        />
      </Card>

      {/* ── Bid Submission Modal ── */}
      <Modal 
        title={isSubmitted ? "Submission Confirmed" : "Submit Bid Quotation"} 
        isOpen={submitBidModal.isOpen} 
        onClose={resetAndClose} 
        size={isSubmitted ? 'md' : 'xxl'}
      >
        {isSubmitted ? (
          renderSubmissionConfirmation()
        ) : (
          <div>
            {/* Toggle tabs: Bid Quote ↔ RFQ Details */}
            <div className="flex items-center gap-1.5 mb-5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveView('bid')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeView === 'bid' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Send className="h-3.5 w-3.5" /> Bid Quote
              </button>
              <button
                type="button"
                onClick={() => setActiveView('rfq')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeView === 'rfq' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> RFQ Details
              </button>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-2 hidden sm:inline-flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" /> Toggle views
              </span>
            </div>

            {/* Content based on active view */}
            {activeView === 'bid' ? renderBidForm() : renderRfqSpecSheet()}
          </div>
        )}
      </Modal>
      
      <CustomNotification 
        isOpen={customAlert.isOpen}
        onClose={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
      />
    </>
  );
}
