import { useState, useEffect } from 'react';
import { PackagePlus } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

// ── helpers ───────────────────────────────────────────────────────────────────
const getCurrentSupplierName = () => {
  try {
    const raw = sessionStorage.getItem("srm_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.role === 'supplier') {
        return user.companyName || user.fullName || "Apex Industrial Components";
      }
    }
  } catch (_) {}
  return "Apex Industrial Components";
};

const getInitialCatalog = (supplierName) => {
  const defaults = {
    "Apex Industrial Components": [
      { id: "PRD-4401", offering: "Hydraulic Valve Assembly", category: "Mechanical", capacity: 420, listPrice: 28500, status: "Active", deleted: false, deletedAt: null },
      { id: "PRD-4405", offering: "Precision Steel Shaft", category: "Mechanical", capacity: 1500, listPrice: 12000, status: "Active", deleted: false, deletedAt: null },
    ],
    "Vector Packaging Co.": [
      { id: "PRD-4402", offering: "Sterile Packaging Film", category: "Packaging", capacity: 12800, listPrice: 800, status: "Active", deleted: false, deletedAt: null },
      { id: "PRD-4406", offering: "Corrugated Shipping Cartons", category: "Packaging", capacity: 50000, listPrice: 150, status: "Active", deleted: false, deletedAt: null },
    ],
    "Northstar Logistics": [
      { id: "PRD-4404", offering: "Freight Consolidation Lane", category: "Logistics", capacity: 72, listPrice: 165000, status: "Active", deleted: false, deletedAt: null },
      { id: "PRD-4407", offering: "Cold-Chain Reefer Routing", category: "Logistics", capacity: 24, listPrice: 320000, status: "Active", deleted: false, deletedAt: null },
    ],
    "BlueRiver Electronics": [
      { id: "PRD-4403", offering: "Lithium Backup Module", category: "Electrical", capacity: 240, listPrice: 94000, status: "Review", deleted: false, deletedAt: null },
      { id: "PRD-4408", offering: "Solid State Relay Board", category: "Electrical", capacity: 1200, listPrice: 4200, status: "Active", deleted: false, deletedAt: null },
    ]
  };
  return defaults[supplierName] || defaults["Apex Industrial Components"];
};

const loadProducts = () => {
  const supplierName = getCurrentSupplierName();
  const key = `srm_products_${supplierName}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return getInitialCatalog(supplierName);
};

const saveProducts = (products) => {
  const supplierName = getCurrentSupplierName();
  const key = `srm_products_${supplierName}`;
  localStorage.setItem(key, JSON.stringify(products));
};

const nextId = (products) => {
  const nums = products.map((p) => parseInt(p.id.replace("PRD-", ""), 10));
  return `PRD-${Math.max(...nums, 4404) + 1}`;
};

const CATEGORIES = ["Mechanical", "Packaging", "Electrical", "Logistics", "Chemical", "IT", "Other"];
const STATUSES = ["Active", "Review", "Inactive"];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const statusStyle = {
  Active:   "bg-green-50 text-green-700 border border-green-200",
  Review:   "bg-amber-50 text-amber-700 border border-amber-200",
  Inactive: "bg-gray-100 text-gray-500 border border-gray-200",
};

// ── input class helper ────────────────────────────────────────────────────────
function inputCls(err) {
  const base = "w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors bg-white";
  const ok   = "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
  const bad  = "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100";
  return base + " " + (err ? bad : ok);
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Add Offering Modal ────────────────────────────────────────────────────────
function AddOfferingModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    offering: "", category: CATEGORIES[0], capacity: "", listPrice: "", status: "Active",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.offering.trim()) e.offering = "Offering name is required";
    if (!form.capacity || form.capacity <= 0) e.capacity = "Capacity must be > 0";
    if (!form.listPrice || form.listPrice <= 0) e.listPrice = "Price must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, capacity: Number(form.capacity), listPrice: Number(form.listPrice) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Offering</h2>
            <p className="text-sm text-gray-500 mt-0.5">Add a product or service to the catalog</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 text-sm text-black">
          <Field label="Offering Name" required error={errors.offering}>
            <input
              value={form.offering}
              onChange={(e) => set("offering", e.target.value)}
              placeholder="e.g. Hydraulic Valve Assembly"
              className={inputCls(errors.offering)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4 text-sm text-black">
            <Field label="Category" required>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className={inputCls(false)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status" required>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className={inputCls(false)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-black">
            <Field label="Capacity (units)" required error={errors.capacity}>
              <input
                type="number" min="1"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                placeholder="e.g. 500"
                className={inputCls(errors.capacity)}
              />
            </Field>
            <Field label="List Price (INR) " required error={errors.listPrice}>
              <div className="relative text-black">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input
                  type="number" min="0.01" step="0.01"
                  value={form.listPrice}
                  onChange={(e) => set("listPrice", e.target.value)}
                  placeholder="0.00"
                  className={inputCls(errors.listPrice) + " pl-7"}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Catalog
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Remove Offering?</h3>
          <p className="text-sm text-gray-500 mb-3">
            <span className="font-medium text-gray-700">{product?.offering}</span> will be hidden from the catalog.
          </p>
          <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
            This is a soft delete — the record is preserved in the database and can be restored anytime.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Restore Modal ─────────────────────────────────────────────────────────────
function RestoreModal({ product, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Restore Offering?</h3>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{product?.offering}</span> will be restored to the active catalog.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Products Component ───────────────────────────────────────────────────
export function SupplierProducts() {
  const supplierName = getCurrentSupplierName();
  const [products, setProducts]         = useState(() => loadProducts());
  const [showModal, setShowModal]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [showDeleted, setShowDeleted]   = useState(false);
  const [toast, setToast]               = useState(null);
  const [search, setSearch]             = useState("");

  useEffect(() => {
    setProducts(loadProducts());
  }, [supplierName]);

  useEffect(() => saveProducts(products), [products]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = (form) => {
    const newProduct = { id: nextId(products), ...form, deleted: false, deletedAt: null };
    setProducts((prev) => [...prev, newProduct]);
    setShowModal(false);
    showToast(`"${form.offering}" added to catalog`);
  };

  const handleDelete = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === deleteTarget.id
          ? { ...p, deleted: true, deletedAt: new Date().toISOString() }
          : p
      )
    );
    showToast(`"${deleteTarget.offering}" removed (soft deleted)`, "warning");
    setDeleteTarget(null);
  };

  const handleRestore = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === restoreTarget.id
          ? { ...p, deleted: false, deletedAt: null }
          : p
      )
    );
    showToast(`"${restoreTarget.offering}" restored to catalog`);
    setRestoreTarget(null);
  };

  const q = search.toLowerCase();
  const visible = products.filter(
    (p) =>
      !p.deleted &&
      (p.offering.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q))
  );
  const deleted = products.filter((p) => p.deleted);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2
          ${toast.type === "warning" ? "bg-amber-600 text-white" : "bg-green-600 text-white"}`}>
          {toast.type === "warning" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-1">Manage items and services offered to procurement buyers.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add offering
          </button>
        </div>

        {/* Catalog card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
            <h2 className="font-semibold text-gray-800">Supplier Catalog</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search offerings..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 w-52"
                />
              </div>
              {deleted.length > 0 && (
                <button
                  onClick={() => setShowDeleted((v) => !v)}
                  className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${showDeleted
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                  Deleted ({deleted.length})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["SKU", "OFFERING", "CATEGORY", "CAPACITY", "LIST PRICE", "STATUS", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                    {search ? "No offerings match your search." : "No offerings yet. Click Add offering to get started."}
                  </td>
                </tr>
              )}
              {visible.map((p, i) => (
                <tr key={p.id}
                  className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 !== 0 ? "bg-gray-50/30" : ""}`}>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.offering}</td>
                  <td className="px-6 py-4 text-gray-600">{p.category}</td>
                  <td className="px-6 py-4 text-gray-600">{p.capacity.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{fmt(p.listPrice)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[p.status] ?? statusStyle.Inactive}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove offering">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Soft-deleted records */}
          {showDeleted && deleted.length > 0 && (
            <>
              <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M10 12v4m4-4v4" />
                </svg>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Soft-Deleted Records (stored in DB — not permanently removed)
                </span>
              </div>
              <table className="w-full text-sm opacity-70">
                <tbody>
                  {deleted.map((p) => (
                    <tr key={p.id} className="border-b border-amber-50 bg-amber-50/30">
                      <td className="px-6 py-3 font-mono text-xs text-gray-400 line-through">{p.id}</td>
                      <td className="px-6 py-3 text-gray-400 line-through">{p.offering}</td>
                      <td className="px-6 py-3 text-gray-400 line-through">{p.category}</td>
                      <td className="px-6 py-3 text-gray-400 line-through">{p.capacity.toLocaleString()}</td>
                      <td className="px-6 py-3 text-gray-400 line-through">{fmt(p.listPrice)}</td>
                      <td className="px-6 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
                          Deleted
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button onClick={() => setRestoreTarget(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Restore offering">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {visible.length} offering{visible.length !== 1 ? "s" : ""} in catalog
            </span>
            {deleted.length > 0 && (
              <span className="text-xs text-amber-500">
                {deleted.length} soft-deleted (preserved in storage)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal     && <AddOfferingModal onClose={() => setShowModal(false)}          onSave={handleAdd} />}
      {deleteTarget  && <DeleteModal      product={deleteTarget}  onClose={() => setDeleteTarget(null)}  onConfirm={handleDelete} />}
      {restoreTarget && <RestoreModal     product={restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={handleRestore} />}
    </div>
  );
}

