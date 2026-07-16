import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CircleDot,
  FileCheck2,
  Gauge,
  List,
  LockKeyhole,
  Trophy,
  UserRound,
  Wallet
} from 'lucide-react';
import AppShell from '../common/AppShell';
import OwnerApplicationForm from '../profile/OwnerApplicationForm';
import WalletTransferPanel from '../payment/WalletTransferPanel';
import { getMyOwnerApplication, submitOwnerApplication } from '../../services/ownerApplicationService';
import { getMyKyc } from '../../services/kycService';
import { getMyWallet } from '../../services/walletService';
import { formatDate, formatDisplayLabel } from '../../lib';

function applicationStatus(application) {
  return String(application?.status || 'NOT_SUBMITTED').toUpperCase();
}

function kycStatus(kyc) {
  return String(kyc?.status || 'NOT_SUBMITTED').toUpperCase();
}

function walletStatus(wallet) {
  return String(wallet?.status || 'NOT_OPENED').toUpperCase();
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

function DocumentLink({ label, url }) {
  return (
    <Detail
      label={label}
      value={url ? <a className="table-button" href={url} target="_blank" rel="noreferrer">View document</a> : 'Not uploaded'}
    />
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

export default function OwnerPendingDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('vnp_TxnRef') || params.has('vnp_SecureHash')) return 'wallet';
    const section = params.get('section');
    return ['overview', 'application', 'profile', 'wallet'].includes(section) ? section : 'overview';
  });
  const [application, setApplication] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const status = applicationStatus(application);
  const identityStatus = kycStatus(kyc);
  const currentWalletStatus = walletStatus(walletData);
  const profileName = currentUser?.fullName || currentUser?.username || currentUser?.email || 'Owner';
  const lockedReason = 'Available after the Owner application is approved by an administrator.';
  const navItems = useMemo(() => [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'horses', label: 'My Horses', icon: List, disabled: true, disabledReason: lockedReason },
    { key: 'register', label: 'Competitions', icon: Trophy, disabled: true, disabledReason: lockedReason },
    { key: 'application', label: 'Owner Application', icon: FileCheck2 },
    { key: 'profile', label: 'Profile', icon: UserRound },
    { key: 'wallet', labelKey: 'wallet', icon: Wallet }
  ], []);

  const applicationCopy = {
    NOT_SUBMITTED: {
      eyebrow: 'Owner onboarding',
      title: 'Complete your Owner application',
      description: 'Provide stable information and horse ownership evidence for administrator review.',
      action: 'Submit Owner Application'
    },
    PENDING: {
      eyebrow: 'Application under review',
      title: 'Your documents are being reviewed',
      description: 'Your application has been submitted. Profile, KYC, and wallet features remain available while you wait.',
      action: 'View Submitted Application'
    },
    REJECTED: {
      eyebrow: 'Changes required',
      title: 'Update and resubmit your application',
      description: application?.rejectReason || 'Review the administrator feedback before submitting again.',
      action: 'Update Application'
    },
    APPROVED: {
      eyebrow: 'Application approved',
      title: 'Your Owner access is ready',
      description: 'Sign in again to refresh your access token and unlock horse management and competitions.',
      action: 'Sign Out and Sign In Again'
    }
  }[status] || null;

  async function loadOverview() {
    setIsLoading(true);
    setError('');

    const [applicationResult, kycResult, walletResult] = await Promise.allSettled([
      getMyOwnerApplication(),
      getMyKyc(),
      getMyWallet()
    ]);

    if (applicationResult.status === 'fulfilled') {
      setApplication(applicationResult.value);
    } else if (applicationResult.reason?.status === 404) {
      setApplication(null);
    } else if (applicationResult.reason?.status !== 404) {
      setError(applicationResult.reason?.message || 'Unable to load the Owner application.');
    }

    setKyc(kycResult.status === 'fulfilled' ? kycResult.value : null);
    setWalletData(walletResult.status === 'fulfilled' ? walletResult.value : null);
    setIsLoading(false);
  }

  useEffect(() => {
    loadOverview();
  }, [currentUser?.userID, currentUser?.id]);

  async function handleSubmit(values) {
    setIsSubmitting(true);
    setFormError('');
    setMessage('');
    try {
      const submitted = await submitOwnerApplication(currentUser, values);
      setApplication(submitted);
      setIsFormOpen(false);
      setActiveSection('application');
      setMessage('Owner application submitted. Please wait for administrator review.');
    } catch (err) {
      setFormError(err?.message || 'Unable to submit the Owner application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePrimaryAction() {
    if (status === 'APPROVED') {
      onLogout();
      return;
    }
    if (status === 'NOT_SUBMITTED' || status === 'REJECTED') {
      setIsFormOpen(true);
      return;
    }
    setActiveSection('application');
  }

  function renderApplication() {
    if (isLoading) return <div className="admin-alert success" role="status">Loading Owner application...</div>;

    return (
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Owner application</p>
            <h2>{applicationCopy?.title}</h2>
            <p>{applicationCopy?.description}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {application && (
          <div className="grid gap-3 md:grid-cols-2">
            <Detail label="Stable Name" value={application.stableName} />
            <Detail label="Stable Address" value={application.stableAddress} />
            <Detail label="Total Horses Owned" value={application.totalHorsesOwned} />
            <Detail label="Submitted At" value={formatDate(application.submittedAt)} />
            <DocumentLink label="Stable Certificate" url={application.stableCertificateUrl} />
            <DocumentLink label="Horse Ownership Proof" url={application.horseOwnershipProofUrl} />
            {application.reviewedAt && <Detail label="Reviewed At" value={formatDate(application.reviewedAt)} />}
            {application.rejectReason && <Detail label="Rejection Reason" value={application.rejectReason} />}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {status !== 'PENDING' && (
            <button className="primary-button" type="button" onClick={handlePrimaryAction}>{applicationCopy?.action}</button>
          )}
        </div>
      </section>
    );
  }

  function renderOverview() {
    const submitted = status === 'PENDING' || status === 'APPROVED';
    const approved = status === 'APPROVED';

    return (
      <section className="owner-stack">
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">{applicationCopy?.eyebrow}</p>
            <h2>{applicationCopy?.title}</h2>
            <p>{applicationCopy?.description}</p>
            <button className="primary-button owner-hero-action" type="button" onClick={handlePrimaryAction}>
              {applicationCopy?.action}
            </button>
          </div>
        </section>

        <section className="owner-stats-grid" aria-label="Account status summary">
          <div className="owner-stat-card highlight">
            <span>Owner Application</span>
            <strong className="text-2xl"><StatusBadge status={status} /></strong>
            <small>{application?.submittedAt ? `Submitted ${formatDate(application.submittedAt)}` : 'Stable and ownership documents required'}</small>
          </div>
          <div className="owner-stat-card">
            <span>Identity Verification</span>
            <strong className="text-2xl"><StatusBadge status={identityStatus} /></strong>
            <small>KYC is used only to open the wallet</small>
          </div>
          <div className="owner-stat-card">
            <span>Wallet</span>
            <strong className="text-2xl"><StatusBadge status={currentWalletStatus} /></strong>
            <small>{walletData ? 'Wallet information is available' : 'Complete KYC to open your wallet'}</small>
          </div>
        </section>

        <section className="owner-overview-grid">
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div><p className="eyebrow">Activation progress</p><h2>Unlock Owner features</h2><p>Professional access and wallet access are reviewed independently.</p></div>
            </div>
            <ol className="m-0 list-none p-0">
              <ActivationStep complete title="Owner account created" description="You can sign in and access the Owner portal." />
              <ActivationStep complete={submitted} current={!submitted} title="Owner application submitted" description="Stable information and horse ownership evidence are required." />
              <ActivationStep complete={approved} current={status === 'PENDING'} title="Administrator approval" description="An administrator reviews the professional documents." />
              <ActivationStep complete={false} current={approved} title="Owner features unlocked" description="Sign in again after approval to refresh your access token." />
            </ol>
          </section>

          <section className="owner-panel compact-panel">
            <div className="owner-panel-header">
              <div><p className="eyebrow">After approval</p><h2>Available Owner tools</h2><p>These tools stay locked until professional approval.</p></div>
            </div>
            <div className="owner-mini-list">
              <div><span>Manage horse profiles</span><LockKeyhole size={18} aria-hidden="true" /></div>
              <div><span>Register for competitions</span><LockKeyhole size={18} aria-hidden="true" /></div>
              <div><span>Manage Jockey invitations</span><LockKeyhole size={18} aria-hidden="true" /></div>
            </div>
          </section>
        </section>
      </section>
    );
  }

  function renderContent() {
    if (activeSection === 'wallet') return <WalletTransferPanel currentUser={currentUser} role="OWNER" />;
    if (activeSection === 'application') return renderApplication();
    if (activeSection === 'profile') {
      return (
        <section className="owner-stack">
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div><p className="eyebrow">Account information</p><h2>{profileName}</h2><p>Your account remains active while professional access is reviewed.</p></div>
              <StatusBadge status={status} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Detail label="Username" value={currentUser?.username || currentUser?.fullName} />
              <Detail label="Email" value={currentUser?.email} />
              <Detail label="Phone Number" value={currentUser?.phone} />
              <Detail label="Account Type" value="Owner" />
              <Detail label="Owner Access" value={formatDisplayLabel(status)} />
              <Detail label="KYC Status" value={formatDisplayLabel(identityStatus)} />
            </div>
          </section>
          {application && renderApplication()}
        </section>
      );
    }
    return renderOverview();
  }

  return (
    <AppShell
      variant="owner"
      title={`Welcome, ${profileName}`}
      subtitle="Owner account and professional access status."
      profileName={profileName}
      profileRole={`Owner access: ${formatDisplayLabel(status)}`}
      activeSection={activeSection}
      navItems={navItems}
      onNavigate={setActiveSection}
      onLogout={onLogout}
      headerAction={<button className="refresh-button" type="button" onClick={loadOverview} disabled={isLoading}>{isLoading ? 'Loading...' : 'Refresh status'}</button>}
    >
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}
      {renderContent()}

      {isFormOpen && (
        <OwnerApplicationForm
          user={currentUser}
          application={application}
          formError={formError}
          isSubmitting={isSubmitting}
          onCancel={() => { setFormError(''); setIsFormOpen(false); }}
          onSubmit={handleSubmit}
        />
      )}
    </AppShell>
  );
}
