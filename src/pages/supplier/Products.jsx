import { PackagePlus } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { products } from '../../data/mockData.js';
import { currency, number } from '../../utils/formatters.js';

export function SupplierProducts() {
  return (
    <>
      <PageHeader title="Products" description="Manage items and services offered to procurement buyers." action={<Button><PackagePlus className="h-4 w-4" /> Add offering</Button>} />
      <Card>
        <CardHeader title="Supplier Catalog" />
        <DataTable
          data={products}
          columns={[
            { key: 'sku', header: 'SKU' },
            { key: 'name', header: 'Offering' },
            { key: 'category', header: 'Category' },
            { key: 'inventory', header: 'Capacity', render: (row) => number(row.inventory) },
            { key: 'price', header: 'List Price', render: (row) => currency(row.price) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
    </>
  );
}
