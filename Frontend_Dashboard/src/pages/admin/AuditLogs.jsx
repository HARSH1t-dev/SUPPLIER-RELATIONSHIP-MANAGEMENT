import { Download, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const auditLogs = [
  { time: '2026-05-26 08:42', user: 'Admin User', action: 'Created RFQ draft', module: 'RFQs', result: 'Success' },
  { time: '2026-05-26 08:31', user: 'Procurement Lead', action: 'Updated approval threshold', module: 'Settings', result: 'Success' },
  { time: '2026-05-25 17:18', user: 'Supplier Admin', action: 'Viewed supplier profile', module: 'Suppliers', result: 'Success' },
  { time: '2026-05-25 14:09', user: 'Finance Reviewer', action: 'Exported spend report', module: 'Reports', result: 'Success' },
  { time: '2026-05-25 10:26', user: 'Guest User', action: 'Attempted restricted access', module: 'Governance', result: 'Blocked' },
];

export function AuditLogs() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="View system activity, user actions, access events, and governance history."
        action={
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        }
      />
      <Card>
        <CardHeader title="Activity Register" subtitle="Chronological system and user activity" />
        <DataTable
          data={auditLogs}
          columns={[
            { key: 'time', header: 'Timestamp' },
            { key: 'user', header: 'User' },
            { key: 'action', header: 'Action' },
            { key: 'module', header: 'Module' },
            { key: 'result', header: 'Result', render: (row) => <StatusBadge status={row.result} /> },
          ]}
        />
      </Card>
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-950">Retention Policy</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Audit events are retained for 365 days and can be exported for compliance reviews.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
