import { Save } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';

export function Settings() {
  return (
    <>
      <PageHeader title="Settings" description="Configure sourcing policy, approval workflows, and notification preferences." />
      <Card>
        <CardHeader title="Procurement Configuration" />
        <form className="grid gap-4 p-5 md:grid-cols-2">
          <FormField label="Default currency">
            <select className={inputClass}>
              <option>USD</option>
              <option>EUR</option>
              <option>INR</option>
            </select>
          </FormField>
          <FormField label="Approval threshold">
            <input className={inputClass} placeholder="$100,000" />
          </FormField>
          <FormField label="RFQ minimum bids">
            <input className={inputClass} type="number" defaultValue="3" />
          </FormField>
          <FormField label="Risk review cadence">
            <select className={inputClass}>
              <option>Quarterly</option>
              <option>Monthly</option>
              <option>Annually</option>
            </select>
          </FormField>
          <div className="md:col-span-2">
            <Button>
              <Save className="h-4 w-4" />
              Save settings
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
