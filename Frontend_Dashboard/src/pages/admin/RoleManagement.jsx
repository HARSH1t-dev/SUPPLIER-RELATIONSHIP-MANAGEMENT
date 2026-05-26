import { Plus, UserCog } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const users = [
  { name: 'Admin User', email: 'admin@srm.io', role: 'Super Admin', permissions: 'All modules', status: 'Active' },
  { name: 'Procurement Lead', email: 'procurement@srm.io', role: 'Procurement Manager', permissions: 'RFQs, POs, Reports', status: 'Active' },
  { name: 'Finance Reviewer', email: 'finance@srm.io', role: 'Finance', permissions: 'Spend, Reports', status: 'Active' },
  { name: 'Supplier Auditor', email: 'audit@srm.io', role: 'Read Only', permissions: 'Suppliers, Audit Logs', status: 'Review' },
];

const roles = [
  { role: 'Super Admin', users: 2, access: 'Full system access' },
  { role: 'Procurement Manager', users: 5, access: 'Sourcing and procurement workflows' },
  { role: 'Finance', users: 3, access: 'Spend analytics and reports' },
  { role: 'Read Only', users: 8, access: 'View-only operational access' },
];

export function RoleManagement() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Role Management"
        description="Manage administrator users, roles, permissions, and access boundaries."
        action={
          <Button>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        }
      />
      <Card>
        <CardHeader title="Users" subtitle="Administrative access and assigned roles" />
        <DataTable
          data={users}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role' },
            { key: 'permissions', header: 'Permissions' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Role Matrix" subtitle="Role definitions and access scope" />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {roles.map((item) => (
            <div key={item.role} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <UserCog className="h-5 w-5 text-blue-700" />
              <h2 className="mt-3 text-sm font-bold text-slate-950">{item.role}</h2>
              <p className="mt-1 text-sm text-slate-500">{item.users} users</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.access}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
