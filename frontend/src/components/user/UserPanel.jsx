import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CircleDollarSign,
  Flag,
  Gauge,
  Home,
  Medal,
  Search,
  ShieldCheck,
  Trophy,
  UserRound,
  Wallet
} from 'lucide-react';
import OwnerApplicationForm from '../profile/OwnerApplicationForm';
import JockeyApplicationForm from '../profile/JockeyApplicationForm';
import WalletTransferPanel from '../payment/WalletTransferPanel';
import BettingPanel from './BettingPanel';
import StatCard from '../common/StatCard';
import LanguageToggle from '../common/LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate, formatDisplayLabel, getUserRole } from '../../lib';
import { getMyOwnerApplication, submitOwnerApplication } from '../../services/ownerApplicationService';
import {
  getMyJockeyVerification,
  resubmitJockeyVerification,
  submitJockeyVerification
} from '../../services/jockeyVerificationService';
import { getMyKyc, needsKycSubmission } from '../../services/kycService';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'horses', label: 'Horses', icon: Trophy },
  { key: 'races', label: 'Races', icon: Flag },
  { key: 'betting', label: 'Betting', icon: CircleDollarSign, accountTypes: ['SPECTATOR'] },
  { key: 'results', label: 'Results', icon: Medal },
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'wallet', labelKey: 'wallet', icon: Wallet }
];

const sampleRaces = [
  {
    id: 1,
    name: 'Golden Mile Sprint',
    time: 'Today · 15:30',
    venue: 'Saigon Grand Track',
    horses: 12
  },
  {
    id: 2,
    name: 'Emerald Cup Qualifier',
    time: 'Tomorrow · 09:00',
    venue: 'Hanoi Racing Park',
    horses: 10
  },
  {
    id: 3,
    name: 'Autumn Derby Preview',
    time: 'Jun 22 · 17:00',
    venue: 'Da Nang Turf Club',
    horses: 14
  }
];

function StatusBadge({ status }) {
  const normalized = String(status || 'not-registered').toLowerCase().replace(/\s+/g, '-');
  const label = status ? formatDisplayLabel(status) : 'Not Registered';

  return <span className={`status-badge ${normalized}`}>{label}</span>;
}

function getKycStatus(kyc) {
  return String(kyc?.status || 'NOT_SUBMITTED').toUpperCase();
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-[24px] border border-dashed border-brown-700/20 bg-white/60 p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream-200 text-2xl">🏇</div>
      <h3 className="mt-4 text-xl font-black text-brown-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl font-medium text-slate-500">{message}</p>
    </div>
  );
}

function DashboardHome({ accountType, onGoProfile }) {
  const isSpectator = accountType === 'SPECTATOR';
  const professionalLabel = accountType === 'OWNER' ? 'Owner' : 'Jockey';
  return (
    <section className="owner-stack">
      <section className="owner-stats-grid">
        <StatCard label="Total Horses" value={248} description="Published horse profiles" highlight />
        <StatCard label="Upcoming Races" value={12} description="Open schedule for spectators" />
        <StatCard label="Today's Races" value={4} description="Races running today" />
        {isSpectator
          ? <StatCard label="Betting Overview" value="Mock" description="UI placeholder for future API" />
          : <StatCard label="Application" value="Required" description={`${professionalLabel} access requires admin approval`} />}
      </section>

      <section className="owner-overview-grid">
        <div className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">{isSpectator ? 'Spectator Dashboard' : `${professionalLabel} Onboarding`}</p>
            <h2>{isSpectator ? 'Premium race-day command center' : `Complete your ${professionalLabel} application`}</h2>
            <p>
              {isSpectator
                ? 'Track horses, upcoming races, betting summaries, and results from one dashboard.'
                : `Your account is active. Submit the required ${professionalLabel} documents and wait for administrator approval to unlock professional features.`}
            </p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button" onClick={onGoProfile}>
              {isSpectator ? 'View Profile' : `Open ${professionalLabel} Application`}
            </button>
          </div>
        </div>

        <div className="owner-panel compact-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">Upcoming Race Cards</p>
              <h2>Race highlights</h2>
              <p>Image placeholders are ready for real race media.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {sampleRaces.map((race) => (
              <div className="rounded-[20px] border border-brown-700/10 bg-white/70 p-4" key={race.id}>
                <div className="flex items-start gap-3">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brown-900 text-2xl text-gold-400">🏁</div>
                  <div className="min-w-0">
                    <strong className="block truncate text-brown-900">{race.name}</strong>
                    <small className="mt-1 block font-bold text-slate-500">{race.time}</small>
                    <small className="mt-1 block truncate font-semibold text-slate-500">{race.venue} · {race.horses} horses</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function PlaceholderSection({ title, message, icon }) {
  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-cream-200 text-2xl">{icon}</div>
      </div>
      <EmptyState title={`No ${title.toLowerCase()} data yet.`} message="This section uses mock UI now and can be connected to backend APIs later." />
    </section>
  );
}

function ApplicationDetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || 'Chua cap nhat'}</strong>
    </div>
  );
}

function ApplicationDocumentLink({ label, url }) {
  const documentUrl = String(url || '').trim();

  function openDocument() {
    if (!documentUrl) return;
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      {documentUrl ? (
        <button className="outline-button compact-button mt-3" type="button" onClick={openDocument}>
          View
        </button>
      ) : (
        <strong className="mt-1 block text-brown-900">Chua co file</strong>
      )}
    </div>
  );
}

function OwnerApplicationDetail({ application }) {
  if (!application) return null;

  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">Submitted Application</p>
          <h2>Ho so Owner da gui</h2>
          <p>Thong tin nay dang duoc admin xem xet.</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid gap-5">
        <div>
          <h3 className="text-xl font-black text-brown-900">Stable Information</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ApplicationDetailItem label="Stable Name" value={application.stableName} />
            <ApplicationDetailItem label="Stable Address" value={application.stableAddress} />
            <ApplicationDocumentLink label="Stable Certificate" url={application.stableCertificateUrl} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-brown-900">Horse Ownership Proof</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ApplicationDetailItem label="Total Horses Owned" value={application.totalHorsesOwned} />
            <ApplicationDocumentLink label="Horse Ownership Proof" url={application.horseOwnershipProofUrl} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-brown-900">Application Information</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ApplicationDetailItem label="Status" value={application.status} />
            <ApplicationDetailItem label="Submitted At" value={formatDate(application.submittedAt)} />
            <ApplicationDetailItem label="Reviewed At" value={formatDate(application.reviewedAt)} />
            <ApplicationDetailItem label="Reject Reason" value={application.rejectReason} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileSection({ user, ownerApplication, jockeyApplication, kyc, isLoading, onOpenApplication, onOpenAgain, onBecomeJockey, onOpenKyc }) {
  const role = getUserRole(user) || 'SPECTATOR';
  const accountType = String(user?.accountType || role).toUpperCase();
  const status = ownerApplication?.status || null;
  const jockeyStatus = jockeyApplication?.verificationStatus || null;
  const kycStatus = getKycStatus(kyc);
  const isKycVerified = kycStatus === 'VERIFIED';
  const profileDisplayName = kyc?.verifiedFullName || user?.fullName || user?.email;
  const [showOwnerApplicationDetail, setShowOwnerApplicationDetail] = useState(false);

  const detailRows = [
    ['Username', user?.username || user?.fullName || 'Chưa cập nhật'],
    ['Email', user?.email || 'Chưa cập nhật'],
    ['Phone Number', user?.phone || 'Chưa cập nhật'],
    ['Account Type', <span className="role-badge" key="account-type">{formatDisplayLabel(accountType)}</span>],
    ['Access Role', <span className="role-badge" key="role">{formatDisplayLabel(role)}</span>]
  ];

  if (accountType === 'OWNER') detailRows.push(['Owner Status', <StatusBadge key="status" status={status} />]);
  if (accountType === 'JOCKEY') detailRows.push(['Jockey Status', <StatusBadge key="jockey-status" status={jockeyStatus} />]);

  if (status === 'PENDING') {
    detailRows.push(['Application Date', formatDate(ownerApplication.submittedAt)]);
  }

  if (status === 'REJECTED') {
    detailRows.push(['Rejected Date', formatDate(ownerApplication.rejectedAt)]);
    detailRows.push(['Reject Reason', ownerApplication.rejectReason || 'Chưa cập nhật']);
  }

  if (status === 'APPROVED') {
    detailRows.push(['Approval Date', formatDate(ownerApplication.approvedAt)]);
    detailRows.push(['Owner Since', formatDate(ownerApplication.ownerSince)]);
  }

  return (
    <section className="owner-stack">
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-[22px] bg-brown-900 text-2xl text-gold-400">
              {(profileDisplayName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="eyebrow">Profile</p>
              <h2>{profileDisplayName}</h2>
              <p>Manage account, identity verification, and role applications.</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-alert success" role="status">Loading profile...</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {detailRows.map(([label, value]) => (
              <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4" key={label}>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
                <strong className="mt-1 block break-words text-brown-900">{value}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={kycStatus === 'IN_REVIEW' ? 'owner-panel warning-owner-panel' : 'owner-panel'}>
        <div className="owner-panel-header">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-cream-200 text-brown-700">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="eyebrow">KYC Verification</p>
              <h2>Identity verification</h2>
              <p>
                {needsKycSubmission(kyc)
                  ? `Verify with Didit to open your wallet${accountType === 'SPECTATOR' ? ' and enable betting' : ''}.`
                  : kycStatus === 'IN_REVIEW'
                    ? 'Didit is reviewing your identity verification.'
                    : 'Your KYC has been verified.'}
              </p>
            </div>
          </div>
          <StatusBadge status={kycStatus} />
        </div>

        {kycStatus === 'REJECTED' && kyc?.rejectionReason && (
          <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
            {kyc.rejectionReason}
          </div>
        )}

        {isKycVerified && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">Verified Name</span>
              <strong className="mt-1 block break-words text-brown-900">{kyc?.verifiedFullName || 'Not provided'}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">Date of Birth</span>
              <strong className="mt-1 block text-brown-900">{formatDate(kyc?.verifiedDateOfBirth)}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">Document</span>
              <strong className="mt-1 block text-brown-900">
                {formatDisplayLabel(kyc?.documentType || 'Identity document')}
                {kyc?.documentLastFour ? ` **** ${kyc.documentLastFour}` : ''}
              </strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">Verified By</span>
              <strong className="mt-1 block text-brown-900">{formatDisplayLabel(kyc?.provider || 'DIDIT')}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">Verified At</span>
              <strong className="mt-1 block text-brown-900">{formatDate(kyc?.verifiedAt)}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">Document Expiry Date</span>
              <strong className="mt-1 block text-brown-900">{kyc?.documentExpiryDate ? formatDate(kyc.documentExpiryDate) : 'No expiry on document'}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4 md:col-span-2">
              <span className="block text-xs font-extrabold uppercase text-slate-500">Wallet Access</span>
              <strong className="mt-1 flex items-center gap-2 text-brown-900">
                <StatusBadge status={kyc?.walletOpen ? 'ACTIVE' : 'PENDING'} />
                {kyc?.walletOpen
                  ? accountType === 'SPECTATOR' ? 'Betting and wallet access enabled' : 'Wallet access enabled'
                  : 'Wallet is being opened'}
              </strong>
            </div>
          </div>
        )}

        {isLoading ? (
          <button className="outline-button mt-5" type="button" disabled>
            Loading KYC...
          </button>
        ) : needsKycSubmission(kyc) ? (
          <button className="primary-button owner-hero-action mt-5" type="button" onClick={onOpenKyc}>
            {kycStatus === 'REJECTED' || kycStatus === 'EXPIRED' ? 'Verify Again' : 'Open Wallet'}
          </button>
        ) : isKycVerified ? (
          <button className="primary-button owner-hero-action mt-5" type="button" onClick={onOpenKyc}>
            Go to Wallet
          </button>
        ) : (
          <button className="outline-button mt-5" type="button" disabled>
            {kycStatus === 'IN_REVIEW' ? 'Didit Review In Progress' : 'KYC In Progress'}
          </button>
        )}
      </section>

      {accountType === 'OWNER' && !status && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Not Registered</p>
            <h2>Your Owner application is required.</h2>
            <p>Submit stable and horse ownership documents for administrator review.</p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button" onClick={onOpenApplication}>
              Start Owner Application
            </button>
          </div>
        </section>
      )}

      {accountType === 'JOCKEY' && !jockeyStatus && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Application Required</p>
            <h2>Your Jockey application is required.</h2>
            <p>Submit your licence and professional information for administrator review.</p>
          </div>
          <button className="primary-button owner-hero-action" type="button" onClick={onBecomeJockey}>
            Start Jockey Application
          </button>
        </section>
      )}

      {accountType === 'JOCKEY' && jockeyStatus === 'PENDING' && (
        <section className="owner-panel warning-owner-panel">
          <p className="eyebrow">Jockey Pending Approval</p>
          <h2>Your Jockey application has been submitted and is waiting for administrator approval.</h2>
          <p>After admin approval, sign out and sign in again to enter the Jockey dashboard.</p>
          <button className="outline-button mt-5" type="button" disabled>
            Waiting For Approval
          </button>
        </section>
      )}

      {accountType === 'JOCKEY' && jockeyStatus === 'REJECTED' && (
        <section className="owner-panel">
          <p className="eyebrow">Jockey Rejected</p>
          <h2>Your Jockey application has been rejected.</h2>
          <p>Please update the required information and submit again.</p>
          <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
            {jockeyApplication.rejectionReason || 'Reject reason is not available.'}
          </div>
          <button className="primary-button owner-hero-action mt-5" type="button" onClick={onBecomeJockey}>
            Apply Again as Jockey
          </button>
        </section>
      )}

      {accountType === 'JOCKEY' && jockeyStatus === 'APPROVED' && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Jockey Approved</p>
            <h2>Your Jockey application has been approved.</h2>
            <p>Sign out and sign in again so the app can load your new Jockey role and dashboard.</p>
          </div>
        </section>
      )}

      {accountType === 'OWNER' && status === 'PENDING' && (
        <section className="owner-panel warning-owner-panel">
          <p className="eyebrow">Pending Approval</p>
          <h2>Your application has been submitted successfully and is waiting for administrator approval.</h2>
          <button
            className="outline-button mt-5"
            type="button"
            onClick={() => setShowOwnerApplicationDetail((value) => !value)}
          >
            {showOwnerApplicationDetail ? 'Hide Submitted Application' : 'View Submitted Application'}
          </button>
        </section>
      )}

      {accountType === 'OWNER' && status === 'PENDING' && showOwnerApplicationDetail && (
        <OwnerApplicationDetail application={ownerApplication} />
      )}

      {accountType === 'OWNER' && status === 'REJECTED' && (
        <section className="owner-panel">
          <p className="eyebrow">Rejected</p>
          <h2>Your Owner application has been rejected.</h2>
          <p>Please review the reason below and submit a new application.</p>
          <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
            {ownerApplication.rejectReason || 'Reject reason is not available.'}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="primary-button owner-hero-action" type="button" onClick={onOpenAgain}>
              Apply Again
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => setShowOwnerApplicationDetail((value) => !value)}
            >
              {showOwnerApplicationDetail ? 'Hide Application' : 'View Application'}
            </button>
          </div>
        </section>
      )}

      {accountType === 'OWNER' && status === 'REJECTED' && showOwnerApplicationDetail && (
        <OwnerApplicationDetail application={ownerApplication} />
      )}

      {accountType === 'OWNER' && status === 'APPROVED' && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Approved</p>
            <h2>Congratulations! Your Owner application has been approved.</h2>
            <p>You can now register horses, manage your horse stable, and prepare race registrations.</p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button">Register Horse</button>
            <button className="outline-button owner-hero-action" type="button">My Horses</button>
            <button className="outline-button owner-hero-action" type="button">Race Registration</button>
          </div>
        </section>
      )}
    </section>
  );
}

export default function UserPanel({ user, onLogout }) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('vnp_TxnRef') || params.has('vnp_SecureHash')) return 'wallet';
    return params.get('section') || 'dashboard';
  });
  const [ownerApplication, setOwnerApplication] = useState(null);
  const [jockeyApplication, setJockeyApplication] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isJockeyFormOpen, setIsJockeyFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ownerFormError, setOwnerFormError] = useState('');
  const [jockeyFormError, setJockeyFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingJockey, setIsSubmittingJockey] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileName = user?.fullName || user?.email || 'Spectator';
  const role = getUserRole(user) || 'SPECTATOR';
  const accountType = String(user?.accountType || role).toUpperCase();
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.accountTypes || item.accountTypes.includes(accountType)),
    [accountType]
  );

  const notifications = useMemo(() => {
    if (ownerApplication?.status === 'APPROVED') {
      return ['Your Owner application has been approved.'];
    }

    if (ownerApplication?.status === 'REJECTED') {
      return [`Your Owner application has been rejected. Reason: ${ownerApplication.rejectReason || 'No reason provided.'}`];
    }

    if (ownerApplication?.status === 'PENDING') {
      return ['Your Owner application is waiting for administrator approval.'];
    }

    if (jockeyApplication?.verificationStatus === 'PENDING') {
      return ['Your Jockey application is waiting for administrator approval.'];
    }

    if (getKycStatus(kyc) === 'IN_REVIEW') {
      return ['Didit is reviewing your identity verification.'];
    }

    if (getKycStatus(kyc) === 'REJECTED') {
      return [`Your KYC has been rejected. Reason: ${kyc.rejectionReason || 'No reason provided.'}`];
    }

    return ['No new notifications.'];
  }, [ownerApplication, jockeyApplication, kyc]);

  async function loadOwnerApplication() {
    setIsLoadingApplication(true);
    setError('');

    try {
      const [ownerResult, jockeyResult, kycResult] = await Promise.allSettled([
        accountType === 'OWNER' ? getMyOwnerApplication(user) : Promise.resolve(null),
        accountType === 'JOCKEY' ? getMyJockeyVerification() : Promise.resolve(null),
        getMyKyc()
      ]);

      if (ownerResult.status === 'fulfilled') {
        setOwnerApplication(ownerResult.value);
      } else {
        setOwnerApplication(null);
      }

      if (jockeyResult.status === 'fulfilled') {
        setJockeyApplication(jockeyResult.value);
      } else if (jockeyResult.reason?.status === 404) {
        setJockeyApplication(null);
      } else {
        throw jockeyResult.reason;
      }

      if (kycResult.status === 'fulfilled') {
        setKyc(kycResult.value);
      } else {
        setKyc(null);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải trạng thái Owner application.');
    } finally {
      setIsLoadingApplication(false);
    }
  }

  useEffect(() => {
    loadOwnerApplication();
  }, [user?.userID, user?.id, accountType]);

  async function handleSubmitApplication(values) {
    setIsSubmitting(true);
    setOwnerFormError('');
    setMessage('');

    try {
      const application = await submitOwnerApplication(user, values);
      setOwnerApplication(application);
      setIsFormOpen(false);
      setActiveSection('profile');
      setMessage('Your Owner Application has been submitted and is pending Admin review.');
    } catch (err) {
      setOwnerFormError(err.message || 'Không thể gửi Owner application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBecomeJockey() {
    if (jockeyApplication?.verificationStatus === 'PENDING' || jockeyApplication?.verificationStatus === 'APPROVED') {
      setActiveSection('profile');
      return;
    }

    setIsJockeyFormOpen(true);
  }

  async function handleSubmitJockeyApplication(values) {
    setIsSubmittingJockey(true);
    setJockeyFormError('');
    setMessage('');

    try {
      const { kyc: _kycValues, ...jockeyValues } = values;
      const application = jockeyApplication?.verificationStatus === 'REJECTED'
        ? await resubmitJockeyVerification(jockeyApplication.verificationId, jockeyValues)
        : await submitJockeyVerification(jockeyValues);

      setJockeyApplication(application);
      setIsJockeyFormOpen(false);
      setActiveSection('profile');
      setMessage('Jockey application submitted successfully. Please wait for admin approval, then sign in again after approval.');
    } catch (err) {
      setJockeyFormError(err.message || 'Cannot submit Jockey application.');
    } finally {
      setIsSubmittingJockey(false);
    }
  }

  function renderSection() {
    if (activeSection === 'dashboard') {
      return <DashboardHome accountType={accountType} onGoProfile={() => setActiveSection('profile')} />;
    }

    if (activeSection === 'profile') {
      return (
        <ProfileSection
          user={user}
          ownerApplication={ownerApplication}
          jockeyApplication={jockeyApplication}
          kyc={kyc}
          isLoading={isLoadingApplication}
          onOpenApplication={() => setIsFormOpen(true)}
          onOpenAgain={() => setIsFormOpen(true)}
          onBecomeJockey={handleBecomeJockey}
          onOpenKyc={() => setActiveSection('wallet')}
        />
      );
    }

    if (activeSection === 'horses') {
      return <PlaceholderSection title="Horses" message="Browse horse profiles and race-card information." icon="🐎" />;
    }

    if (activeSection === 'races') {
      return <PlaceholderSection title="Races" message="View upcoming and current races." icon="🏁" />;
    }

    if (activeSection === 'betting' && accountType === 'SPECTATOR') {
      return <BettingPanel />;
    }

    if (activeSection === 'wallet') {
      return <WalletTransferPanel currentUser={user} role={accountType} />;
    }

    return <PlaceholderSection title="Results" message="Race results and standings will be connected later." icon="🏆" />;
  }

  return (
    <main className="owner-shell">
      <aside className="owner-sidebar">
        <div className="owner-brand">
          <div className="owner-logo">🏇</div>
          <div>
            <strong>Horse Racing</strong>
            <span>{formatDisplayLabel(accountType)} Account</span>
          </div>
        </div>

        <nav className="owner-nav" aria-label={`${formatDisplayLabel(accountType)} navigation`}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;
            const label = item.labelKey ? t(item.labelKey) : item.label;

            return (
              <button
                key={item.key}
                className={active ? 'owner-nav-item active' : 'owner-nav-item'}
                type="button"
                onClick={() => setActiveSection(item.key)}
              >
                <span><Icon size={16} /></span>
                {label}
              </button>
            );
          })}
        </nav>

        <div className="owner-profile-card">
          <span>Signed in as</span>
          <strong>{profileName}</strong>
          <small>{formatDisplayLabel(accountType)}</small>
        </div>

        <button className="owner-logout" type="button" onClick={onLogout}>
          Sign Out
        </button>
      </aside>

      <section className="owner-main">
        <header className="owner-topbar">
          <div>
            <p className="eyebrow">Horse Racing</p>
            <h1>{activeSection === 'profile' ? 'Profile' : `${formatDisplayLabel(accountType)} Dashboard`}</h1>
            <p>{accountType === 'SPECTATOR'
              ? 'Explore races and use betting after KYC verification.'
              : `Complete your ${formatDisplayLabel(accountType)} application to unlock professional features.`}</p>
          </div>

          <div className="relative flex flex-wrap items-center justify-end gap-3">
            <LanguageToggle />
            <div className="hidden items-center gap-2 rounded-2xl border border-brown-700/10 bg-white/70 px-3 py-2 font-bold text-slate-500 md:flex">
              <Search size={16} />
              Search mock data
            </div>
            <button
              className="refresh-button relative"
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <Bell size={17} />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-14 z-20 w-80 rounded-2xl border border-brown-700/10 bg-white p-4 shadow-[0_18px_50px_rgba(43,23,16,0.18)]">
                <strong className="block text-brown-900">Notifications</strong>
                <div className="mt-3 grid gap-2">
                  {notifications.map((item) => (
                    <p className="rounded-xl bg-cream-200/60 px-3 py-2 text-sm font-bold text-brown-700" key={item}>{item}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}

        {renderSection()}
      </section>

      {accountType === 'OWNER' && isFormOpen && (
        <OwnerApplicationForm
          user={user}
          application={ownerApplication}
          kyc={kyc}
          formError={ownerFormError}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setOwnerFormError('');
            setIsFormOpen(false);
          }}
          onSubmit={handleSubmitApplication}
        />
      )}

      {accountType === 'JOCKEY' && isJockeyFormOpen && (
        <JockeyApplicationForm
          user={user}
          application={jockeyApplication}
          kyc={kyc}
          mode={jockeyApplication?.verificationStatus === 'REJECTED' ? 'resubmit' : 'submit'}
          formError={jockeyFormError}
          isSubmitting={isSubmittingJockey}
          onCancel={() => {
            setJockeyFormError('');
            setIsJockeyFormOpen(false);
          }}
          onSubmit={handleSubmitJockeyApplication}
        />
      )}

    </main>
  );
}
