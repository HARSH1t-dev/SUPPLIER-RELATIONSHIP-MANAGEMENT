import { Save, UploadCloud, Trash2, ShieldCheck, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card, CardHeader } from '../../components/Card.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useDisclosure } from '../../hooks/useDisclosure.js';
import { useState, useEffect, useMemo } from 'react';
import { CustomNotification } from '../../components/CustomNotification.jsx';

export function SupplierProfile() {
  const currentUser = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('srm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const [docsList, setDocsList] = useState(() => {
    const saved = localStorage.getItem('srm_compliance_docs');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'CERT-390481', type: 'ISO 9001', issuer: 'Global Certification Corp', expiry: '2027-04-15', status: 'Active' },
      { id: 'CERT-8401185', type: 'Tax Certification', issuer: 'Internal Revenue Service', expiry: '2026-12-31', status: 'Active' },
    ];
  });
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const verifyDocModal = useDisclosure(false);
  const [docForm, setDocForm] = useState({ id: '', type: 'ISO 9001', issuer: '', expiry: '' });
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveBanner, setShowSaveBanner] = useState(false);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT/SRM_PROJECT/backend/api').replace(/\/$/, '');

  useEffect(() => {
    fetch(`${apiBaseUrl}/compliance.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.compliance)) {
          setDocsList(data.compliance);
          localStorage.setItem('srm_compliance_docs', JSON.stringify(data.compliance));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Compliance documents from API, using localStorage:', err);
      });
  }, [apiBaseUrl]);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsParsing(true);
    setErrorMsg('');
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(URL.createObjectURL(file));
    
    try {
      const { extractTextFromPdf, parseCompliancePdf } = await import('../../utils/pdfParser.js');
      const text = await extractTextFromPdf(file);
      
      const parsed = parseCompliancePdf(text, file.name);
      setDocForm({
        id: parsed.id,
        type: parsed.type,
        issuer: parsed.issuer,
        expiry: parsed.expiry,
      });
      verifyDocModal.open();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process compliance PDF. Make sure it is a valid PDF document.');
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    } finally {
      setIsParsing(false);
    }
  };

  const resetAndClose = () => {
    setDocForm({ id: '', type: 'ISO 9001', issuer: '', expiry: '' });
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    verifyDocModal.close();
  };

  const handleSaveDoc = () => {
    const today = new Date().toISOString().split('T')[0];
    const status = docForm.expiry < today ? 'Exception' : 'Active';

    const newDoc = {
      id: docForm.id || 'CERT-' + Math.floor(1000000 + Math.random() * 9000000),
      type: docForm.type,
      issuer: docForm.issuer,
      expiry: docForm.expiry,
      status: status,
    };

    setDocsList((current) => {
      const updated = [newDoc, ...current];
      localStorage.setItem('srm_compliance_docs', JSON.stringify(updated));
      return updated;
    });

    fetch(`${apiBaseUrl}/compliance.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoc),
    })
      .then((res) => res.json())
      .catch((err) => console.error('Failed to sync Compliance to database:', err));

    resetAndClose();
  };

  const updateDocForm = (field, value) => {
    setDocForm(curr => ({ ...curr, [field]: value }));
  };

  const handleDelete = (id) => {
    const shouldDelete = window.confirm(`Remove compliance document ${id}?`);
    if (shouldDelete) {
      setDocsList((current) => {
        const updated = current.filter((doc) => doc.id !== id);
        localStorage.setItem('srm_compliance_docs', JSON.stringify(updated));
        return updated;
      });

      fetch(`${apiBaseUrl}/compliance.php?id=${id}`, {
        method: 'DELETE',
      })
        .then((res) => res.json())
        .catch((err) => console.error('Failed to delete Compliance from database:', err));
    }
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    setIsSaved(false);
    setShowSaveBanner(false);
    
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setShowSaveBanner(true);
      
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
      
      setTimeout(() => {
        setShowSaveBanner(false);
      }, 4000);
    }, 800);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?.id) return;
    
    if (currentUser.id === 1) {
      setCustomAlert({
        isOpen: true,
        type: 'error',
        title: 'Action Denied',
        message: 'Cannot delete the system super admin account.'
      });
      return;
    }

    const confirmFirst = window.confirm(
      "WARNING: This action is permanent and cannot be undone.\n\n" +
      "Are you absolutely sure you want to permanently delete your supplier partner account and all your submitted bids?"
    );
    
    if (!confirmFirst) return;
    
    const confirmSecond = window.confirm(
      "FINAL CONFIRMATION:\n\n" +
      "You will lose access to this workspace and all bidding histories immediately. Confirm account deletion?"
    );
    
    if (!confirmSecond) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/delete-account.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCustomAlert({
          isOpen: true,
          type: 'success',
          title: 'Account Deleted',
          message: 'Your account has been deleted successfully. You will now be redirected to the login page.',
          onClose: () => {
            sessionStorage.removeItem('srm_user');
            window.location.hash = '#/login';
          }
        });
      } else {
        setCustomAlert({
          isOpen: true,
          type: 'error',
          title: 'Error Deleting Account',
          message: data.message || 'Failed to delete account. Please try again.'
        });
      }
    } catch (err) {
      console.error(err);
      setCustomAlert({
        isOpen: true,
        type: 'error',
        title: 'Network Error',
        message: 'A network error occurred while attempting to delete your account. Please try again.'
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Maintain company details, compliance contacts, and banking-ready information." />
      
      <Card>
        <CardHeader title="Company Profile" />
        {showSaveBanner && (
          <div className="mx-5 mt-2 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400 animate-fade-in">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={3} />
            <span>Profile settings synchronized with procurement directory.</span>
          </div>
        )}
        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <FormField label="Company name">
            <input className={inputClass} defaultValue={currentUser?.companyName || "Apex Industrial Components"} />
          </FormField>
          <FormField label="Primary contact">
            <input className={inputClass} defaultValue={currentUser?.fullName || "Maya Chen"} />
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
            <select className={inputClass} defaultValue="Approved">
              <option>Approved</option>
              <option>Review required</option>
            </select>
          </FormField>
          <div className="md:col-span-2">
            <Button 
              type="button" 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className={`transition duration-300 ${isSaved ? '!bg-emerald-600 hover:!bg-emerald-700 !text-white' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save profile
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader 
          title="Compliance Documents" 
          subtitle="Manage regulatory compliance certifications, tax forms, and liability insurances" 
        />
        <div className="p-5 space-y-6">
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6 text-center transition hover:bg-slate-100/50 dark:hover:bg-slate-900">
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className={`h-10 w-10 text-slate-400 mb-3 ${isParsing ? 'animate-bounce text-blue-500' : ''}`} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Upload Compliance Certificate PDF
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                Supported formats: ISO standard certificates, W-9/Tax declarations, Liability insurance documents
              </p>
              <div className="mb-4">
                <a href={`${import.meta.env.BASE_URL}samples/iso-compliance-certificate.pdf`} download className="text-xs text-brand-600 hover:text-brand-500 underline font-semibold">
                  Download Sample Compliance Certificate
                </a>
              </div>
              
              <input
                type="file"
                accept=".pdf"
                id="compliance-upload-input"
                className="hidden"
                onChange={handlePdfUpload}
                disabled={isParsing}
              />
              <label
                htmlFor="compliance-upload-input"
                className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition mb-2"
              >
                Choose PDF File
              </label>

              {isParsing && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                  <ShieldCheck className="h-4 w-4 animate-spin" />
                  <span>Parsing certificate details...</span>
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <DataTable
              data={docsList}
              columns={[
                { key: 'type', header: 'Compliance Type' },
                { key: 'id', header: 'Certificate ID' },
                { key: 'issuer', header: 'Issuer' },
                { key: 'expiry', header: 'Expiry Date' },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => handleDelete(row.id)}
                      aria-label={`Remove document ${row.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  ),
                },
              ]}
              empty="No compliance documents uploaded yet."
            />
          </div>
        </div>
      </Card>

      <Modal title="Verify Compliance Document" isOpen={verifyDocModal.isOpen} onClose={resetAndClose} size={pdfBlobUrl ? 'xxl' : 'lg'}>
        <div className={`grid gap-6 ${pdfBlobUrl ? 'md:grid-cols-2' : ''}`}>
          <div>
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-blue-900">Verify extracted certificate metadata</p>
              <p className="mt-1 text-sm text-blue-700">Check the values extracted from your certification file before adding it to your profile.</p>
            </div>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Certificate ID">
                  <input 
                    className={inputClass} 
                    value={docForm.id} 
                    onChange={e => updateDocForm('id', e.target.value)} 
                    placeholder="e.g. CERT-8401185"
                  />
                </FormField>
                <FormField label="Issuer / Authority">
                  <input 
                    className={inputClass} 
                    value={docForm.issuer} 
                    onChange={e => updateDocForm('issuer', e.target.value)} 
                    placeholder="e.g. Internal Revenue Service"
                  />
                </FormField>
                <FormField label="Compliance Type">
                  <select className={inputClass} value={docForm.type} onChange={e => updateDocForm('type', e.target.value)}>
                    <option>ISO 9001</option>
                    <option>Tax Certification</option>
                    <option>Liability Insurance</option>
                    <option>ISO 14001</option>
                  </select>
                </FormField>
                <FormField label="Expiry Date">
                  <input 
                    className={inputClass} 
                    type="date"
                    value={docForm.expiry} 
                    onChange={e => updateDocForm('expiry', e.target.value)} 
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
                <Button onClick={handleSaveDoc}><Check className="h-4 w-4" /> Save Document</Button>
              </div>
            </form>
          </div>

          {pdfBlobUrl && (
            <div className="flex flex-col h-[520px] rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 p-2">
              <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <span>Verification Certificate View</span>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(pdfBlobUrl);
                    setPdfBlobUrl(null);
                  }}
                  className="text-rose-600 hover:underline"
                >
                  Hide PDF
                </button>
              </div>
              <iframe
                src={pdfBlobUrl}
                title="PDF Verification"
                className="w-full flex-1 rounded border border-slate-200 dark:border-slate-800 bg-white"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Danger Zone */}
      <Card className="border-rose-100 bg-rose-50/10 dark:border-rose-950/30">
        <div className="p-5">
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-400">Danger Zone</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Permanently remove your partner workspace profile and all associated bid records from the SRM system directory.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              className="!bg-rose-600 hover:!bg-rose-700 !text-white font-semibold transition duration-300"
              onClick={handleDeleteAccount}
            >
              Delete Partner Account
            </Button>
          </div>
        </div>
      </Card>

      <CustomNotification
        isOpen={customAlert.isOpen}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => {
          if (customAlert.onClose) {
            customAlert.onClose();
          }
          setCustomAlert(a => ({ ...a, isOpen: false }));
        }}
      />
    </div>
  );
}

