import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CircleDot,
  FileCheck2,
  Gauge,
  List,
  LockKeyhole,
  UserRound
} from 'lucide-react';
import AppShell from '../common/AppShell';
import JockeyApplicationForm from '../profile/JockeyApplicationForm';
import {
  getMyJockeyVerification,
  resubmitJockeyVerification,
  submitJockeyVerification
} from '../../services/jockeyVerificationService';
import { formatDate, formatDisplayLabel } from '../../lib';

function verificationStatus(application) {
  return String(application?.verificationStatus || 'NOT_SUBMITTED').toUpperCase();
}

function StatusBadge({ status }) {
  const normalized = String(status || 'NOT_SUBMITTED').toLowerCase();
  return <span className={`status-badge ${normalized}`}>{formatDisplayLabel(status || 'NOT_SUBMITTED')}</span>;
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || 'Not updated'}</strong>
    </div>
  );
}

function ActivationStep({ complete, current, title, description }) {
  const Icon = complete ? Check : current ? CircleDot : LockKeyhole;
  return (
    <li className="flex gap-3 border-b border-brown-700/10 py-4 last:border-0">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${complete ? 'bg-green-100 text-green-700' : current ? 'bg-gold-400/20 text-brown-700' : 'bg-slate-100 text-slate-500'}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <strong className="block text-brown-900">{title}</strong>
        <span className="mt-1 block text-sm font-medium text-slate-500">{description}</span>
      </div>
    </li>
  );
}

export default function JockeyPendingDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    return ['overview', 'application', 'account'].includes(section) ? section : 'overview';
  });
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const status = verificationStatus(application);
  const profileName = currentUser?.fullName || currentUser?.username || currentUser?.email || 'Jockey';
  const lockedReason = 'Available after the Jockey application is approved by an administrator.';
  const navItems = useMemo(() => [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'professional-profile', label: 'Professional Profile', icon: UserRound, disabled: true, disabledReason: lockedReason },
    { key: 'invitations', label: 'Race Invitations', icon: List, disabled: true, disabledReason: lockedReason },
    { key: 'application', label: 'Jockey Application', icon: FileCheck2 },
    { key: 'account', label: 'Account', icon: UserRound }
  ], []);

  const copy = {
    NOT_SUBMITTED: {
      eyebrow: 'Jockey onboarding',
      title: 'Complete your Jockey application',
      description: 'Provide your licence and trainer information for administrator review.',
      action: 'Submit Jockey Application'
    },
    PENDING: {
      eyebrow: 'Application under review',
      title: 'Your Jockey documents are being reviewed',
      description: 'Professional features remain locked until an administrator approves the application.',
      action: 'View Submitted Application'
    },
    REJECTED: {
      eyebrow: 'Changes required',
      title: 'Update and resubmit your Jockey application',
      description: application?.rejectionReason || 'Review the administrator feedback and correct your documents.',
      action: 'Update Application'
    },
    APPROVED: {
      eyebrow: 'Application approved',
      title: 'Your Jockey access is ready',
      description: 'Sign in again to refresh your access token and unlock professional features.',
      action: 'Sign Out and Sign In Again'
    }
  }[status] || {
    eyebrow: 'Jockey onboarding',
    title: 'Check your Jockey application',
    description: 'Refresh the page to get the latest review status.',
    action: 'View Application'
  };

  async function loadStatus() {
    setIsLoading(true);
    setError('');
    const [applicationResult] = await Promise.allSettled([getMyJockeyVerification()]);

    if (applicationResult.status === 'fulfilled') {
      setApplication(applicationResult.value);
    } else if (applicationResult.reason?.status === 404) {
      setApplication(null);
    } else {
      setError(applicationResult.reason?.message || 'Unable to load the Jockey application.');
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, [currentUser?.userID, currentUser?.id]);

  async function handleSubmit(values) {
    setIsSubmitting(true);
    setFormError('');
    setMessage('');
    try {
      const submitted = status === 'REJECTED' && application?.verificationId
        ? await resubmitJockeyVerification(application.verificationId, values)
        : await submitJockeyVerification(values);
      setApplication(submitted);
      setIsFormOpen(false);
      setActiveSection('application');
      setMessage('Jockey application submitted. Please wait for administrator review.');
    } catch (submitError) {
      setFormError(submitError?.message || 'Unable to submit the Jockey application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePrimaryAction() {
    if (status === 'APPROVED') return onLogout();
    if (status === 'NOT_SUBMITTED' || status === 'REJECTED') {
      return setIsFormOpen(true);
    }
    setActiveSection('application');
  }

  function renderApplication() {
    if (isLoading) return <div className="admin-alert success" role="status">Loading Jockey application...</div>;
    const files = Array.isArray(application?.files) ? application.files : [];
    return (
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div><p className="eyebrow">Jockey application</p><h2>{copy.title}</h2><p>{copy.description}</p></div>
          <StatusBadge status={status} />
        </div>
        {application && (
          <div className="grid gap-3 md:grid-cols-2">
            <Detail label="Applicant" value={application.jockeyUsername} />
            <Detail label="Trainer" value={application.trainerName} />
            <Detail label="Trainer Email" value={application.trainerEmail} />
            <Detail label="Academy / Stable Address" value={application.academyStableAddress} />
            <Detail label="Issuing Authority" value={application.issuingAuthority} />
            <Detail label="Licence Type" value={formatDisplayLabel(application.licenceType)} />
            <Detail label="Licence Expiry" value={formatDate(application.expiryDate)} />
            <Detail label="Weight" value={application.weight != null ? `${application.weight} kg` : null} />
            <Detail label="Submitted At" value={formatDate(application.submittedAt)} />
            {application.rejectionReason && <Detail label="Rejection Reason" value={application.rejectionReason} />}
            {files.map((file, index) => (
              <Detail key={file.fileUrl || index} label={`Licence Document ${index + 1}`} value={<a className="table-button" href={file.fileUrl} target="_blank" rel="noreferrer">View document</a>} />
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          {(status === 'NOT_SUBMITTED' || status === 'REJECTED' || status === 'APPROVED') && (
            <button className="primary-button" type="button" onClick={handlePrimaryAction}>{copy.action}</button>
          )}
        </div>
      </section>
    );
  }

  function renderOverview() {
    const submitted = ['PENDING', 'APPROVED'].includes(status);
    const approved = status === 'APPROVED';
    return (
      <section className="owner-stack">
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
            <p>{copy.description}</p>
            <button className="primary-button owner-hero-action" type="button" onClick={handlePrimaryAction}>{copy.action}</button>
          </div>
        </section>
        <section className="owner-stats-grid" aria-label="Jockey account status">
          <div className="owner-stat-card highlight"><span>Jockey Application</span><strong><StatusBadge status={status} /></strong><small>Professional licence review</small></div>
        </section>
        <section className="owner-overview-grid">
          <section className="owner-panel">
            <div className="owner-panel-header"><div><p className="eyebrow">Activation progress</p><h2>Unlock Jockey features</h2><p>Professional features become available after administrator approval.</p></div></div>
            <ol className="m-0 list-none p-0">
              <ActivationStep complete title="Jockey account created" description="You can sign in and access the Jockey portal." />
              <ActivationStep complete={submitted} current={!submitted} title="Jockey application submitted" description="Licence and trainer information are required." />
              <ActivationStep complete={approved} current={status === 'PENDING'} title="Administrator approval" description="An administrator reviews the professional documents." />
              <ActivationStep complete={false} current={approved} title="Jockey features unlocked" description="Sign in again after approval to refresh your access token." />
            </ol>
          </section>
          <section className="owner-panel compact-panel">
            <div className="owner-panel-header"><div><p className="eyebrow">After approval</p><h2>Available Jockey tools</h2><p>These tools stay locked until professional approval.</p></div></div>
            <div className="owner-mini-list">
              <div><span>Manage professional profile</span><LockKeyhole size={18} /></div>
              <div><span>Review race invitations</span><LockKeyhole size={18} /></div>
              <div><span>Accept or reject invitations</span><LockKeyhole size={18} /></div>
            </div>
          </section>
        </section>
      </section>
    );
  }

  function renderContent() {
    if (activeSection === 'application') return renderApplication();
    if (activeSection === 'account') {
      return (
        <section className="owner-panel">
          <div className="owner-panel-header"><div><p className="eyebrow">Account information</p><h2>{profileName}</h2><p>Your account remains active while professional access is reviewed.</p></div><StatusBadge status={status} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <Detail label="Username" value={currentUser?.username || currentUser?.fullName} />
            <Detail label="Email" value={currentUser?.email} />
            <Detail label="Phone Number" value={currentUser?.phone} />
            <Detail label="Account Type" value="Jockey" />
            <Detail label="Jockey Access" value={formatDisplayLabel(status)} />
          </div>
        </section>
      );
    }
    return renderOverview();
  }

  return (
    <AppShell
      variant="jockey"
      title={`Welcome, ${profileName}`}
      subtitle="Jockey account and professional access status."
      profileName={profileName}
      profileRole={`Jockey access: ${formatDisplayLabel(status)}`}
      activeSection={activeSection}
      navItems={navItems}
      onNavigate={setActiveSection}
      onLogout={onLogout}
      headerAction={<button className="refresh-button" type="button" onClick={loadStatus} disabled={isLoading}>{isLoading ? 'Loading...' : 'Refresh status'}</button>}
    >
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}
      {renderContent()}
      {isFormOpen && (
        <JockeyApplicationForm
          user={currentUser}
          application={application}
          mode={status === 'REJECTED' ? 'resubmit' : 'submit'}
          formError={formError}
          isSubmitting={isSubmitting}
          onCancel={() => { setFormError(''); setIsFormOpen(false); }}
          onSubmit={handleSubmit}
        />
      )}
    </AppShell>
  );
}
