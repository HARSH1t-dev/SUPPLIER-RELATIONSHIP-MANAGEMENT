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
import { useMemo, useState, useEffect } from 'react';

const initialForm = {
  title: '',
  category: 'Manufacturing',
  deadline: '',
  value: '',
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
    };

    setRfqList((current) => {
      const updated = [newRfq, ...current];
      saveStoredRfqs(updated);
      return updated;
    });

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
    <div className="space-y-6">
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

      <Card>
        <CardHeader title="RFQ List" subtitle="Current sourcing events" />
        <DataTable
          data={rfqList}
          columns={[
            { key: 'id', header: 'RFQ' },
            { key: 'title', header: 'Title', render: (row) => <Link className="font-semibold text-brand-700" to={`/admin/rfqs/${row.id}`}>{row.title}</Link> },
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
                  className="h-9 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
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
      </Card>

      <Modal title="Create RFQ" isOpen={createRfq.isOpen} onClose={resetAndClose} size={pdfBlobUrl ? 'xxl' : 'lg'}>
        <div className={`grid gap-6 ${pdfBlobUrl ? 'md:grid-cols-2' : ''}`}>
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
                    <option>Manufacturing</option>
                    <option>Logistics</option>
                    <option>Facilities</option>
                    <option>Services</option>
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

          {pdfBlobUrl && (
            <div className="flex flex-col h-[520px] rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 p-2">
              <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <span>Verification Spec Document View</span>
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
    </div>
  );
}
