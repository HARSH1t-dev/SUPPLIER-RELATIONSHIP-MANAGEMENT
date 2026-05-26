import { Send } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { currency } from '../../utils/formatters.js';
import { getStoredRfqs, saveStoredRfqs } from '../../utils/rfqStore.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function SupplierRFQs() {
  const navigate = useNavigate();
  const [rfqList, setRfqList] = useState(() => getStoredRfqs());

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    fetch(`${apiBaseUrl}/rfqs.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rfqs)) {
          setRfqList(data.rfqs);
          saveStoredRfqs(data.rfqs);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch RFQs from API, using localStorage:', err);
      });
  }, [apiBaseUrl]);

  return (
    <>
      <PageHeader title="RFQs" description="Review buyer sourcing events and submit supplier responses." />
      <Card>
        <CardHeader title="RFQ Invitations" subtitle="Open and evaluating opportunities" />
        <DataTable
          data={rfqList.filter((rfq) => rfq.status !== 'Draft')}
          columns={[
            { key: 'id', header: 'RFQ' },
            { key: 'title', header: 'Title' },
            { key: 'category', header: 'Category' },
            { key: 'deadline', header: 'Deadline' },
            { key: 'value', header: 'Value', render: (row) => currency(row.value) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            { 
              key: 'action', 
              header: 'Action', 
              render: (row) => (
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/supplier/bids', { state: { rfqId: row.id } })}
                >
                  <Send className="h-4 w-4" /> Bid
                </Button>
              ) 
            },
          ]}
        />
      </Card>
    </>
  );
}
