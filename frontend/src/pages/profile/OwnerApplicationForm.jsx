import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyOwnerApplication, submitOwnerApplication } from '../../services/ownerApplicationService.js';

const emptyForm = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  address: '',
  identityNumber: ''
};

export default function OwnerApplicationForm() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const readOnly = searchParams.get('view') === '1';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getMyOwnerApplication(user.userID)
      .then((application) => {
        if (!active || !application) return;
        setForm({
          fullName: application.fullName || '',
          dateOfBirth: application.dateOfBirth || '',
          gender: application.gender || '',
          nationality: application.nationality || '',
          address: application.address || '',
          identityNumber: application.identityNumber || ''
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.userID]);

  const missingRequired = useMemo(
    () => Object.values(form).some((value) => !String(value || '').trim()),
    [form]
  );

  function updateField(event) {
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await submitOwnerApplication(user, form);
      setSuccessOpen(true);
    } catch (submitError) {
      setError(submitError.message || 'Cannot submit application.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState label="Loading application form..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Owner Application"
        title={readOnly ? 'View Application' : 'Become an Owner'}
        description="Submit identity information for administrator approval. Email and phone are read-only from your account."
      />

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
          <label className="field-label">
            Full Name
            <input className="field-input" name="fullName" value={form.fullName} onChange={updateField} disabled={readOnly} />
          </label>
          <label className="field-label">
            Date of Birth
            <input className="field-input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={updateField} disabled={readOnly} />
          </label>
          <label className="field-label">
            Gender
            <select className="field-input" name="gender" value={form.gender} onChange={updateField} disabled={readOnly}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="field-label">
            Nationality
            <input className="field-input" name="nationality" value={form.nationality} onChange={updateField} disabled={readOnly} />
          </label>
          <label className="field-label lg:col-span-2">
            Address
            <input className="field-input" name="address" value={form.address} onChange={updateField} disabled={readOnly} />
          </label>
          <label className="field-label">
            Identity Number / Passport / National ID
            <input className="field-input" name="identityNumber" value={form.identityNumber} onChange={updateField} disabled={readOnly} />
          </label>
          <label className="field-label">
            Email
            <input className="field-input bg-slate-100 text-slate-500" value={user.email} readOnly />
          </label>
          <label className="field-label">
            Phone Number
            <input className="field-input bg-slate-100 text-slate-500" value={user.phone} readOnly />
          </label>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 lg:col-span-2">{error}</p>}

          <div className="flex flex-wrap justify-end gap-3 lg:col-span-2">
            <Link to="/profile" className="btn btn-muted">
              Cancel
            </Link>
            {!readOnly && (
              <button type="submit" className="btn btn-primary" disabled={missingRequired || submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </Card>

      <ConfirmModal
        open={successOpen}
        title="Application submitted"
        message="Your Owner application has been submitted successfully and is waiting for administrator approval."
        confirmLabel="Back to Profile"
        cancelLabel="Close"
        onCancel={() => navigate('/profile')}
        onConfirm={() => navigate('/profile')}
      />
    </DashboardLayout>
  );
}
