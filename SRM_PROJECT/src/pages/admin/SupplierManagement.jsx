import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Eye,
  Filter,
  Star,
  UserCheck,
  UserMinus,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { CustomNotification } from '../../components/CustomNotification.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { SearchBar } from '../../components/SearchBar.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { getApiBaseUrl } from '../../utils/apiBase.js';
import {
  DEMO_EVALUATIONS_RFQ_24064,
  DEMO_METRICS,
  DEMO_RFQS,
} from '../../data/supplierEvaluationDemo.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'approved_for_bidding', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS = [
  { value: 'score_desc', label: 'Highest score' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'rating_desc', label: 'Highest rating' },
];

function getAdminUserId() {
  try {
    const stored = sessionStorage.getItem('srm_user');
    return stored ? JSON.parse(stored).id : 1;
  } catch {
    return 1;
  }
}

export function SupplierManagement() {
  const navigate = useNavigate();
  const apiBaseUrl = getApiBaseUrl();

  const [rfqList, setRfqList] = useState([]);
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('score_desc');
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [alert, setAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [demoMode, setDemoMode] = useState(false);

  const pageSize = 8;

  const applyDemoFallback = useCallback((rfqId) => {
    setDemoMode(true);
    setRfqList(DEMO_RFQS);
    if (!rfqId) setSelectedRfqId('RFQ-24064');
    const rows =
      (rfqId || 'RFQ-24064') === 'RFQ-24064'
        ? DEMO_EVALUATIONS_RFQ_24064
        : DEMO_EVALUATIONS_RFQ_24064.filter((r) => r.rfq_id === rfqId);
    setEvaluations(rows);
    setMetrics(DEMO_METRICS);
  }, []);

  const loadEvaluations = useCallback(() => {
    if (!selectedRfqId) return;
    setLoading(true);
    const params = new URLSearchParams({
      rfq_id: selectedRfqId,
      sort,
    });
    if (statusFilter) params.set('status', statusFilter);
    if (query.trim()) params.set('search', query.trim());

    fetch(`${apiBaseUrl}/supplier-evaluations.php?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDemoMode(Boolean(data.demo_mode));
          setEvaluations(data.evaluations || []);
          setMetrics(data.metrics || null);
        } else {
          applyDemoFallback(selectedRfqId);
        }
      })
      .catch((err) => {
        console.error('Failed to load evaluations:', err);
        applyDemoFallback(selectedRfqId);
      })
      .finally(() => setLoading(false));
  }, [apiBaseUrl, selectedRfqId, sort, statusFilter, query, applyDemoFallback]);

  useEffect(() => {
    fetch(`${apiBaseUrl}/init-demo.php`).catch(() => null);
    fetch(`${apiBaseUrl}/rfqs.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rfqs)) {
          setDemoMode(Boolean(data.demo_mode));
          setRfqList(data.rfqs);
          const preferred =
            data.rfqs.find((r) => r.id === 'RFQ-24064') ||
            data.rfqs.find((r) => r.status === 'Under Evaluation') ||
            data.rfqs[0];
          if (preferred) setSelectedRfqId(preferred.id);
        } else {
          setRfqList(DEMO_RFQS);
          setSelectedRfqId('RFQ-24064');
          setDemoMode(true);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch RFQs:', err);
        setRfqList(DEMO_RFQS);
        setSelectedRfqId('RFQ-24064');
        setDemoMode(true);
      });
  }, [apiBaseUrl]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  const postAction = (body) =>
    fetch(`${apiBaseUrl}/supplier-evaluations.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, admin_user_id: getAdminUserId() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Action failed');
        return data;
      });

  const handleReject = (row) => {
    postAction({
      action: 'reject',
      evaluation_id: row.evaluation_id,
    })
      .then(() => {
        setAlert({ isOpen: true, type: 'success', title: 'Rejected', message: `${row.company_name} marked as not shortlisted.` });
        loadEvaluations();
      })
      .catch((err) => setAlert({ isOpen: true, type: 'error', title: 'Error', message: err.message }));
  };

  const handleApproveSingle = (row) => {
    postAction({
      action: 'approve_for_bidding',
      evaluation_id: row.evaluation_id,
    })
      .then(() => {
        setAlert({ isOpen: true, type: 'success', title: 'Approved', message: `${row.company_name} approved for final bidding.` });
        loadEvaluations();
      })
      .catch((err) => setAlert({ isOpen: true, type: 'error', title: 'Error', message: err.message }));
  };

  const handleSaveNotes = () => {
    if (!selectedRow) return;
    postAction({
      action: 'update_notes',
      evaluation_id: selectedRow.evaluation_id,
      admin_notes: notesDraft,
    })
      .then(() => {
        setAlert({ isOpen: true, type: 'success', title: 'Notes saved', message: 'Admin notes updated.' });
        setSelectedRow(null);
        loadEvaluations();
      })
      .catch((err) => setAlert({ isOpen: true, type: 'error', title: 'Error', message: err.message }));
  };

  const totalPages = Math.max(1, Math.ceil(evaluations.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = evaluations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statCards = metrics
    ? [
        { label: 'Total suppliers', value: metrics.total_suppliers, change: 'Directory', trend: 'up', icon: Users },
        { label: 'Pending evaluation', value: metrics.pending_evaluation, change: 'Awaiting review', trend: 'up', icon: Filter },
        { label: 'Shortlisted', value: metrics.shortlisted_suppliers, change: 'In review', trend: 'up', icon: UserCheck },
        { label: 'Approved', value: metrics.approved_suppliers, change: 'Final round', trend: 'up', icon: Award },
        { label: 'Rejected', value: metrics.rejected_suppliers, change: 'Not selected', trend: 'down', icon: UserMinus },
      ]
    : [];

  const selectedRfq = rfqList.find((r) => r.id === selectedRfqId);

  return (
    <>
      {demoMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Demo data active.</strong> MySQL is not connected — evaluations use seeded JSON (
          Laptop Procurement: ₹46,000–₹52,000 from 5 suppliers). Shortlist, approve, and reject still save to{' '}
          <code className="rounded bg-amber-100 px-1">backend/data/demo_store.json</code>.
        </div>
      )}

      <PageHeader
        title="Supplier Management"
        description="Evaluate RFQ quotations, compare suppliers, shortlist candidates, and approve suppliers for the final bidding round."
      />

      {statCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title="Supplier evaluation"
          subtitle={selectedRfq ? `${selectedRfq.title} (${selectedRfq.id})` : 'Select an RFQ to evaluate quotations'}
          action={
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800"
                value={selectedRfqId}
                onChange={(e) => {
                  setSelectedRfqId(e.target.value);
                  setPage(1);
                }}
              >
                {rfqList.map((rfq) => (
                  <option key={rfq.id} value={rfq.id}>
                    {rfq.title} ({rfq.id})
                  </option>
                ))}
              </select>
              <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search supplier or company" />
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          }
        />

        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading supplier evaluations…</p>
        ) : (
          <>
            <DataTable
              data={paginated}
              columns={[
                { key: 'company_name', header: 'Supplier' },
                { key: 'rfq_applied_for', header: 'RFQ' },
                {
                  key: 'supplier_rating',
                  header: 'Rating',
                  render: (row) => (
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      {row.supplier_rating}
                    </span>
                  ),
                },
                { key: 'bid_amount', header: 'Price quote', render: (row) => currency(row.bid_amount) },
                { key: 'delivery_time', header: 'Delivery' },
                { key: 'warranty', header: 'Warranty' },
                { key: 'compliance_status', header: 'Compliance', render: (row) => <StatusBadge status={row.compliance_status} /> },
                { key: 'total_orders_completed', header: 'Orders' },
                { key: 'score', header: 'Score', render: (row) => `${row.score}` },
                { key: 'status_label', header: 'Status', render: (row) => <StatusBadge status={row.status_label || row.status} /> },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => {
                    const canDecide = row.status !== 'rejected' && row.status !== 'approved_for_bidding';
                    return (
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant="secondary"
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            setSelectedRow(row);
                            setNotesDraft(row.admin_notes || '');
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        {canDecide && (
                          <Button variant="primary" className="h-8 px-2 text-xs" onClick={() => handleApproveSingle(row)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                        )}
                        {canDecide && (
                          <Button variant="secondary" className="h-8 px-2 text-xs text-rose-700 ring-rose-200" onClick={() => handleReject(row)}>
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        )}
                      </div>
                    );
                  },
                },
              ]}
            />
            <Pagination
              page={currentPage}
              total={totalPages}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </>
        )}
      </Card>

      <Modal title="Supplier evaluation details" isOpen={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} size="lg">
        {selectedRow && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Supplier', selectedRow.supplier_name],
                ['Company', selectedRow.company_name],
                ['RFQ', selectedRow.rfq_applied_for],
                ['Bid amount', currency(selectedRow.bid_amount)],
                ['Delivery', selectedRow.delivery_time],
                ['Warranty', selectedRow.warranty],
                ['Compliance', selectedRow.compliance_status],
                ['Orders completed', selectedRow.total_orders_completed],
                ['Score', selectedRow.score],
                ['Submitted', selectedRow.bid_submission_date],
                ['Status', selectedRow.status_label],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Admin notes</label>
              <textarea
                className="mt-2 w-full rounded-md border border-slate-200 p-3 text-sm"
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="e.g. Good pricing but slow delivery"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleSaveNotes}>Save notes</Button>
              <Button variant="secondary" onClick={() => navigate(`/admin/suppliers/${selectedRow.supplier_id}`)}>
                Full profile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <CustomNotification
        isOpen={alert.isOpen}
        onClose={() => setAlert((a) => ({ ...a, isOpen: false }))}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </>
  );
}
