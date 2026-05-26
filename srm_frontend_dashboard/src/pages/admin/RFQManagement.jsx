import { Link } from 'react-router-dom';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
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
import { useMemo, useState } from 'react';

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

  const nextRfqId = useMemo(() => createRfqId(rfqList), [rfqList]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetAndClose = () => {
    setForm(initialForm);
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
      status: 'Draft',
    };

    setRfqList((current) => {
      const updated = [newRfq, ...current];
      saveStoredRfqs(updated);
      return updated;
    });
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

      <Modal title="Create RFQ" isOpen={createRfq.isOpen} onClose={createRfq.close}>
        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-900">Draft a new sourcing request</p>
          <p className="mt-1 text-sm text-blue-700">Fill the basic RFQ details. You can add invitees and documents after saving.</p>
        </div>
        <form className="space-y-4">
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
                placeholder="$500,000"
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
      </Modal>
    </div>
  );
}
