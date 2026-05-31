import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { getApiBaseUrl } from '../../utils/apiBase.js';

const DEMO_SUPPLIERS = {
  3: {
    profile: { id: 3, full_name: 'Rajesh Kumar', email: 'supplier.a@srm.local', company_name: 'TechNova Systems', registered_company: 'TechNova Systems', rating: 4.6, phone: '+91 98765 43210', account_status: 'active' },
    compliance_status: 'Compliant',
    compliance_documents: [{ id: 'CERT-TN-001', type: 'ISO 9001', issuer: 'Global Certification Corp', expiry: '2027-06-01', status: 'Active' }],
    past_bids: [{ id: 'BID-LAP-A', rfq_id: 'RFQ-24064', rfq_title: 'Laptop Procurement', grand_total: 50000, delivery: '12 Days', warranty: '24 Months', submitted_at: '2026-05-26' }],
    orders_completed: 12,
    average_rating: 4.6,
    review_count: 8,
    evaluation_history: [],
  },
  6: {
    profile: { id: 6, full_name: 'Sneha Reddy', email: 'supplier.d@srm.local', company_name: 'PrimeByte Hardware', registered_company: 'PrimeByte Hardware', rating: 4.9, phone: '+91 98765 43213', account_status: 'active' },
    compliance_status: 'Compliant',
    compliance_documents: [{ id: 'CERT-PB-001', type: 'ISO 27001', issuer: 'Cyber Trust Authority', expiry: '2028-01-10', status: 'Active' }],
    past_bids: [{ id: 'BID-LAP-D', rfq_id: 'RFQ-24064', rfq_title: 'Laptop Procurement', grand_total: 46000, delivery: '8 Days', warranty: '36 Months', submitted_at: '2026-05-28' }],
    orders_completed: 28,
    average_rating: 4.9,
    review_count: 22,
    evaluation_history: [{ rfq_id: 'RFQ-24064', status_label: 'Shortlisted', evaluation_score: 91.2, admin_notes: 'Best overall score' }],
  },
};

export function SupplierDetail() {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (!supplierId) return;
    setLoading(true);
    fetch(`${apiBaseUrl}/supplier-evaluations.php?supplier_id=${supplierId}&detail=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDetail(data.supplier);
        } else {
          setDetail(DEMO_SUPPLIERS[Number(supplierId)] || null);
        }
      })
      .catch((err) => {
        console.error('Failed to load supplier detail:', err);
        setDetail(DEMO_SUPPLIERS[Number(supplierId)] || null);
      })
      .finally(() => setLoading(false));
  }, [apiBaseUrl, supplierId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading supplier profile…</p>;
  }

  if (!detail?.profile) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate('/admin/suppliers')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-rose-600">Supplier not found.</p>
      </div>
    );
  }

  const profile = detail.profile;

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.registered_company || profile.company_name || profile.full_name}
        description="Supplier profile, bid history, compliance, and evaluation records."
        action={
          <Button variant="secondary" onClick={() => navigate('/admin/suppliers')}>
            <ArrowLeft className="h-4 w-4" />
            Back to evaluations
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Average rating</p>
          <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-slate-950">
            <Star className="h-5 w-5 text-amber-500" />
            {detail.average_rating}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Orders completed</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{detail.orders_completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Compliance</p>
          <p className="mt-2">
            <StatusBadge status={detail.compliance_status} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Past bids</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{detail.past_bids?.length ?? 0}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Company information" subtitle="Registered supplier profile" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {[
            ['Contact', profile.full_name],
            ['Email', profile.email],
            ['Phone', profile.phone || '—'],
            ['GST', profile.gst_number || '—'],
            ['Location', [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || '—'],
            ['Website', profile.website || '—'],
            ['Account status', profile.account_status],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Past bids & RFQs" subtitle="Historical quotation submissions" />
        <DataTable
          data={detail.past_bids || []}
          columns={[
            { key: 'rfq_id', header: 'RFQ ID' },
            { key: 'rfq_title', header: 'RFQ' },
            { key: 'grand_total', header: 'Quote', render: (row) => currency(Number(row.grand_total)) },
            { key: 'delivery', header: 'Delivery' },
            { key: 'warranty', header: 'Warranty' },
            { key: 'submitted_at', header: 'Submitted' },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Compliance documents" subtitle="Certifications and regulatory records" />
        <DataTable
          data={detail.compliance_documents || []}
          columns={[
            { key: 'type', header: 'Type' },
            { key: 'issuer', header: 'Issuer' },
            { key: 'expiry', header: 'Expiry' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Evaluation history" subtitle="Shortlist, approval, and rejection decisions per RFQ" />
        <DataTable
          data={detail.evaluation_history || []}
          columns={[
            { key: 'rfq_id', header: 'RFQ' },
            { key: 'bid_id', header: 'Bid' },
            { key: 'evaluation_score', header: 'Score', render: (row) => `${row.evaluation_score ?? '—'}` },
            { key: 'status_label', header: 'Status', render: (row) => <StatusBadge status={row.status_label || row.status} /> },
            { key: 'admin_notes', header: 'Admin notes', render: (row) => row.admin_notes || '—' },
            { key: 'updated_at', header: 'Updated' },
          ]}
        />
      </Card>

      <p className="text-sm text-slate-500">
        Compare live quotations from{' '}
        <Link to="/admin/suppliers" className="font-semibold text-blue-600 hover:underline">
          Supplier Management
        </Link>
        .
      </p>
    </div>
  );
}
