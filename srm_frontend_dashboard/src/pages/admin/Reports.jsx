import { CalendarClock, Download, FileSpreadsheet, FileText, Plus, Send } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { useState } from 'react';

const reportCatalog = [
  {
    name: 'Monthly Procurement Summary',
    type: 'Standard',
    owner: 'Procurement Ops',
    cadence: 'Monthly',
    lastRun: '2026-05-24',
    status: 'Ready',
  },
  {
    name: 'Supplier Performance Scorecard',
    type: 'Standard',
    owner: 'Supplier Governance',
    cadence: 'Weekly',
    lastRun: '2026-05-25',
    status: 'Ready',
  },
  {
    name: 'RFQ Award Decision Pack',
    type: 'Custom',
    owner: 'Strategic Sourcing',
    cadence: 'On Demand',
    lastRun: '2026-05-21',
    status: 'Draft',
  },
  {
    name: 'PO Exception Register',
    type: 'Standard',
    owner: 'Procurement Ops',
    cadence: 'Daily',
    lastRun: '2026-05-26',
    status: 'Ready',
  },
];

const scheduledReports = [
  { report: 'Supplier Performance Scorecard', recipients: '8 users', nextRun: '2026-05-27 09:00', delivery: 'Email + XLSX' },
  { report: 'PO Exception Register', recipients: 'Procurement team', nextRun: '2026-05-27 08:00', delivery: 'Dashboard + CSV' },
  { report: 'Monthly Procurement Summary', recipients: 'Leadership', nextRun: '2026-06-01 10:00', delivery: 'PDF' },
];

const reportTiles = [
  { label: 'Ready Reports', value: '18', icon: FileText, tone: 'text-blue-700 bg-blue-50' },
  { label: 'Scheduled Runs', value: '7', icon: CalendarClock, tone: 'text-emerald-700 bg-emerald-50' },
  { label: 'Custom Templates', value: '5', icon: FileSpreadsheet, tone: 'text-violet-700 bg-violet-50' },
];

const initialReportForm = {
  name: '',
  type: 'Custom',
  owner: 'Procurement Ops',
  cadence: 'On Demand',
};

export function Reports() {
  const newReport = useDisclosure(false);
  const [reports, setReports] = useState(reportCatalog);
  const [form, setForm] = useState(initialReportForm);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetAndClose = () => {
    setForm(initialReportForm);
    newReport.close();
  };

  const handleCreateReport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const createdReport = {
      name: form.name.trim() || 'Untitled Procurement Report',
      type: form.type,
      owner: form.owner,
      cadence: form.cadence,
      lastRun: today,
      status: 'Draft',
    };

    setReports((current) => [createdReport, ...current]);
    resetAndClose();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Create, schedule, export, and distribute standard or custom procurement reports."
        action={
          <Button onClick={newReport.open}>
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {reportTiles.map((tile) => {
          const Icon = tile.icon;

          return (
            <Card key={tile.label} className="p-5">
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tile.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-500">{tile.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{tile.value}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Report Catalog" subtitle="Standard and custom reports available for export" />
        <DataTable
          data={reports}
          columns={[
            { key: 'name', header: 'Report Name' },
            { key: 'type', header: 'Type' },
            { key: 'owner', header: 'Owner' },
            { key: 'cadence', header: 'Cadence' },
            { key: 'lastRun', header: 'Last Run' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: () => (
                <div className="flex gap-2">
                  <Button variant="secondary" className="h-9 px-3">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="ghost" className="h-9 px-3">
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Scheduled Distribution" subtitle="Automated report delivery plan" />
        <DataTable
          data={scheduledReports}
          columns={[
            { key: 'report', header: 'Report' },
            { key: 'recipients', header: 'Recipients' },
            { key: 'nextRun', header: 'Next Run' },
            { key: 'delivery', header: 'Delivery' },
          ]}
        />
      </Card>

      <Modal title="Create Report" isOpen={newReport.isOpen} onClose={resetAndClose}>
        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-900">New procurement report</p>
          <p className="mt-1 text-sm text-blue-700">Create a report template for export or scheduled distribution.</p>
        </div>
        <form className="space-y-4">
          <FormField label="Report name">
            <input
              className={inputClass}
              placeholder="Supplier risk summary"
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Type">
              <select className={inputClass} value={form.type} onChange={(event) => updateForm('type', event.target.value)}>
                <option>Custom</option>
                <option>Standard</option>
              </select>
            </FormField>
            <FormField label="Owner">
              <select className={inputClass} value={form.owner} onChange={(event) => updateForm('owner', event.target.value)}>
                <option>Procurement Ops</option>
                <option>Supplier Governance</option>
                <option>Strategic Sourcing</option>
                <option>Finance</option>
              </select>
            </FormField>
            <FormField label="Cadence">
              <select className={inputClass} value={form.cadence} onChange={(event) => updateForm('cadence', event.target.value)}>
                <option>On Demand</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </FormField>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateReport}>
              <Plus className="h-4 w-4" />
              Create Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
