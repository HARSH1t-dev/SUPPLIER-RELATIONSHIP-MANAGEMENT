import { useState, useEffect, useMemo } from 'react';
import {
  Award,
  TrendingUp,
  Star,
  ArrowLeft,
  User,
  MessageSquare,
  Calendar,
  DollarSign,
  Clock,
  Filter,
  Search,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Button } from '../../components/Button.jsx';
import { inputClass } from '../../components/FormField.jsx';
import { suppliers as initialMockSuppliers } from '../../data/mockData.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Sub-component for displaying stars
function StarRating({ rating, onChange = null, size = "h-4 w-4" }) {
  const isInteractive = typeof onChange === 'function';
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;
        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => isInteractive && onChange(star)}
            className={`${isInteractive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          >
            <Star
              className={`${size} ${
                isFilled
                  ? 'fill-amber-500 stroke-amber-500'
                  : 'fill-transparent stroke-slate-300 dark:stroke-slate-700'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function SupplierRankings() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [calculationSource, setCalculationSource] = useState('Server');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterMinRating, setFilterMinRating] = useState('All');

  // Review Form State
  const [formReviewText, setFormReviewText] = useState('');
  const [formRatingQuality, setFormRatingQuality] = useState(5);
  const [formRatingPrice, setFormRatingPrice] = useState(5);
  const [formRatingDelivery, setFormRatingDelivery] = useState(5);
  const [formPoId, setFormPoId] = useState('');

  // Fallback Local Database State
  const [localSuppliers, setLocalSuppliers] = useState([]);
  const [localReviews, setLocalReviews] = useState({}); // supplier_id => [reviews]

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');
  const storedUser = sessionStorage.getItem('srm_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : { id: 1, full_name: 'Admin User' };

  // Categories list based on mockData
  const categories = [
    'All',
    'Mechanical',
    'Packaging',
    'Logistics',
    'Facilities & Maintenance',
    'Electrical',
    'IT & Professional Services',
    'Chemical & Raw Materials',
  ];

  // Regions list
  const regions = ['All', 'North America', 'Europe', 'APAC', 'Middle East'];

  // Initialize client fallback data
  useEffect(() => {
    const calculatedMock = initialMockSuppliers.map((s, index) => {
      // Assign mock ratings for Quality, Price, and Delivery speed if they are not in the file
      const q = s.rating || 4.5;
      const p = s.rating ? Math.max(1, s.rating - 0.2) : 4.3;
      const d = s.rating ? Math.min(5, s.rating + 0.1) : 4.6;
      const feasibility_score = Math.round(((q / 5) * 0.4 + (p / 5) * 0.4 + (d / 5) * 0.2) * 100);

      return {
        supplier_id: index + 1,
        name: s.name,
        category: s.category,
        region: s.region,
        rating: s.rating,
        review_count: 2,
        avg_quality: q,
        avg_price: p,
        avg_delivery: d,
        feasibility_score,
      };
    });

    setLocalSuppliers(calculatedMock);

    // Seed mock reviews for each supplier ID
    const initialReviews = {};
    calculatedMock.forEach((sup) => {
      initialReviews[sup.supplier_id] = [
        {
          review_id: sup.supplier_id * 10,
          reviewer_name: 'Admin User',
          rating: Math.round((sup.avg_quality + sup.avg_price + sup.avg_delivery) / 3),
          review: `Excellent partner. Highly recommended for ${sup.category} requirements in ${sup.region}.`,
          reviewed_at: '2026-05-24 14:32:00',
          rating_quality: Math.round(sup.avg_quality),
          rating_price: Math.round(sup.avg_price),
          rating_delivery: Math.round(sup.avg_delivery),
        },
        {
          review_id: sup.supplier_id * 10 + 1,
          reviewer_name: 'Sourcing Officer',
          rating: Math.round((sup.avg_quality + sup.avg_price + sup.avg_delivery) / 3) - 1 || 3,
          review: `Satisfactory quality and standard pricing. Timely responses.`,
          reviewed_at: '2026-05-18 10:15:00',
          rating_quality: Math.round(sup.avg_quality) - 1 || 3,
          rating_price: Math.round(sup.avg_price),
          rating_delivery: Math.round(sup.avg_delivery) - 1 || 3,
        },
      ];
    });
    setLocalReviews(initialReviews);
  }, []);

  // Fetch all suppliers
  const fetchAllSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/ratings.php`);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const data = await response.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
        setCalculationSource('Server Database');
      } else {
        throw new Error('Invalid database format returned.');
      }
    } catch (err) {
      console.warn('Could not load ratings from database API. Running in local sandbox fallback mode.', err);
      // Fallback to local state mock
      setSuppliers(localSuppliers);
      setCalculationSource('Local Sandbox Fallback (Database Offline)');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on mounting or when fallback data changes
  useEffect(() => {
    if (calculationSource.includes('Local Sandbox') && localSuppliers.length > 0) {
      setSuppliers(localSuppliers);
    } else {
      fetchAllSuppliers();
    }
  }, [calculationSource, localSuppliers]);

  // Fetch single supplier details
  const fetchSupplierDetail = async (id) => {
    setDetailLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${apiBaseUrl}/ratings.php?supplier_id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSelectedSupplierDetail(data.supplier);
        setReviews(data.reviews);
        setPurchaseOrders(data.purchase_orders);
      } else {
        throw new Error(data.message || 'Failed to fetch details');
      }
    } catch (err) {
      console.warn('Could not load detailed supplier data from API. Loading from local sandbox.', err);
      // Fallback to local detail
      const localSup = localSuppliers.find((s) => s.supplier_id === id);
      if (localSup) {
        setSelectedSupplierDetail({
          ...localSup,
          gst_number: '29ABCDE1234F1Z5',
          address: '102 Industrial Area, Sector 4',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: localSup.region,
          website: 'www.supplierportal.com',
          contact_person: 'Corporate Account Manager',
          contact_email: 'sourcing@supplier.com',
        });
        setReviews(localReviews[id] || []);
        // Seed some mock purchase orders
        setPurchaseOrders([
          { po_id: 1, po_number: 'PO-88021', status: 'delivered', issued_date: '2026-05-20' },
          { po_id: 2, po_number: 'PO-88025', status: 'issued', issued_date: '2026-05-28' },
        ]);
      } else {
        setError('Supplier details could not be found.');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSupplierId !== null) {
      fetchSupplierDetail(selectedSupplierId);
    }
  }, [selectedSupplierId]);

  // Submit a Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccessMsg('');

    const payload = {
      supplier_id: selectedSupplierId,
      po_id: formPoId ? parseInt(formPoId) : null,
      review: formReviewText,
      reviewed_by: currentUser.id,
      rating_quality: formRatingQuality,
      rating_price: formRatingPrice,
      rating_delivery: formRatingDelivery,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/ratings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Thank you! Your rating and feedback was successfully saved in the database.');
        setFormReviewText('');
        setFormPoId('');
        // Re-fetch detail to update averages and reviews list
        await fetchSupplierDetail(selectedSupplierId);
        // Re-fetch all suppliers to update dashboard rankings
        if (!calculationSource.includes('Local Sandbox')) {
          fetchAllSuppliers();
        }
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      console.warn('Backend API review submission failed. Simulating in local sandbox state.', err);
      
      // Simulate submission in local sandbox state
      const newReview = {
        review_id: Date.now(),
        reviewer_name: currentUser.full_name || 'Admin User',
        rating: Math.round((formRatingQuality + formRatingPrice + formRatingDelivery) / 3),
        review: formReviewText,
        reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        rating_quality: formRatingQuality,
        rating_price: formRatingPrice,
        rating_delivery: formRatingDelivery,
      };

      // 1. Add to local reviews list
      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);
      
      const newLocalReviews = {
        ...localReviews,
        [selectedSupplierId]: [newReview, ...(localReviews[selectedSupplierId] || [])]
      };
      setLocalReviews(newLocalReviews);

      // 2. Recompute average ratings & feasibility score
      const qAvg = updatedReviews.reduce((sum, r) => sum + r.rating_quality, 0) / updatedReviews.length;
      const pAvg = updatedReviews.reduce((sum, r) => sum + r.rating_price, 0) / updatedReviews.length;
      const dAvg = updatedReviews.reduce((sum, r) => sum + r.rating_delivery, 0) / updatedReviews.length;
      const overall = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;

      const fScore = Math.round(((qAvg / 5) * 0.4 + (pAvg / 5) * 0.4 + (dAvg / 5) * 0.2) * 100);

      const updatedLocalSuppliers = localSuppliers.map((s) => {
        if (s.supplier_id === selectedSupplierId) {
          return {
            ...s,
            review_count: updatedReviews.length,
            rating: parseFloat(overall.toFixed(1)),
            avg_quality: parseFloat(qAvg.toFixed(1)),
            avg_price: parseFloat(pAvg.toFixed(1)),
            avg_delivery: parseFloat(dAvg.toFixed(1)),
            feasibility_score: fScore,
          };
        }
        return s;
      });

      // Update local states
      setLocalSuppliers(updatedLocalSuppliers);
      
      // Re-sort local suppliers by feasibility
      const sorted = [...updatedLocalSuppliers].sort((a, b) => b.feasibility_score - a.feasibility_score);
      setSuppliers(sorted);

      // Update current displayed detail state
      setSelectedSupplierDetail((prev) => ({
        ...prev,
        review_count: updatedReviews.length,
        rating: parseFloat(overall.toFixed(1)),
        avg_quality: parseFloat(qAvg.toFixed(1)),
        avg_price: parseFloat(pAvg.toFixed(1)),
        avg_delivery: parseFloat(dAvg.toFixed(1)),
        feasibility_score: fScore,
      }));

      setSuccessMsg('Review saved successfully in local sandbox state!');
      setFormReviewText('');
      setFormPoId('');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter and search calculations
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || s.category === filterCategory;
      const matchesRegion = filterRegion === 'All' || s.region === filterRegion;
      const matchesMinRating =
        filterMinRating === 'All' || s.rating >= parseFloat(filterMinRating);

      return matchesSearch && matchesCategory && matchesRegion && matchesMinRating;
    });
  }, [suppliers, searchQuery, filterCategory, filterRegion, filterMinRating]);

  // Export ranked suppliers to CSV
  const exportCSV = () => {
    const headers = ['Rank', 'Supplier Name', 'Category', 'Region', 'Quality Rating (1-5)', 'Price Rating (1-5)', 'Delivery Rating (1-5)', 'Feasibility Score (1-100)'];
    const rows = filteredSuppliers.map((s, index) => [
      index + 1,
      s.name,
      s.category,
      s.region,
      s.avg_quality,
      s.avg_price,
      s.avg_delivery,
      s.feasibility_score,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'supplier_performance_rankings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export ranked suppliers to JSON
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredSuppliers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supplier_performance_rankings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Color schemes for chart
  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#cbd5e1'];

  // Overall Insights
  const topSupplier = useMemo(() => {
    if (filteredSuppliers.length === 0) return null;
    return filteredSuppliers[0];
  }, [filteredSuppliers]);

  const bestQualitySupplier = useMemo(() => {
    if (filteredSuppliers.length === 0) return null;
    return [...filteredSuppliers].sort((a, b) => b.avg_quality - a.avg_quality)[0];
  }, [filteredSuppliers]);

  const bestPriceSupplier = useMemo(() => {
    if (filteredSuppliers.length === 0) return null;
    return [...filteredSuppliers].sort((a, b) => b.avg_price - a.avg_price)[0];
  }, [filteredSuppliers]);

  return (
    <div className="page-enter space-y-6">
      {selectedSupplierId === null ? (
        // ==========================================
        // VIEW 1: SUPPLIERS DIRECTORY & RANKINGS
        // ==========================================
        <>
          <PageHeader
            title="Supplier Evaluations & Rankings"
            description="Fetch suppliers from the database and review calculations based on customer feedback. Scores are evaluated using static weights: Price (40%), Quality (40%), and Delivery Speed (20%)."
          />

          {/* Database Source Alert Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Data Connection Source: <strong>{calculationSource}</strong></span>
            </div>
            <button
              onClick={fetchAllSuppliers}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh from Database
            </button>
          </div>

          {/* Insights Summary Cards */}
          {topSupplier && (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Top Ranked */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg flex items-center gap-4 shadow-soft">
                <div className="h-12 w-12 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Optimal Feasibility Rank #1</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {topSupplier.name}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Feasibility: {topSupplier.feasibility_score} / 100
                  </p>
                </div>
              </div>

              {/* Best Quality */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg flex items-center gap-4 shadow-soft">
                <div className="h-12 w-12 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="h-6 w-6 fill-rose-500 stroke-rose-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Best Quality Rated</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {bestQualitySupplier ? bestQualitySupplier.name : 'N/A'}
                  </p>
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                    Quality Rating: {bestQualitySupplier ? bestQualitySupplier.avg_quality : '0.0'} ⭐
                  </p>
                </div>
              </div>

              {/* Best Price (Value) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg flex items-center gap-4 shadow-soft">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Most Cost-Effective</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {bestPriceSupplier ? bestPriceSupplier.name : 'N/A'}
                  </p>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    Price/Cost Rating: {bestPriceSupplier ? bestPriceSupplier.avg_price : '0.0'} ⭐
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filters Card */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Filter className="h-5 w-5 text-brand-600 dark:text-brand-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Directory Filters</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {/* Search input */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Search Supplier</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Region</label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className={inputClass}
                >
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Overall Rating Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Minimum Overall Rating</label>
                <select
                  value={filterMinRating}
                  onChange={(e) => setFilterMinRating(e.target.value)}
                  className={inputClass}
                >
                  <option value="All">All Ratings</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3.0">3.0+ Stars</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Results Grid: Rankings Table & Charts */}
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Rankings Table (Col-span-2) */}
            <Card className="xl:col-span-2">
              <CardHeader
                title="Feasibility Rankings"
                subtitle="Weighted ranking of qualified suppliers: Price (40%), Quality (40%), and Delivery (20%)"
                action={
                  <div className="flex gap-2">
                    <button
                      onClick={exportCSV}
                      disabled={filteredSuppliers.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                      Export CSV
                    </button>
                    <button
                      onClick={exportJSON}
                      disabled={filteredSuppliers.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <FileJson className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
                      Export JSON
                    </button>
                  </div>
                }
              />

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rank</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Supplier</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quality</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Price</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Delivery</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Overall</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Score</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="px-5 py-8 text-center text-slate-500" colSpan={9}>
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-600" />
                          Fetching active suppliers...
                        </td>
                      </tr>
                    ) : filteredSuppliers.length === 0 ? (
                      <tr>
                        <td className="px-5 py-8 text-center text-slate-500" colSpan={9}>
                          No suppliers found matching your query filters.
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((row, index) => {
                        const isTopRank = index === 0;
                        return (
                          <tr
                            key={row.supplier_id}
                            className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                              isTopRank ? 'bg-emerald-50/30 dark:bg-emerald-950/10 font-medium' : ''
                            }`}
                          >
                            <td className="px-5 py-4 whitespace-nowrap">
                              {isTopRank ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <Award className="h-4 w-4" />
                                  #1
                                </span>
                              ) : (
                                <span className="text-slate-500">#{index + 1}</span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{row.region}</div>
                            </td>
                            <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{row.category}</td>
                            <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">{row.avg_quality} ⭐</td>
                            <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">{row.avg_price} ⭐</td>
                            <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">{row.avg_delivery} ⭐</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/40 font-semibold text-xs">
                                <Star className="h-3 w-3 fill-amber-500 stroke-amber-500" />
                                {row.rating ? row.rating.toFixed(1) : 'N/A'}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  isTopRank
                                    ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                                    : 'bg-brand-600 text-white dark:bg-brand-500'
                                }`}
                              >
                                {row.feasibility_score} / 100
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedSupplierId(row.supplier_id)}
                                className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                View & Rate
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Comparative Charts (Col-span-1) */}
            <Card className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-brand-600 dark:text-brand-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Performance Comparison</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Comparative bar chart representing the feasibility index for top suppliers filtered above.
                </p>

                <div className="h-80 w-full min-w-0">
                  {filteredSuppliers.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No chart data.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredSuppliers.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          angle={-20}
                          textAnchor="end"
                          height={40}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px',
                          }}
                        />
                        <Bar dataKey="feasibility_score" radius={[4, 4, 0, 0]}>
                          {filteredSuppliers.slice(0, 8).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? '#10b981' : COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        // ==========================================
        // VIEW 2: DETAILED RATINGS & REVIEWS PAGE
        // ==========================================
        <>
          {/* Header & Back Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => {
                setSelectedSupplierId(null);
                setSelectedSupplierDetail(null);
              }}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Rankings Dashboard
            </button>
            <div className="flex gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Mode: {calculationSource}
              </span>
            </div>
          </div>

          {detailLoading || !selectedSupplierDetail ? (
            <Card className="p-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
              <p className="text-sm text-slate-500">Retrieving supplier profile and ratings from database...</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Supplier Header Banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-soft flex flex-wrap justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedSupplierDetail.company_name}
                    </h2>
                    <span className="bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 text-xs font-bold px-2.5 py-1 rounded-full border border-brand-100 dark:border-brand-900/30">
                      {selectedSupplierDetail.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>Region: <strong>{selectedSupplierDetail.region}</strong></span>
                    <span>GSTIN: <strong>{selectedSupplierDetail.gst_number || 'N/A'}</strong></span>
                    <span>Website: <a href={`https://${selectedSupplierDetail.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{selectedSupplierDetail.website || 'N/A'}</a></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Composite Score</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedSupplierDetail.feasibility_score} / 100
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Overall Rating</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarRating rating={selectedSupplierDetail.rating} size="h-4 w-4" />
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {selectedSupplierDetail.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid gap-6 lg:grid-cols-8">
                {/* Left Column: Metrics Summary & Form (Col-span-3) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Rating Breakdown Card */}
                  <Card className="p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                      Review Metrics Breakdown
                    </h3>
                    <div className="space-y-3.5">
                      {/* Quality Rating */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <Star className="h-4 w-4 fill-brand-500 stroke-brand-500" />
                          <span>Quality Aspect (40%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={selectedSupplierDetail.avg_quality} size="h-3.5 w-3.5" />
                          <span className="font-bold text-slate-900 dark:text-white">{selectedSupplierDetail.avg_quality}</span>
                        </div>
                      </div>

                      {/* Price Rating */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span>Price/Cost Value (40%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={selectedSupplierDetail.avg_price} size="h-3.5 w-3.5" />
                          <span className="font-bold text-slate-900 dark:text-white">{selectedSupplierDetail.avg_price}</span>
                        </div>
                      </div>

                      {/* Delivery Rating */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>Delivery Speed (20%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={selectedSupplierDetail.avg_delivery} size="h-3.5 w-3.5" />
                          <span className="font-bold text-slate-900 dark:text-white">{selectedSupplierDetail.avg_delivery}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Submit Review Card */}
                  <Card className="p-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                      Submit Performance Evaluation
                    </h3>

                    {successMsg && (
                      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    {error && (
                      <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Optional PO Selector */}
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Link to Purchase Order (Optional)
                        </label>
                        <select
                          value={formPoId}
                          onChange={(e) => setFormPoId(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">No purchase order link</option>
                          {purchaseOrders.map((po) => (
                            <option key={po.po_id} value={po.po_id}>
                              {po.po_number} ({po.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Interactive Quality Star Input */}
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Quality of Deliverables (40%)
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={formRatingQuality} onChange={setFormRatingQuality} size="h-5 w-5" />
                          <span className="text-xs font-bold text-slate-600">{formRatingQuality} Stars</span>
                        </div>
                      </div>

                      {/* Interactive Price Star Input */}
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Cost-Effectiveness & Value (40%)
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={formRatingPrice} onChange={setFormRatingPrice} size="h-5 w-5" />
                          <span className="text-xs font-bold text-slate-600">{formRatingPrice} Stars</span>
                        </div>
                      </div>

                      {/* Interactive Delivery Star Input */}
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          On-Time Delivery Speed (20%)
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={formRatingDelivery} onChange={setFormRatingDelivery} size="h-5 w-5" />
                          <span className="text-xs font-bold text-slate-600">{formRatingDelivery} Stars</span>
                        </div>
                      </div>

                      {/* Feedback Comment */}
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Review Comments
                        </label>
                        <textarea
                          placeholder="Provide descriptive feedback regarding this supplier's performance..."
                          rows="3"
                          required
                          value={formReviewText}
                          onChange={(e) => setFormReviewText(e.target.value)}
                          className={`${inputClass} resize-none`}
                        ></textarea>
                      </div>

                      <Button type="submit" disabled={submitLoading} className="w-full justify-center">
                        {submitLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </Button>
                    </form>
                  </Card>
                </div>

                {/* Right Column: Historical Reviews Log (Col-span-5) */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 px-1">
                    <MessageSquare className="h-4 w-4 text-brand-600" />
                    Review Logs ({selectedSupplierDetail.review_count})
                  </h3>

                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <Card className="p-8 text-center text-slate-500">
                        No performance review logs recorded for this supplier. Be the first to rate them!
                      </Card>
                    ) : (
                      reviews.map((rev) => (
                        <Card key={rev.review_id} className="p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            {/* Reviewer Details */}
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                <User className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{rev.reviewer_name || 'Anonymous User'}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                  <Calendar className="h-3 w-3" />
                                  <span>{rev.reviewed_at}</span>
                                </div>
                              </div>
                            </div>

                            {/* Overall rating badge */}
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-500 mr-1">Overall:</span>
                                <StarRating rating={rev.rating} size="h-3.5 w-3.5" />
                              </div>
                              {rev.po_id && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded mt-1 font-semibold border border-slate-200/50">
                                  Linked PO #{rev.po_id}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Review comment */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-100/60 dark:border-slate-800/40">
                            {rev.review}
                          </p>

                          {/* Aspect breakdown */}
                          <div className="flex gap-4 text-[10px] font-bold text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                            <span className="flex items-center gap-1">Quality: <span className="text-amber-600 dark:text-amber-400">{rev.rating_quality}/5 ⭐</span></span>
                            <span className="flex items-center gap-1">Price: <span className="text-amber-600 dark:text-amber-400">{rev.rating_price}/5 ⭐</span></span>
                            <span className="flex items-center gap-1">Delivery: <span className="text-amber-600 dark:text-amber-400">{rev.rating_delivery}/5 ⭐</span></span>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
