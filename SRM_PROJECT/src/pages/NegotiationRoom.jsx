import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Send, Check, X, Award, Info, Calendar, 
  ArrowLeft, User, Clock, ArrowRightLeft, IndianRupee, Tag, ShieldAlert,
  Loader2
} from 'lucide-react';
import { Card, CardHeader } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { currency } from '../utils/formatters.js';
import { CustomNotification } from '../components/CustomNotification.jsx';

export function NegotiationRoom() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  
  const currentUser = useMemo(() => {
    return JSON.parse(sessionStorage.getItem('srm_user') || '{"id":1,"role":"admin","fullName":"Admin User"}');
  }, []);
  
  const isAdmin = currentUser.role === 'admin';
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [bidDetails, setBidDetails] = useState(null);
  const [rfqDetails, setRfqDetails] = useState(null);
  const [negotiations, setNegotiations] = useState([]);
  const [messages, setMessages] = useState([]);
  
  const [messageInput, setMessageInput] = useState('');
  const [counterPriceInput, setCounterPriceInput] = useState('');
  const [counterNoteInput, setCounterNoteInput] = useState('');
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [showSupplierCounterModal, setShowSupplierCounterModal] = useState(false);
  const [supplierPriceInput, setSupplierPriceInput] = useState('');
  const [supplierNoteInput, setSupplierNoteInput] = useState('');

  const [customAlert, setCustomAlert] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
    promptPlaceholder: '',
    defaultValue: ''
  });

  const showAlert = (title, message, type = 'success', onConfirm = null) => {
    setCustomAlert({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  const showConfirm = (title, message, onConfirm) => {
    setCustomAlert({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm
    });
  };

  const showPrompt = (title, message, promptPlaceholder = 'Enter value...', defaultValue = '', onConfirm = null) => {
    setCustomAlert({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      promptPlaceholder,
      defaultValue,
      onConfirm
    });
  };

  const chatEndRef = useRef(null);

  // Helper to fetch details
  const fetchRoomData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/negotiations.php?bid_id=${bidId}`);
      const data = await res.json();
      if (data.success) {
        setBidDetails(data.bid);
        setRfqDetails(data.rfq);
        setNegotiations(data.negotiations);
        setMessages(data.messages);
      } else {
        setError(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRoomData(true);
  }, [bidId]);

  // Real-time 3-second polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoomData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [bidId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageInput.trim() === '') return;

    try {
      const res = await fetch(`${apiBaseUrl}/negotiations.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          bid_id: bidId,
          user_id: currentUser.id,
          message: messageInput
        })
      });
      const data = await res.json();
      if (data.success) {
        // Create Negotiation Notification for Message
        try {
          const savedNotifs = localStorage.getItem('srm_notifications');
          let notifsList = [];
          if (savedNotifs) {
            const parsed = JSON.parse(savedNotifs);
            if (Array.isArray(parsed)) {
              notifsList = parsed.filter(Boolean);
            }
          }
          const senderName = currentUser.role === 'admin' ? 'Buyer' : (currentUser.companyName || currentUser.fullName || 'Supplier');
          const newNotif = {
            id: Date.now(),
            category: 'sourcing',
            icon: 'MessageSquare',
            iconColor: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20',
            title: `New Message in ${bidId}`,
            body: `${senderName}: "${messageInput.length > 60 ? messageInput.substring(0, 57) + '...' : messageInput}"`,
            time: 'Just now',
            read: false,
            type: 'Business'
          };
          localStorage.setItem('srm_notifications', JSON.stringify([newNotif, ...notifsList]));
          window.dispatchEvent(new Event('srm_notifications_updated'));
        } catch (err) {
          console.warn('Failed to save message notification', err);
        }

        setMessageInput('');
        fetchRoomData(false);
      } else {
        showAlert('Message Error', data.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Message Error', 'Failed to send message', 'error');
    }
  };

  // Handle submit counter-offer
  const handleSubmitCounter = async () => {
    if (!counterPriceInput || Number(counterPriceInput) <= 0) {
      showAlert('Invalid Price', 'Please enter a valid price greater than zero', 'error');
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/negotiations.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'counter_offer',
          bid_id: bidId,
          user_id: currentUser.id,
          price: Number(counterPriceInput),
          message: counterNoteInput
        })
      });
      const data = await res.json();
      if (data.success) {
        // Create Negotiation Notification for Counter-Offer
        try {
          const savedNotifs = localStorage.getItem('srm_notifications');
          let notifsList = [];
          if (savedNotifs) {
            const parsed = JSON.parse(savedNotifs);
            if (Array.isArray(parsed)) {
              notifsList = parsed.filter(Boolean);
            }
          }
          const initiatorName = currentUser.role === 'admin' ? 'Buyer' : (currentUser.companyName || currentUser.fullName || 'Supplier');
          const formattedPrice = currency(Number(counterPriceInput));
          const newNotif = {
            id: Date.now(),
            category: 'sourcing',
            icon: 'ArrowRightLeft',
            iconColor: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20',
            title: `Counter-Offer Proposed: ${bidId}`,
            body: `${initiatorName} proposed a revised counter-offer of ${formattedPrice}. Note: "${counterNoteInput || 'No comment'}"`,
            time: 'Just now',
            read: false,
            type: 'Business'
          };
          localStorage.setItem('srm_notifications', JSON.stringify([newNotif, ...notifsList]));
          window.dispatchEvent(new Event('srm_notifications_updated'));
        } catch (err) {
          console.warn('Failed to save counter-offer notification', err);
        }

        setShowCounterModal(false);
        setCounterPriceInput('');
        setCounterNoteInput('');
        fetchRoomData(false);
        showAlert('Counter Offer Submitted', 'Counter-offer proposed successfully.', 'success');
      } else {
        showAlert('Offer Failed', data.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Failed to submit counter offer', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Admin accepting bid with confirmation
  const handleAcceptBid = (agreedPrice) => {
    showConfirm(
      'Accept Bid Price',
      `Are you sure you want to accept the bid price of ${currency(agreedPrice)}? This will lock the negotiated terms.`,
      () => handleRespondCounter('accept')
    );
  };

  // Handle respond to active counter-offer
  const handleRespondCounter = async (responseType, price = 0.0, note = '') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/negotiations.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_counter',
          bid_id: bidId,
          user_id: currentUser.id,
          response: responseType,
          price: price,
          message: note
        })
      });
      const data = await res.json();
      if (data.success) {
        // Create Negotiation Notification for Response
        try {
          const savedNotifs = localStorage.getItem('srm_notifications');
          let notifsList = [];
          if (savedNotifs) {
            const parsed = JSON.parse(savedNotifs);
            if (Array.isArray(parsed)) {
              notifsList = parsed.filter(Boolean);
            }
          }
          const responderName = currentUser.role === 'admin' ? 'Buyer' : (currentUser.companyName || currentUser.fullName || 'Supplier');
          
          let notifTitle = '';
          let notifBody = '';
          let notifIcon = 'MessageSquare';
          let notifIconColor = 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20';

          if (responseType === 'accept') {
            notifTitle = `Counter-Offer Accepted: ${bidId}`;
            notifBody = `${responderName} has accepted the counter-offer terms. Pricing is locked.`;
            notifIcon = 'CheckCircle';
            notifIconColor = 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20';
          } else if (responseType === 'reject') {
            notifTitle = `Counter-Offer Rejected: ${bidId}`;
            notifBody = `${responderName} has rejected the active counter-offer terms.`;
            notifIcon = 'AlertTriangle';
            notifIconColor = 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20';
          } else if (responseType === 'counter') {
            notifTitle = `Revised Counter-Offer: ${bidId}`;
            notifBody = `${responderName} counter-proposed a revised price of ${currency(price)}. Note: "${note || 'No comment'}"`;
            notifIcon = 'ArrowRightLeft';
            notifIconColor = 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20';
          }

          if (notifTitle) {
            const newNotif = {
              id: Date.now(),
              category: 'sourcing',
              icon: notifIcon,
              iconColor: notifIconColor,
              title: notifTitle,
              body: notifBody,
              time: 'Just now',
              read: false,
              type: 'Business'
            };
            localStorage.setItem('srm_notifications', JSON.stringify([newNotif, ...notifsList]));
            window.dispatchEvent(new Event('srm_notifications_updated'));
          }
        } catch (err) {
          console.warn('Failed to save respond-counter notification', err);
        }

        fetchRoomData(false);
        showAlert(
          'Action Success', 
          'Counter-offer response recorded.', 
          'success',
          () => {
            if (responseType === 'accept') {
              navigate(isAdmin ? `/admin/bids?rfqId=${rfqDetails?.id}` : '/supplier/bids');
            }
          }
        );
      } else {
        showAlert('Action Failed', data.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Response failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Finalize contract / PO generation
  const handleFinalizeContract = async () => {
    showConfirm(
      'Finalize Contract',
      'Are you sure you want to finalize this agreement and issue the PO? This will generate a legally binding Purchase Order and close the RFQ sourcing event.',
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`${apiBaseUrl}/negotiations.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'finalize_contract',
              bid_id: bidId,
              user_id: currentUser.id
            })
          });
          const data = await res.json();
          if (data.success) {
            // Create Finalization Notification
            try {
              const savedNotifs = localStorage.getItem('srm_notifications');
              let notifsList = [];
              if (savedNotifs) {
                const parsed = JSON.parse(savedNotifs);
                if (Array.isArray(parsed)) {
                  notifsList = parsed.filter(Boolean);
                }
              }
              const newNotif = {
                id: Date.now(),
                category: 'orders',
                icon: 'ShoppingCart',
                iconColor: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20',
                title: `Contract Finalized & PO Issued: ${data.po_number || 'PO Ref'}`,
                body: `Agreement successfully finalized for bid proposal ${bidId}. Purchase Order has been issued to the supplier.`,
                time: 'Just now',
                read: false,
                type: 'Business'
              };
              localStorage.setItem('srm_notifications', JSON.stringify([newNotif, ...notifsList]));
              window.dispatchEvent(new Event('srm_notifications_updated'));
            } catch (err) {
              console.warn('Failed to save finalize contract notification', err);
            }

            showAlert(
              'Contract Finalized', 
              `Contract successfully finalized! Purchase Order ${data.po_number} has been generated.`, 
              'success',
              () => navigate(isAdmin ? '/admin/orders' : '/supplier/orders')
            );
          } else {
            showAlert('Finalization Failed', data.message, 'error');
          }
        } catch (err) {
          console.error(err);
          showAlert('Error', 'Finalization failed', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Get active pending round (if exists)
  const activeRound = useMemo(() => {
    return negotiations.find(n => n.status === 'PENDING');
  }, [negotiations]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-brand-600 dark:text-brand-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Negotiation Room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="w-full max-w-md p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-850 dark:text-white">Access Error</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
          <Button onClick={() => navigate(-1)} className="mt-5 w-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] page-enter">
      <div className="mb-4">
        <button 
          onClick={() => navigate(isAdmin ? '/admin/bids' : '/supplier/bids')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Bid Dashboard
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              Negotiation Room: {bidId}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live collaboration for sourcing event: <span className="font-bold text-slate-700 dark:text-slate-300">{bidDetails.rfq_package}</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <StatusBadge status={bidDetails.status} />
            {bidDetails.status === 'accepted' && isAdmin && (
              <Button onClick={handleFinalizeContract} disabled={actionLoading} className="shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Award className="h-4 w-4" /> Finalize & Issue PO
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split-Pane Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        
        {/* Left Pane: Sourcing & Quoted Specs Comparison (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Active Round Callout banner */}
          {activeRound && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 animate-pulse">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Active Counter-Offer — Round {activeRound.round_number}</h4>
                  <p className="text-xs mt-1">
                    Offered Price: <span className="font-extrabold">{currency(activeRound.offered_price)}</span> proposed by{' '}
                    <span className="font-semibold">{activeRound.initiator_name}</span>.
                  </p>
                  {activeRound.message && (
                    <p className="text-xs italic bg-amber-100/50 dark:bg-amber-950/40 rounded p-2 mt-2">
                      &ldquo;{activeRound.message}&rdquo;
                    </p>
                  )}
                  
                  {/* Response actions for the recipient of the active counter-offer */}
                  {activeRound.initiated_by !== currentUser.id && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => {
                          if (isAdmin) {
                            handleAcceptBid(activeRound.offered_price);
                          } else {
                            handleRespondCounter('accept');
                          }
                        }} 
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                      >
                        <Check className="h-3 w-3" /> Accept Price
                      </button>
                      <button 
                        onClick={() => {
                          if (isAdmin) {
                            setCounterPriceInput('');
                            setCounterNoteInput('');
                            setShowCounterModal(true);
                          } else {
                            setSupplierPriceInput('');
                            setSupplierNoteInput('');
                            setShowSupplierCounterModal(true);
                          }
                        }}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                      >
                        <ArrowRightLeft className="h-3 w-3" /> Counter-Propose
                      </button>
                      <button 
                        onClick={() => handleRespondCounter('reject')} 
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                      >
                        <X className="h-3 w-3" /> Reject & Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bid Summary Matrix Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-emerald-500" /> Commercial Quoted Value
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-xs mb-4">
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Original Bid Value</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-200 mt-1 block">
                  {currency(bidDetails.subtotal + bidDetails.tax_total + bidDetails.freight)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Current Adjusted Value</span>
                <span className="text-base font-black text-brand-600 dark:text-brand-400 mt-1 block">
                  {currency(bidDetails.grand_total || bidDetails.price)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Delivery Lead Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{bidDetails.delivery}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase block">Warranty Terms</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{bidDetails.warranty}</span>
              </div>
            </div>
            {isAdmin && bidDetails.status !== 'finalized' && bidDetails.status !== 'rejected' && (
              <div className="flex gap-2 w-full">
                {bidDetails.status === 'accepted' ? (
                  <Button onClick={handleFinalizeContract} disabled={actionLoading} className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    <Check className="h-3.5 w-3.5 mr-1" /> Finalize Agreement & Issue PO
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => handleAcceptBid(activeRound ? activeRound.offered_price : (bidDetails.grand_total || bidDetails.price))} 
                      disabled={actionLoading} 
                      className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Accept Bid
                    </Button>
                    <Button onClick={() => setShowCounterModal(true)} variant="secondary" className="flex-1 text-xs">
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Propose Counter
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sourcing Requirements vs Bid Specifications Sheet */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1">
            <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Line Items Quotation Sheet</h3>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-850 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-400">
                {rfqDetails?.id}
              </span>
            </div>
            <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
              {bidDetails.items?.map((item, idx) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.item_name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5">{item.specification || 'No standard specifications'}</p>
                    </div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Qty: {item.quantity} {item.unit || 'pcs'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <div>
                      <span>Unit price: </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currency(item.unit_price)}</span>
                    </div>
                    <div>
                      <span>Tax: </span>
                      <span className="font-semibold">{item.tax_percent}%</span>
                    </div>
                    <div>
                      <span>Line Total: </span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{currency(item.line_total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currency(bidDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currency(bidDetails.tax_total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Freight:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currency(bidDetails.freight)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-800 pt-1.5 text-slate-800 dark:text-white">
                <span>Total Quote Price:</span>
                <span className="text-brand-600 dark:text-brand-400">{currency(bidDetails.grand_total || bidDetails.price)}</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Pane: Live Thread & Chat Feed (7 cols) */}
        <div className="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm min-h-0">
          
          {/* Chat Header */}
          <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Negotiation Chat thread
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" /> Live updating (3s AJAX)
            </span>
          </div>

          {/* Chat message space */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 py-10">
                <MessageSquare className="h-10 w-10 opacity-30 mb-2" />
                <p className="text-xs italic">No messages exchanged yet. Send a greeting or counter-offer to initiate conversation.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMyMessage = msg.sender_id === currentUser.id;
                
                // Render System log cards (Status update events)
                if (msg.message_type !== 'message') {
                  let badgeColor = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900';
                  if (msg.message_type === 'acceptance' || msg.message_type === 'system') {
                    badgeColor = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
                  } else if (msg.message_type === 'rejection') {
                    badgeColor = 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900';
                  }

                  return (
                    <div key={idx} className="flex justify-center my-2">
                      <span className={`inline-flex items-center gap-1.5 border rounded-full px-4 py-1.5 text-[10px] font-bold ${badgeColor} shadow-sm`}>
                        {msg.message_type === 'acceptance' && <Check className="h-3.5 w-3.5" />}
                        {msg.message_type === 'rejection' && <X className="h-3.5 w-3.5" />}
                        {msg.message_type === 'counter_offer' && <ArrowRightLeft className="h-3.5 w-3.5" />}
                        {msg.message}
                      </span>
                    </div>
                  );
                }

                // Render normal chat bubbles
                return (
                  <div key={idx} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md rounded-2xl p-3.5 shadow-sm text-xs border ${
                      isMyMessage 
                        ? 'bg-brand-600 dark:bg-brand-500 text-white border-brand-500' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 opacity-80 text-[10px] font-bold uppercase tracking-wider">
                        <User className="h-3 w-3" /> 
                        {isMyMessage ? 'You' : msg.sender_name} 
                        <span className="text-[9px] lowercase italic font-normal ml-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form panel */}
          {bidDetails.status !== 'finalized' && bidDetails.status !== 'rejected' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message details..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-755 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 transition"
                  disabled={actionLoading}
                />
                <button 
                  type="submit"
                  disabled={actionLoading || messageInput.trim() === ''}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

      {/* Admin counter offer modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-950 dark:text-slate-50 flex items-center gap-1.5 mb-4">
              <ArrowRightLeft className="h-5 w-5 text-brand-600" /> Propose Commercial Counter-Offer
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Offered Grand Total (INR)</label>
                <input 
                  type="number"
                  value={counterPriceInput}
                  onChange={(e) => setCounterPriceInput(e.target.value)}
                  placeholder="e.g. 110000"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Notes / Conditions</label>
                <textarea 
                  value={counterNoteInput}
                  onChange={(e) => setCounterNoteInput(e.target.value)}
                  placeholder="Describe discounts, packaging reductions, delivery speed requirements..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900 pt-4">
              <button
                type="button"
                onClick={() => setShowCounterModal(false)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitCounter}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5"
                disabled={actionLoading}
              >
                {actionLoading ? 'Submitting...' : 'Submit Counter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier counter offer modal */}
      {showSupplierCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 font-sans">
            <h3 className="text-base font-bold text-slate-950 dark:text-slate-50 flex items-center gap-1.5 mb-4">
              <ArrowRightLeft className="h-5 w-5 text-brand-600" /> Propose Revised Counter-Offer
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Your Offered Price (INR)</label>
                <input 
                  type="number"
                  value={supplierPriceInput}
                  onChange={(e) => setSupplierPriceInput(e.target.value)}
                  placeholder="e.g. 108000"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Counter Notes</label>
                <textarea 
                  value={supplierNoteInput}
                  onChange={(e) => setSupplierNoteInput(e.target.value)}
                  placeholder="Explain discount, delivery timeline details..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900 pt-4">
              <button
                type="button"
                onClick={() => setShowSupplierCounterModal(false)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!supplierPriceInput || Number(supplierPriceInput) <= 0) {
                    showAlert('Invalid Price', 'Please enter a valid price', 'error');
                    return;
                  }
                  setShowSupplierCounterModal(false);
                  await handleRespondCounter('counter', Number(supplierPriceInput), supplierNoteInput);
                }}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5"
                disabled={actionLoading}
              >
                {actionLoading ? 'Submitting...' : 'Submit Counter'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomNotification 
        isOpen={customAlert.isOpen}
        onClose={() => {
          setCustomAlert(prev => ({ ...prev, isOpen: false }));
        }}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
        onConfirm={customAlert.onConfirm}
        promptPlaceholder={customAlert.promptPlaceholder}
        defaultValue={customAlert.defaultValue}
      />
    </div>
  );
}
