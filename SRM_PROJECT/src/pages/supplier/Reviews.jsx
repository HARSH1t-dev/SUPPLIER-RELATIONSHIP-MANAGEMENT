import { Star, MessageSquare, ThumbsUp, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useState, useEffect, useMemo } from 'react';

function StarRating({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= count
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-slate-200 dark:text-slate-800 border dark:border-slate-800'
          }`}
        />
      ))}
    </div>
  );
}

export function SupplierReviews() {
  const [supplierDetail, setSupplierDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] = useState('Server');

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');
  const storedUser = sessionStorage.getItem('srm_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : { id: 2, full_name: 'Supplier User', company_name: 'Apex Industrial Components' };

  const fetchReviews = () => {
    setLoading(true);
    setError('');

    fetch(`${apiBaseUrl}/ratings.php?user_id=${currentUser.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.supplier) {
          setSupplierDetail(data.supplier);
          setReviews(data.reviews || []);
          setDataSource('Server Database');
        } else {
          throw new Error('Invalid response structure');
        }
      })
      .catch((err) => {
        console.warn('Failed to load ratings from DB. Loading local sandbox fallback.', err);
        setDataSource('Local Sandbox Fallback (Database Offline)');
        
        // Simulating data locally matching the supplier user
        const company = currentUser.company_name || 'Apex Industrial Components';
        const rating = company.includes('Vector') ? 4.4 : (company.includes('Northstar') ? 4.6 : 4.8);
        const q = rating;
        const p = Math.max(1, rating - 0.2);
        const d = Math.min(5, rating + 0.1);
        const count = 3;

        setSupplierDetail({
          company_name: company,
          category: company.includes('Vector') ? 'Packaging' : (company.includes('Northstar') ? 'Logistics' : 'Mechanical'),
          rating: rating,
          review_count: count,
          avg_quality: q,
          avg_price: p,
          avg_delivery: d,
        });

        setReviews([
          {
            review_id: 1,
            reviewer_name: 'Admin Buyer',
            rating: Math.round((q + p + d) / 3),
            review: `Consistently meets quality standards. Proactive communication.`,
            reviewed_at: '2026-05-24 14:32:00',
            rating_quality: Math.round(q),
            rating_price: Math.round(p),
            rating_delivery: Math.round(d),
          },
          {
            review_id: 2,
            reviewer_name: 'Operations Manager',
            rating: Math.round((q + p + d) / 3) - 1 || 4,
            review: `Reliable supply line. Lead times were within boundaries but invoicing had minor lag.`,
            reviewed_at: '2026-05-18 10:15:00',
            rating_quality: Math.round(q) - 1 || 4,
            rating_price: Math.round(p),
            rating_delivery: Math.round(d) - 1 || 4,
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [apiBaseUrl, currentUser.id]);

  // Calculations
  const positivePercentage = useMemo(() => {
    if (reviews.length === 0) return 100;
    const positiveCount = reviews.filter((r) => r.rating >= 4).length;
    return Math.round((positiveCount / reviews.length) * 100);
  }, [reviews]);

  const ratingStatus = (rating) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Strong';
    if (rating >= 3.0) return 'Monitor';
    return 'Review';
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Reviews & Ratings"
        description="View your performance scorecards, evaluations, and ratings compiled from procurement contract fulfillments."
      />

      {/* Connection Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Source: <strong>{dataSource}</strong></span>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Reviews
        </button>
      </div>

      {/* Summary strip */}
      {supplierDetail && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Star className="h-5 w-5 fill-amber-400" />
            </span>
            <div>
              <p className="text-xs text-slate-500 font-medium">Avg. Buyer Rating</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white">
                {supplierDetail.rating.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 5</span>
              </p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Reviews Received</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white">{supplierDetail.review_count}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <ThumbsUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500 font-medium">Positive Feedback Rate</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white">{positivePercentage}%</p>
            </div>
          </Card>
        </div>
      )}

      {supplierDetail && (
        <div className="space-y-6">
          {/* Buyer feedback cards */}
          <Card>
            <CardHeader title="Buyer Feedback Logs" subtitle="Detailed performance comments submitted by corporate buyers" />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reviews.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500">
                  No evaluations registered yet by your corporate buyers.
                </div>
              ) : (
                reviews.map((fb) => (
                  <div key={fb.review_id} className="px-5 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{fb.reviewer_name || 'Admin Buyer'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{fb.reviewed_at}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StarRating count={fb.rating} />
                        <StatusBadge status={ratingStatus(fb.rating)} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-slate-200 dark:border-slate-800 pl-3 italic">
                      "{fb.review}"
                    </p>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-500 pt-1 pl-3">
                      <span>Quality: <span className="text-amber-600 dark:text-amber-400">{fb.rating_quality}/5 ⭐</span></span>
                      <span>Price: <span className="text-amber-600 dark:text-amber-400">{fb.rating_price}/5 ⭐</span></span>
                      <span>Delivery: <span className="text-amber-600 dark:text-amber-400">{fb.rating_delivery}/5 ⭐</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Aggregated Scorecards */}
          <Card>
            <CardHeader title="My Performance Scorecard" subtitle="Consolidated averages for evaluation criteria in the current cycle" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/50">
                    {['Program', 'Quality Aspect', 'Delivery Speed', 'Price Value', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{supplierDetail.company_name}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300 tabular-nums">{supplierDetail.avg_quality} / 5.0</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300 tabular-nums">{supplierDetail.avg_delivery} / 5.0</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300 tabular-nums">{supplierDetail.avg_price} / 5.0</td>
                    <td className="px-5 py-4"><StatusBadge status={ratingStatus(supplierDetail.rating)} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
