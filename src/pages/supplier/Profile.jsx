import { Save } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';

export function SupplierProfile() {
  return (
    <>
      <PageHeader title="Profile" description="Maintain company details, compliance contacts, and banking-ready information." />
      <Card>
        <CardHeader title="Company Profile" />
        <form className="grid gap-4 p-5 md:grid-cols-2">
          <FormField label="Company name">
            <input className={inputClass} defaultValue="Apex Industrial Components" />
          </FormField>
          <FormField label="Primary contact">
            <input className={inputClass} defaultValue="Maya Chen" />
          </FormField>
          <FormField label="Category">
            <input className={inputClass} defaultValue="Mechanical Parts" />
          </FormField>
          <FormField label="Region">
            <input className={inputClass} defaultValue="North America" />
          </FormField>
          <FormField label="Tax identifier">
            <input className={inputClass} defaultValue="US-94-2401185" />
          </FormField>
          <FormField label="Compliance status">
            <select className={inputClass}>
              <option>Approved</option>
              <option>Review required</option>
            </select>
          </FormField>
          <div className="md:col-span-2">
            <Button>
              <Save className="h-4 w-4" />
              Save profile
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
