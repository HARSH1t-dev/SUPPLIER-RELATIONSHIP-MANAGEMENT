import { LogOut, Save, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';

export function AdminProfile() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your admin profile, preferences, and logout options." />
      <Card>
        <CardHeader title="Admin User" subtitle="Super Admin" />
        <div className="grid gap-6 p-5 lg:grid-cols-[0.35fr_0.65fr]">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm">
              <UserRound className="h-10 w-10" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-950">Admin User</h2>
            <p className="mt-1 text-sm text-slate-600">admin@srm.io</p>
            <p className="mt-4 rounded-full bg-blue-600 px-3 py-1 text-center text-sm font-bold text-white">Super Admin</p>
          </div>
          <form className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name">
              <input className={inputClass} defaultValue="Admin User" />
            </FormField>
            <FormField label="Email">
              <input className={inputClass} defaultValue="admin@srm.io" />
            </FormField>
            <FormField label="Timezone">
              <select className={inputClass} defaultValue="Asia/Calcutta">
                <option>Asia/Calcutta</option>
                <option>UTC</option>
                <option>America/New_York</option>
              </select>
            </FormField>
            <FormField label="Notifications">
              <select className={inputClass} defaultValue="Important alerts">
                <option>Important alerts</option>
                <option>All activity</option>
                <option>Muted</option>
              </select>
            </FormField>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Button type="button">
                <Save className="h-4 w-4" />
                Save Profile
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  sessionStorage.removeItem('srm_user');
                  navigate('/login');
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
