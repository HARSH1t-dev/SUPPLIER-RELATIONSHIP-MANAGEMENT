import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Star, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useNavigate } from 'react-router-dom';

export function Reviews() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scorecards');
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] = useState('Server');

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch suppliers and feasibility scores
      const supRes = await fetch(`${apiBaseUrl}/ratings.php`);
      if (!supRes.ok) throw new Error('Failed to fetch suppliers');
      const supData = await supRes.json();

      // 2. Fetch purchase orders to find pending reviews
      const poRes = await fetch(`${apiBaseUrl}/purchase_orders.php`);
      if (!poRes.ok) throw new Error('Failed to fetch purchase orders');
      const poData = await poRes.json();

      if (supData.suppliers) {
        setSuppliers(supData.suppliers);
      }
      if (poData.purchase_orders) {
        setPurchaseOrders(poData.purchase_orders);
      }
      setDataSource('Server Database');
    } catch (err) {
      console.warn('API fetch failed. Falling back to local sandbox mock data.', err);
      setDataSource('Local Sandbox Fallback');
      
      // Seed sandbox fallbacks
      setSuppliers([
        { supplier_id: 1, name: 'Apex Industrial Components', category: 'Mechanical', region: 'North America', rating: 4.8, avg_quality: 4.8, avg_price: 4.6, avg_delivery: 4.8, feasibility_score: 96, review_count: 5 },
        { supplier_id: 2, name: 'Vector Packaging Co.', category: 'Packaging', region: 'Europe', rating: 4.4, avg_quality: 4.4, avg_price: 4.2, avg_delivery: 4.4, feasibility_score: 86, review_count: 2 },
        { supplier_id: 3, name: 'Northstar Logistics', category: 'Logistics', region: 'APAC', rating: 4.6, avg_quality: 4.6, avg_price: 4.5, avg_delivery: 4.6, feasibility_score: 91, review_count: 3 },
        { supplier_id: 4, name: 'Delta Precision Parts', category: 'Mechanical', region: 'North America', rating: 3.2, avg_quality: 3.0, avg_price: 3.5, avg_delivery: 3.0, feasibility_score: 64, review_count: 1 },
      ]);
      setPurchaseOrders([
        { id: 1, po_number: 'PO-88021', supplier_name: 'Apex Industrial Components', status: 'delivered', order_date: 'May 20, 2026', total_amount: 120000 },
        { id: 2, po_number: 'PO-88023', supplier_name: 'Vector Packaging Co.', status: 'delivered', order_date: 'May 22, 2026', total_amount: 95000 },
        { id: 3, po_number: 'PO-88027', supplier_name: 'Delta Precision Parts', status: 'delivered', order_date: 'May 24, 2026', total_amount: 150000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiBaseUrl]);

  // Derived Summary Stats
  const summaryStats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    
    // Average quality score out of 100
    const avgQuality = totalSuppliers > 0
      ? (suppliers.reduce((sum, s) => sum + s.avg_quality, 0) / totalSuppliers) * 20
      : 80;

    // Pending reviews (Delivered POs that can be evaluated/fulfilled)
    const pendingCount = purchaseOrders.filter((po) => po.status === 'delivered').length;

    // At-Risk Suppliers (feasibility_score < 75)
    const atRiskCount = suppliers.filter((s) => s.feasibility_score < 75).length;

    return [
      { label: 'Suppliers Evaluated', value: totalSuppliers.toString(), icon: Users, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20' },
      { label: 'Avg. Quality Score', value: `${avgQuality.toFixed(1)}%`, icon: Star, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20' },
      { label: 'Pending Evaluations', value: pendingCount.toString(), icon: BarChart3, color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20' },
      { label: 'At-Risk Suppliers', value: atRiskCount.toString(), icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20' },
    ];
  }, [suppliers, purchaseOrders]);

  // Map database suppliers to card view variables
  const scorecards = useMemo(() => {
    return suppliers.map((s) => {
      // Map star rating to 100-point scale
      const qualityScore = Math.round(s.avg_quality * 20);
      const deliveryScore = Math.round(s.avg_delivery * 20);
      const serviceScore = Math.round(s.avg_price * 20); // Mapping Price average to Service/Cost category

      const overall = s.feasibility_score >= 90 ? 'Excellent' : (s.feasibility_score >= 80 ? 'Strong' : (s.feasibility_score >= 70 ? 'Monitor' : 'Exception'));
      const risk = s.feasibility_score >= 85 ? 'Low' : (s.feasibility_score >= 70 ? 'Medium' : 'High');

      return {
        supplier: s.name,
        category: s.category,
        quality: qualityScore,
        delivery: deliveryScore,
        service: serviceScore,
        overall,
        risk,
      };
    });
  }, [suppliers]);

  // Filter pending reviews
  const pendingReviewsList = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === 'delivered');
  }, [purchaseOrders]);

  // At-Risk Suppliers
  const atRiskList = useMemo(() => {
    return suppliers
      .filter((s) => s.feasibility_score < 80)
      .map((s) => {
        const severity = s.feasibility_score < 70 ? 'High' : 'Medium';
        const flag = `Feasibility index is at ${s.feasibility_score}/100. Average Quality rating is ${s.avg_quality} ⭐.`;
        const action = s.feasibility_score < 70 
          ? 'Initiate corrective action plan and freeze contract awards.'
          : 'Schedule review meeting and monitor next 3 PO deliveries.';
        return {
          supplier: s.name,
          flag,
          severity,
          action,
        };
      });
  }, [suppliers]);

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Supplier Reviews & Scorecards"
        description="Monitor aggregated supplier ratings, complete outstanding reviews, and identify at-risk relationships based on real-time feedback."
      />

      {/* Database connection banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Evaluation metrics linked to: <strong>{dataSource}</strong></span>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Synchronize Data
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((s) => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold tabular-nums text-slate-950 dark:text-white">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1 w-fit">
        {[['scorecards', 'Performance Scorecards'], ['pending', 'Pending Evaluations'], ['risk', 'Risk Flags']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === key
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {activeTab === 'scorecards' && (
            <Card>
              <CardHeader title="Performance Scorecards" subtitle="Dynamic consolidated indices loaded from active buyer reviews" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
                      {['Supplier', 'Category', 'Quality (Index)', 'Delivery (Index)', 'Price Value', 'Status', 'Risk'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {scorecards.length === 0 ? (
                      <tr>
                        <td className="px-5 py-8 text-center text-slate-500" colSpan={7}>No scorecards available.</td>
                      </tr>
                    ) : (
                      scorecards.map((row, i) => (
                        <tr key={row.supplier} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.supplier}</td>
                          <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{row.category}</td>
                          <td className="px-5 py-3.5 tabular-nums text-slate-700 dark:text-slate-300 font-semibold">{row.quality} / 100</td>
                          <td className="px-5 py-3.5 tabular-nums text-slate-700 dark:text-slate-300 font-semibold">{row.delivery} / 100</td>
                          <td className="px-5 py-3.5 tabular-nums text-slate-700 dark:text-slate-300 font-semibold">{row.service} / 100</td>
                          <td className="px-5 py-3.5"><StatusBadge status={row.overall} /></td>
                          <td className="px-5 py-3.5"><StatusBadge status={row.risk} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'pending' && (
            <Card>
              <CardHeader title="Pending Evaluations" subtitle="Delivered purchase orders awaiting fulfillment review and rating submission" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {pendingReviewsList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-500">
                    All delivered orders have been fully evaluated. Great job!
                  </div>
                ) : (
                  pendingReviewsList.map((po) => (
                    <div key={po.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{po.supplier_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Order #{po.po_number} · Placed on {po.order_date ? po.order_date.split(' ')[0] : '-'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Requires evaluation rating</span>
                        <button
                          onClick={() => navigate('/admin/orders')}
                          className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 shadow-sm animate-pulse"
                        >
                          Submit Rating
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {activeTab === 'risk' && (
            <Card>
              <CardHeader title="Risk Flags" subtitle="Suppliers matching risk thresholds (Composite Feasibility Score below 80)" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {atRiskList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/30 dark:bg-emerald-950/10">
                    Excellent! No suppliers are currently flagged as at-risk.
                  </div>
                ) : (
                  atRiskList.map((flag) => (
                    <div key={flag.supplier} className="px-5 py-4 flex flex-wrap items-start gap-4 justify-between hover:bg-rose-50/10 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{flag.supplier}</p>
                          <StatusBadge status={flag.severity} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{flag.flag}</p>
                        <p className="mt-1 text-xs text-slate-400 italic">Recommendation: {flag.action}</p>
                      </div>
                      <button
                        onClick={() => navigate('/admin/supplier-rankings')}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        Inspect Feasibility
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
