import { Plus } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { products } from '../../data/mockData.js';
import { currency, number } from '../../utils/formatters.js';

export function ProductManagement() {
  return (
    <>
      <PageHeader title="Product Management" description="Maintain catalog items, inventory, and supplier-facing product records." action={<Button><Plus className="h-4 w-4" /> Add product</Button>} />
      <Card>
        <CardHeader title="Product Catalog" subtitle="Active materials, services, and catalog entries" />
        <DataTable
          data={products}
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
