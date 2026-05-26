import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { receiving as mockReceiving } from '../../data/mockData.js';
import { number } from '../../utils/formatters.js';
import { useState, useEffect } from 'react';
import { Plus, Check, UploadCloud } from 'lucide-react';

const initialForm = {
  receipt: '',
  po: 'PO-88021',
  item: 'Industrial Bearings',
  received: 2500,
  accepted: 2490,
  items: [{ name: 'Industrial Bearings', received: 2500, accepted: 2490 }]
};

export function GoodsReceiving() {
  const uploadGrnModal = useDisclosure(false);
  const [receiptsList, setReceiptsList] = useState(() => {
    const saved = localStorage.getItem('srm_receipts');
    if (saved) return JSON.parse(saved);
    return mockReceiving;
  });
  
  const [form, setForm] = useState(initialForm);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    fetch(`${apiBaseUrl}/receipts.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.receipts)) {
          setReceiptsList(data.receipts);
          localStorage.setItem('srm_receipts', JSON.stringify(data.receipts));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Receipts from API, using localStorage:', err);
      });
  }, [apiBaseUrl]);

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

  const resetAndClose = () => {
    setForm(initialForm);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    uploadGrnModal.close();
  };

  const handleSave = () => {
    const newReceipt = {
      receipt: form.receipt || 'REC-' + Math.floor(1000 + Math.random() * 9000),
      po: form.po,
      item: form.item,
      received: Number(form.received) || 2500,
      accepted: Number(form.accepted) || 2500,
      status: 'Approved',
    };
    const updated = [newReceipt, ...receiptsList];
    setReceiptsList(updated);
    localStorage.setItem('srm_receipts', JSON.stringify(updated));

    fetch(`${apiBaseUrl}/receipts.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReceipt),
    })
      .then((res) => res.json())
      .catch((err) => console.error('Failed to sync Receipt to database:', err));

    resetAndClose();
  };

  return (
    <>
      <PageHeader 
        title="Receipts & Reviews" 
        description="Confirm delivered items, record accepted quantities, and review supplier delivery quality." 
        action={
          <Button onClick={uploadGrnModal.open}>
            <Plus className="h-4 w-4" /> Record Goods Receipt
          </Button>
        }
      />
      <Card>
        <CardHeader title="Receipt Queue" subtitle="Deliveries awaiting confirmation and supplier review" />
        <DataTable
          data={receiptsList}
          columns={[
            { key: 'receipt', header: 'Receipt' },
            { key: 'po', header: 'PO' },
            { key: 'item', header: 'Item' },
            { key: 'received', header: 'Delivered Qty', render: (row) => number(row.received) },
            { key: 'accepted', header: 'Accepted Qty', render: (row) => number(row.accepted) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>

      <Modal title="Record Goods Receipt" isOpen={uploadGrnModal.isOpen} onClose={resetAndClose} size={pdfBlobUrl ? 'xxl' : 'xl'}>
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
                  Upload a delivery receipt PDF to automatically extract line items
                </p>
                
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
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="h-8 px-2 py-0 text-xs font-semibold"
                    onClick={() => {
                      const newItems = [...(form.items || []), { name: '', received: 0, accepted: 0 }];
                      updateItems(newItems);
                    }}
                  >
                    + Add Item
                  </Button>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                        <th className="p-2 font-semibold">Item Description</th>
                        <th className="p-2 font-semibold w-24">Delivered</th>
                        <th className="p-2 font-semibold w-24">Accepted</th>
                        <th className="p-2 font-semibold w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(form.items || []).map((itemRow, index) => (
                        <tr key={index} className="hover:bg-slate-50/55">
                          <td className="p-2">
                            <input
                              className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white"
                              value={itemRow.name}
                              placeholder="e.g. Steel Brackets"
                              onChange={(e) => {
                                const newItems = [...form.items];
                                newItems[index].name = e.target.value;
                                updateItems(newItems);
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white"
                              value={itemRow.received}
                              onChange={(e) => {
                                const newItems = [...form.items];
                                newItems[index].received = Number(e.target.value) || 0;
                                updateItems(newItems);
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-brand-500 rounded p-1 dark:text-white"
                              value={itemRow.accepted}
                              onChange={(e) => {
                                const newItems = [...form.items];
                                newItems[index].accepted = Number(e.target.value) || 0;
                                updateItems(newItems);
                              }}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              className="text-rose-500 hover:text-rose-700 disabled:opacity-30"
                              disabled={form.items.length <= 1}
                              onClick={() => {
                                const newItems = form.items.filter((_, idx) => idx !== index);
                                updateItems(newItems);
                              }}
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Dynamic Totals Panel */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Summary Total:</span>
                    <div className="space-x-4">
                      <span>Delivered: <span className="text-brand-600 dark:text-brand-400">{form.received}</span></span>
                      <span>Accepted: <span className="text-emerald-600 dark:text-emerald-400">{form.accepted}</span></span>
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

          {pdfBlobUrl && (
            <div className="flex flex-col h-[520px] rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 p-2">
              <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <span>Verification Delivery Document View</span>
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
    </>
  );
}
