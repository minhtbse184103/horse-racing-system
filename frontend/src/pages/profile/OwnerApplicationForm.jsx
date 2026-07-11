import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import OwnerApplicationWizard from '../../components/profile/OwnerApplicationForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyOwnerApplication, submitOwnerApplication } from '../../services/ownerApplicationService.js';
import { getMyKyc, needsKycSubmission, submitKyc } from '../../services/kycService.js';

export default function OwnerApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([getMyOwnerApplication(), getMyKyc()])
      .then(([applicationResult, kycResult]) => {
        if (!active) return;
        setApplication(applicationResult.status === 'fulfilled' ? applicationResult.value : null);
        setKyc(kycResult.status === 'fulfilled' ? kycResult.value : null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(values) {
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      if (needsKycSubmission(kyc)) {
        const submittedKyc = await submitKyc(values.kyc);
        setKyc(submittedKyc);
      }
      await submitOwnerApplication(user, values);
      setMessage('Your Owner Application has been submitted and is pending Admin review.');
      setTimeout(() => navigate('/profile'), 900);
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
        title="Become an Owner"
        description="Submit personal, stable, and horse ownership information for administrator approval."
      />
      {message && <p className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}
      <OwnerApplicationWizard
        user={user}
        application={application?.status === 'REJECTED' ? application : null}
        kyc={kyc}
        formError={error}
        isSubmitting={submitting}
        onCancel={() => navigate('/profile')}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}
