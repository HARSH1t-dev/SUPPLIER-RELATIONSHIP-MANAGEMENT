import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { products, suppliers } from '../../data/mockData.js';
import { currency, number } from '../../utils/formatters.js';

export function ProductManagement() {
  const [selectedSupplier, setSelectedSupplier] = useState("Apex Industrial Components");
  const [localProducts, setLocalProducts] = useState([]);

  // Use the suppliers list from mockData.js
  const supplierList = suppliers.map(s => s.name);

  const getInitialCatalog = (name) => {
    const defaults = {
      "Apex Industrial Components": [
        { id: "PRD-4401", offering: "Hydraulic Valve Assembly", category: "Mechanical", capacity: 420, listPrice: 28500, status: "Active", deleted: false },
        { id: "PRD-4405", offering: "Precision Steel Shaft", category: "Mechanical", capacity: 1500, listPrice: 12000, status: "Active", deleted: false },
      ],
      "Vector Packaging Co.": [
        { id: "PRD-4402", offering: "Sterile Packaging Film", category: "Packaging", capacity: 12800, listPrice: 800, status: "Active", deleted: false },
        { id: "PRD-4406", offering: "Corrugated Shipping Cartons", category: "Packaging", capacity: 50000, listPrice: 150, status: "Active", deleted: false },
      ],
      "Northstar Logistics": [
        { id: "PRD-4404", offering: "Freight Consolidation Lane", category: "Logistics", capacity: 72, listPrice: 165000, status: "Active", deleted: false },
        { id: "PRD-4407", offering: "Cold-Chain Reefer Routing", category: "Logistics", capacity: 24, listPrice: 320000, status: "Active", deleted: false },
      ],
      "BlueRiver Electronics": [
        { id: "PRD-4403", offering: "Lithium Backup Module", category: "Electrical", capacity: 240, listPrice: 94000, status: "Review", deleted: false },
        { id: "PRD-4408", offering: "Solid State Relay Board", category: "Electrical", capacity: 1200, listPrice: 4200, status: "Active", deleted: false },
      ]
    };
    return defaults[name] || [];
  };

  useEffect(() => {
    try {
      const key = `srm_products_${selectedSupplier}`;
      const raw = localStorage.getItem(key);
      let list = [];
      if (raw) {
        list = JSON.parse(raw);
      } else {
        list = getInitialCatalog(selectedSupplier);
      }

      // Map keys from supplier format to admin format, filtering out deleted ones
      const mapped = list
        .filter((p) => !p.deleted)
        .map((p) => ({
          sku: p.id,
          name: p.offering,
          category: p.category,
          inventory: p.capacity,
          price: p.listPrice,
          status: p.status,
        }));
      setLocalProducts(mapped);
    } catch (_) {
      setLocalProducts([]);
    }
  }, [selectedSupplier]);

  const supplierDropdown = (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase text-slate-500">Supplier:</span>
      <select
        value={selectedSupplier}
        onChange={(e) => setSelectedSupplier(e.target.value)}
        className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 min-w-[240px]"
      >
        {supplierList.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <PageHeader title="Product Management" description="Maintain catalog items, inventory, and supplier-facing product records." />
      <Card>
        <CardHeader 
          title="Product Catalog" 
          subtitle="Active materials, services, and catalog entries by supplier" 
          action={supplierDropdown}
        />
        <DataTable
          data={localProducts}
          empty={`No active products registered for ${selectedSupplier}.`}
          columns={[
            { key: 'sku', header: 'SKU' },
            { key: 'name', header: 'Product' },
            { key: 'category', header: 'Category' },
            { key: 'inventory', header: 'Inventory', render: (row) => number(row.inventory) },
            { key: 'price', header: 'Unit Price', render: (row) => currency(row.price) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
