import { Link } from 'react-router-dom';
import { CalendarPlus, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { currency } from '../../utils/formatters.js';
import { createRfqId, getStoredRfqs, saveStoredRfqs } from '../../utils/rfqStore.js';
import { pushNotification } from '../../utils/notificationStore.js';
import { useMemo, useState, useEffect } from 'react';

const initialForm = {
  title: '',
  category: 'Mechanical',
  deadline: '',
  value: '',
  description: '',
  items: [
    { item_name: 'Steel Rod', specification: 'Grade A', quantity: 100, unit: 'pcs' },
    { item_name: 'Copper Wire', specification: '2mm', quantity: 20, unit: 'rolls' }
  ]
};

function parseValue(value) {
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function RFQManagement() {
  const createRfq = useDisclosure(false);
  const [rfqList, setRfqList] = useState(() => getStoredRfqs());
  const [form, setForm] = useState(initialForm);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
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
  }, [apiBaseUrl]);

  const nextRfqId = useMemo(() => createRfqId(rfqList), [rfqList]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...(current.items || []), { item_name: '', specification: '', quantity: 1, unit: 'pcs' }]
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((current) => {
      const updatedItems = [...(current.items || [])];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...current, items: updatedItems };
    });
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items: (current.items || []).filter((_, idx) => idx !== index)
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
      const { extractTextFromPdf, parseRfqPdf } = await import('../../utils/pdfParser.js');
      const text = await extractTextFromPdf(file);
      const parsed = parseRfqPdf(text, file.name);
      setForm({
        title: parsed.title,
        category: parsed.category,
        deadline: parsed.deadline,
        value: parsed.value,
        description: parsed.description || '',
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
    createRfq.close();
  };

  const handleSave = () => {
    const newRfq = {
      id: nextRfqId,
      title: form.title.trim() || 'Untitled sourcing request',
      category: form.category,
      deadline: form.deadline || 'TBD',
      bids: 0,
      value: parseValue(form.value),
      status: 'Active',
      description: form.description || '',
      items: form.items || []
    };

    setRfqList((current) => {
      const updated = [newRfq, ...current];
      saveStoredRfqs(updated);
      return updated;
    });

    // Notify supplier that a new RFQ has been published
    pushNotification({
      category: 'sourcing',
      icon: 'FileText',
      iconColor: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20',
      title: `New RFQ: ${newRfq.id}`,
      body: `"${newRfq.title}" has been published. Category: ${newRfq.category}. Deadline: ${newRfq.deadline}.`,
      type: 'Sourcing',
    }, 'supplier');

    fetch(`${apiBaseUrl}/rfqs.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRfq),
    })
      .then((res) => res.json())
      .catch((err) => console.error('Failed to sync RFQ to database:', err));

    resetAndClose();
  };

  const handleDelete = (id) => {
    const shouldDelete = window.confirm(`Delete ${id}? This will remove it from the RFQ list.`);

    if (shouldDelete) {
      setRfqList((current) => {
        const updated = current.filter((rfq) => rfq.id !== id);
        saveStoredRfqs(updated);
        return updated;
      });

      fetch(`${apiBaseUrl}/rfqs.php?id=${id}`, {
        method: 'DELETE',
      })
        .then((res) => res.json())
        .catch((err) => console.error('Failed to delete RFQ from database:', err));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-0 overflow-hidden space-y-4">
      <PageHeader
        title="RFQ Management"
        description="Create, publish, evaluate, and award sourcing events."
        action={
          <Button onClick={createRfq.open}>
            <Plus className="h-4 w-4" />
            New RFQ
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* RFQ List Bento Box */}
        <Card className="lg:col-span-2 flex flex-col h-full min-h-0 overflow-hidden">
          <CardHeader title="RFQ List" subtitle="Current sourcing events" />
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <DataTable
              data={rfqList}
              columns={[
                { key: 'id', header: 'RFQ' },
                { key: 'title', header: 'Title', nowrap: false, render: (row) => <Link className="font-semibold text-brand-700 dark:text-brand-400" to={`/admin/rfqs/${row.id}`}>{row.title}</Link> },
                { key: 'category', header: 'Category' },
                { key: 'deadline', header: 'Deadline' },
                { key: 'bids', header: 'Bids' },
                { key: 'value', header: 'Value', render: (row) => currency(row.value) },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700"
                      onClick={() => handleDelete(row.id)}
                      aria-label={`Delete ${row.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </Card>

        {/* Side Panel Bento boxes */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-1">
          {/* Bento Card 1: AI Specification Upload */}
          <Card className="p-5 flex flex-col shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">AI Specification Auto-fill</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-normal">
              Upload a procurement spec PDF to auto-fill sourcing parameters and line items.
            </p>
            
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-center transition hover:bg-slate-100/50 dark:hover:bg-slate-900/40">
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-full bg-blue-50 dark:bg-blue-950/40 p-2.5 text-blue-600 dark:text-blue-400 mb-2">
                  <UploadCloud className={`h-5 w-5 ${isParsing ? 'animate-bounce' : ''}`} />
                </div>
                
                <input
                  type="file"
                  accept=".pdf"
                  id="rfq-bento-pdf-upload"
                  className="hidden"
                  onChange={handlePdfUpload}
                  disabled={isParsing}
                />
                <label
                  htmlFor="rfq-bento-pdf-upload"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-150 mb-2"
                >
                  Choose PDF File
                </label>

                <div className="flex flex-col items-center gap-1 text-[10px] text-slate-400">
                  <span>Or download a template:</span>
                  <a 
                    href={`${import.meta.env.BASE_URL || '/'}samples/rfq-procurement-spec.pdf`} 
                    download 
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                  >
                    Sample RFQ Spec.pdf
                  </a>
                </div>
                
                {isParsing && (
                  <p className="mt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1">
                    Extracting specs...
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Bento Card 2: Sourcing Analytics */}
          <Card className="p-5 flex flex-col shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Sourcing Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Events</span>
                <span className="text-lg font-bold text-slate-850 dark:text-slate-200 mt-1 block">
                  {rfqList.filter(r => r.status === 'Active' || r.status === 'Under Evaluation').length}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Value</span>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-2 block truncate">
                  {currency(rfqList.reduce((acc, curr) => acc + (curr.value || 0), 0))}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal title="Create RFQ" isOpen={createRfq.isOpen} onClose={resetAndClose} size="lg">
        <div className="grid gap-6">
          <div>
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-blue-900">Draft a new sourcing request</p>
              <p className="mt-1 text-sm text-blue-700">Fill the basic RFQ details. You can add invitees and documents after saving.</p>
            </div>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="mb-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5 text-center transition hover:bg-slate-100/50 dark:hover:bg-slate-900">
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-full bg-blue-50 dark:bg-blue-950/40 p-2.5 text-blue-600 dark:text-blue-400 mb-2">
                    <UploadCloud className={`h-5 w-5 ${isParsing ? 'animate-bounce' : ''}`} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Auto-fill from Document
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                    Upload a procurement specification PDF to auto-fill the RFQ details
                  </p>
                  
                  <input
                    type="file"
                    accept=".pdf"
                    id="rfq-pdf-upload-input"
                    className="hidden"
                    onChange={handlePdfUpload}
                    disabled={isParsing}
                  />
                  <label
                    htmlFor="rfq-pdf-upload-input"
                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-150 mb-2.5"
                  >
                    Choose PDF File
                  </label>

                  <div className="flex items-center justify-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Or get a template:</span>
                    <a 
                      href={`${import.meta.env.BASE_URL}samples/rfq-procurement-spec.pdf`} 
                      download 
                      className="text-brand-600 hover:text-brand-500 hover:underline font-semibold"
                    >
                      Download Sample RFQ Procurement Spec
                    </a>
                  </div>
                  
                  {isParsing && (
                    <p className="mt-3 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
                      Extracting specifications...
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="RFQ title">
                  <input
                    className={inputClass}
                    placeholder="Material or service requirement"
                    value={form.title}
                    onChange={(event) => updateForm('title', event.target.value)}
                  />
                </FormField>
                <FormField label="Category">
                  <select className={inputClass} value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                    <option>Mechanical</option>
                    <option>Electrical</option>
                    <option>Packaging</option>
                    <option>Logistics</option>
                    <option>Chemical & Raw Materials</option>
                    <option>Facilities & Maintenance</option>
                    <option>IT & Professional Services</option>
                  </select>
                </FormField>
                <FormField label="Deadline">
                  <input className={inputClass} type="date" value={form.deadline} onChange={(event) => updateForm('deadline', event.target.value)} />
                </FormField>
                <FormField label="Target value">
                  <input
                    className={inputClass}
                    placeholder="₹500,000"
                    value={form.value}
                    onChange={(event) => updateForm('value', event.target.value)}
                  />
                </FormField>
              </div>
              <div className="mt-4 mb-4">
                <FormField label="RFQ Description / Scope of Procurement">
                  <textarea
                    className={inputClass}
                    rows={3}
                    placeholder="Describe technical requirements, quality standards, and terms of delivery..."
                    value={form.description}
                    onChange={(event) => updateForm('description', event.target.value)}
                  />
                </FormField>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">RFQ Line Items</h3>
                  <Button type="button" variant="ghost" className="h-8 text-xs font-semibold py-0" onClick={addItem}>
                    + Add Item
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-48 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <th className="p-2 font-semibold">Item Name</th>
                        <th className="p-2 font-semibold">Specification</th>
                        <th className="p-2 font-semibold" style={{ width: '80px' }}>Qty</th>
                        <th className="p-2 font-semibold" style={{ width: '80px' }}>Unit</th>
                        <th className="p-2" style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.items || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-slate-400">No items. Click "Add Item" to start.</td>
                        </tr>
                      ) : (
                        (form.items || []).map((item, index) => (
                          <tr key={index} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <td className="p-1.5">
                              <input
                                className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none"
                                value={item.item_name}
                                onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                                placeholder="e.g. Steel Rod"
                                required
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none"
                                value={item.specification}
                                onChange={(e) => updateItem(index, 'specification', e.target.value)}
                                placeholder="e.g. Grade A"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none"
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-200 outline-none"
                                value={item.unit}
                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                placeholder="pcs"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-rose-500 hover:text-rose-700 font-bold text-sm"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave}>
                  <CalendarPlus className="h-4 w-4" />
                  Save RFQ
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
