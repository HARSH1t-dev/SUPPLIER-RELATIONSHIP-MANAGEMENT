import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../components/Alert.jsx';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { getStoredRfqs } from '../../utils/rfqStore.js';
import { useState, useEffect } from 'react';

export function RFQDetail() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [bidsList, setBidsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    // 1. Fetch RFQs to find the specific RFQ
    fetch(`${apiBaseUrl}/rfqs.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rfqs)) {
          const foundRfq = data.rfqs.find((item) => item.id === id);
          if (foundRfq) {
            setRfq(foundRfq);
          } else {
            const localRfq = getStoredRfqs().find((item) => item.id === id);
            setRfq(localRfq);
          }
        } else {
          const localRfq = getStoredRfqs().find((item) => item.id === id);
          setRfq(localRfq);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch RFQs:', err);
        const localRfq = getStoredRfqs().find((item) => item.id === id);
        setRfq(localRfq);
      });

    // 2. Fetch all bids from database
    fetch(`${apiBaseUrl}/bids.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bids)) {
          const filtered = data.bids
            .filter((b) => (b.rfq_package || b.rfqPackage) === id)
            .map((b) => {
              let supplier = b.supplier_name || b.supplier || 'Apex Industrial Components';
              let rating = 4.8;
              
              if (b.id === 'BID-1' || b.id === '1') {
                supplier = 'Apex Industrial Components';
                rating = 4.8;
              } else if (b.id === 'BID-2' || b.id === '2') {
                supplier = 'Vector Packaging Co.';
                rating = 4.4;
              } else if (b.id === 'BID-3' || b.id === '3') {
                supplier = 'Northstar Logistics';
                rating = 4.6;
              } else if (b.id === 'BID-4' || b.id === '4') {
                supplier = 'Helio Energy Systems';
                rating = 4.1;
              }

              return {
                ...b,
                supplier,
                rating,
              };
            });
          setBidsList(filtered);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Bids:', err);
      })
      .finally(() => setLoading(false));
  }, [id, apiBaseUrl]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="space-y-6">
        <PageHeader title="RFQ not found" description={`${id} is not available in the current RFQ list.`} />
        <Card className="p-6">
          <p className="text-sm text-slate-600">The RFQ may have been deleted or the list may have been reset.</p>
          <Link to="/admin/rfqs" className="mt-5 inline-flex">
            <Button>Back to RFQ List</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={rfq.title} description={`${rfq.id} / ${rfq.category} / Deadline ${rfq.deadline}`} />
      <Alert>Evaluation is in progress. Commercial score, delivery lead time, and supplier rating are weighted for the award recommendation.</Alert>
      <Card>
        <CardHeader title="RFQ Overview" />
        <div className="grid gap-4 p-5 sm:grid-cols-4">
          <Metric label="Status" value={<StatusBadge status={rfq.status} />} />
          <Metric label="Target Value" value={currency(rfq.value)} />
          <Metric label="Received Bids" value={rfq.bids} />
          <Metric label="Category" value={rfq.category} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Supplier Quotations" subtitle="Shortlisted bid submissions" />
        <DataTable
          data={bidsList}
          empty="No supplier quotations have been submitted yet."
          columns={[
            { key: 'supplier', header: 'Supplier' },
            { key: 'price', header: 'Price', render: (row) => currency(row.price) },
            { key: 'delivery', header: 'Delivery' },
            { key: 'rating', header: 'Rating' },
            { key: 'score', header: 'Score' },
          ]}
        />
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-bold text-slate-950">{value}</div>
    </div>
  );
}
