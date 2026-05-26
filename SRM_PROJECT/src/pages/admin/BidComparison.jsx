import { Award } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { useState, useEffect, useMemo } from 'react';

export function BidComparison() {
  const [rfqList, setRfqList] = useState([]);
  const [selectedRfqId, setSelectedRfqId] = useState('RFQ-24061');
  const [allBids, setAllBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    // 1. Fetch RFQs
    fetch(`${apiBaseUrl}/rfqs.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rfqs)) {
          setRfqList(data.rfqs);
          if (data.rfqs.length > 0) {
            // Default to the first active RFQ or first in list
            const activeRfq = data.rfqs.find(r => r.status === 'Active' || r.status === 'Under Evaluation');
            setSelectedRfqId(activeRfq ? activeRfq.id : data.rfqs[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch RFQs:', err));

    // 2. Fetch all bids
    fetch(`${apiBaseUrl}/bids.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bids)) {
          setAllBids(data.bids);
        }
      })
      .catch((err) => console.error('Failed to fetch Bids:', err))
      .finally(() => setLoading(false));
  }, [apiBaseUrl]);

  const selectedRfq = useMemo(() => {
    return rfqList.find(r => r.id === selectedRfqId);
  }, [rfqList, selectedRfqId]);

  const filteredBids = useMemo(() => {
    return allBids
      .filter((b) => (b.rfq_package || b.rfqPackage) === selectedRfqId)
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
  }, [allBids, selectedRfqId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Bid Comparison" 
        description="Compare quotations by price, timeline, rating, warranty, and weighted evaluation score." 
        action={
          rfqList.length > 0 && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm min-w-[280px]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">RFQ Scope:</span>
              <select 
                className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-0 cursor-pointer"
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
              >
                {rfqList.map((r) => (
                  <option key={r.id} value={r.id} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {r.id} - {r.title.substring(0, 30)}{r.title.length > 30 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />
      <Card>
        <CardHeader 
          title={`${selectedRfqId} Bid Matrix`} 
          subtitle={selectedRfq ? selectedRfq.title : "Best quotation is highlighted for award review"} 
        />
        <DataTable
          data={filteredBids}
          empty="No supplier quotations have been submitted yet for this RFQ."
          columns={[
            {
              key: 'supplier',
              header: 'Supplier',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-950 dark:text-slate-200">{row.supplier}</span>
                  {row.best ? <StatusBadge status="Approved" /> : null}
                </div>
              ),
            },
            { key: 'price', header: 'Price Comparison', render: (row) => currency(row.price) },
            { key: 'delivery', header: 'Delivery Timeline' },
            { key: 'rating', header: 'Supplier Rating', render: (row) => <span className="dark:text-slate-300">{row.rating} / 5.0</span> },
            { key: 'warranty', header: 'Warranty' },
            {
              key: 'score',
              header: 'Score',
              render: (row) => (
                <div className="flex items-center gap-2">
                  {row.best ? <Award className="h-4 w-4 text-amber-500" /> : null}
                  <span className={row.best ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-semibold text-slate-700 dark:text-slate-400'}>{row.score}</span>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
