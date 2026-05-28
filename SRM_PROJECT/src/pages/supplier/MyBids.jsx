import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { bids as mockBids } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Check, UploadCloud } from 'lucide-react';

const initialForm = {
  rfqPackage: 'RFQ-24061',
  price: '',
  delivery: '',
  warranty: '',
};

export function MyBids() {
  const submitBidModal = useDisclosure(false);
  const location = useLocation();
  const currentUser = useMemo(() => {
    return JSON.parse(sessionStorage.getItem('srm_user') || '{"id":2,"fullName":"Supplier User","email":"supplier@srm.local","role":"supplier","companyName":"Apex Industrial Components"}');
  }, []);
  
  const [bidsList, setBidsList] = useState([]);
  
  const [form, setForm] = useState(initialForm);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
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
    if (location.state && location.state.rfqId) {
      setForm(curr => ({ ...curr, rfqPackage: location.state.rfqId }));
      setIsSubmitted(false);
      submitBidModal.open();
      // Clear location state to prevent repeating on refresh
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
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(URL.createObjectURL(file));
    try {
      const { extractTextFromPdf, parseBidPdf } = await import('../../utils/pdfParser.js');
      const text = await extractTextFromPdf(file);
      const parsed = parseBidPdf(text, file.name);
      setForm({
        rfqPackage: parsed.rfqPackage,
        price: parsed.price,
        delivery: parsed.delivery,
        warranty: parsed.warranty,
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
    setIsSubmitted(false);
    submitBidModal.close();
  };

  const handleSave = () => {
    const newBid = {
      id: `BID-${Date.now()}`,
      rfqPackage: form.rfqPackage,
      price: Number(form.price) || 120000,
      delivery: form.delivery || '15 Days',
      warranty: form.warranty || '2 Years',
      score: 85,
      best: false,
      userId: currentUser.id,
      supplierName: currentUser.companyName || currentUser.fullName || 'Apex Industrial Components',
    };
    const updated = [newBid, ...bidsList];
    setBidsList(updated);
    localStorage.setItem('srm_bids', JSON.stringify(updated));

    fetch(`${apiBaseUrl}/bids.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBid),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsSubmitted(true);
        }
      })
      .catch((err) => {
        console.error('Failed to sync Bid to database:', err);
        setIsSubmitted(true);
      });
  };

  return (
    <>
      <PageHeader 
        title="My Bids" 
        description="Track submitted quotations and commercial evaluation status." 
        action={
          <Button onClick={() => { setIsSubmitted(false); submitBidModal.open(); }}>
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
            { key: 'price', header: 'Quoted Price', render: (row) => currency(row.price) },
            { key: 'delivery', header: 'Delivery' },
            { key: 'warranty', header: 'Warranty' },
            { key: 'score', header: 'Evaluation Score' },
            { key: 'best', header: 'Status', render: (row) => <StatusBadge status={row.best ? 'Approved' : 'Evaluating'} /> },
          ]}
        />
      </Card>

      <Modal title={isSubmitted ? "Submission Confirmed" : "Submit Bid Quotation"} isOpen={submitBidModal.isOpen} onClose={resetAndClose} size={isSubmitted ? 'md' : (pdfBlobUrl ? 'xxl' : 'lg')}>
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className="mb-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10">
              <Check className="h-8 w-8 animate-bounce" strokeWidth={3} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Proposal Submitted Successfully!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
              Your bid for <span className="font-semibold text-slate-800 dark:text-slate-200">{form.rfqPackage}</span> has been recorded and synchronized with the administrator's console.
            </p>
            
            <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-left space-y-2.5 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Target RFQ:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{form.rfqPackage}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Quoted Price:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currency(Number(form.price) || 120000)}</span>
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
            
            <Button onClick={resetAndClose} className="w-full max-w-xs">
              Done
            </Button>
          </div>
        ) : (
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
                    Upload a bid quotation PDF to automatically extract bid fields
                  </p>
                  
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
                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-150 mb-2.5"
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
                      Download Sample Bid Quotation
                    </a>
                  </div>
                  
                  {isParsing && (
                    <p className="mt-3 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
                      Extracting quotation details...
                    </p>
                  )}
                </div>
              </div>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Target RFQ Package">
                    <input 
                      className={inputClass} 
                      value={form.rfqPackage} 
                      onChange={e => updateForm('rfqPackage', e.target.value)} 
                      placeholder="e.g. RFQ-24061"
                    />
                  </FormField>
                  <FormField label="Quoted Price (₹)">
                    <input 
                      className={inputClass} 
                      type="number"
                      value={form.price} 
                      onChange={e => updateForm('price', e.target.value)} 
                      placeholder="120000"
                    />
                  </FormField>
                  <FormField label="Delivery Lead Time">
                    <input 
                      className={inputClass} 
                      value={form.delivery} 
                      onChange={e => updateForm('delivery', e.target.value)} 
                      placeholder="e.g. 15 Days"
                    />
                  </FormField>
                  <FormField label="Warranty Period">
                    <input 
                      className={inputClass} 
                      value={form.warranty} 
                      onChange={e => updateForm('warranty', e.target.value)} 
                      placeholder="e.g. 2 Years"
                    />
                  </FormField>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
                  <Button type="button" onClick={handleSave}><Check className="h-4 w-4" /> Submit Proposal</Button>
                </div>
              </form>
            </div>

            {pdfBlobUrl && (
              <div className="flex flex-col h-[520px] rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 p-2">
                <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                  <span>Verification Quotation Document View</span>
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
        )}
      </Modal>
    </>
  );
}
