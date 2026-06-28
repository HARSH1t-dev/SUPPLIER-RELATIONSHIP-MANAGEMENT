import { useMemo, useState } from 'react';
import { Eye, Filter } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { SearchBar } from '../../components/SearchBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { suppliers } from '../../data/mockData.js';
import { currency } from '../../utils/formatters.js';

export function SupplierManagement() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(
    () => suppliers.filter((supplier) => `${supplier.name} ${supplier.category} ${supplier.region}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <>
      <PageHeader title="Supplier Management" description="Search, qualify, monitor, and review supplier relationships." />
      <Card>
        <CardHeader
          title="Supplier Directory"
          subtitle="Approved, onboarding, and monitored suppliers"
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <SearchBar value={query} onChange={setQuery} placeholder="Search suppliers" />
              <Button variant="secondary">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          }
        />
        <DataTable
          data={filtered}
          columns={[
            { key: 'id', header: 'Supplier ID' },
            { key: 'name', header: 'Name' },
            { key: 'category', header: 'Category' },
            { key: 'region', header: 'Region' },
            { key: 'rating', header: 'Rating' },
            { key: 'risk', header: 'Risk', render: (row) => <StatusBadge status={row.risk} /> },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            { key: 'spend', header: 'Spend', render: (row) => currency(row.spend) },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <Button variant="secondary" className="h-9 px-3" onClick={() => setSelected(row)}>
                  <Eye className="h-4 w-4" />
                  View
                </Button>
              ),
            },
          ]}
        />
        <Pagination />
      </Card>
      <Modal title="Supplier Detail" isOpen={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(selected).map(([key, value]) => (
              <div key={key} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">{key}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{key === 'spend' ? currency(value) : value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
