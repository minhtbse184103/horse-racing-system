import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CircleDollarSign,
  Flag,
  Gauge,
  Home,
  Medal,
  Search,
  Trophy,
  UserRound
} from 'lucide-react';
import OwnerApplicationForm from '../profile/OwnerApplicationForm';
import JockeyApplicationForm from '../profile/JockeyApplicationForm';
import StatCard from '../common/StatCard';
import LanguageToggle from '../common/LanguageToggle';
import { formatDate, formatDisplayLabel, getUserRole } from '../../lib';
import { getMyOwnerApplication, submitOwnerApplication } from '../../services/ownerApplicationService';
import {
  getMyJockeyVerification,
  resubmitJockeyVerification,
  submitJockeyVerification
} from '../../services/jockeyVerificationService';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'horses', label: 'Horses', icon: Trophy },
  { key: 'races', label: 'Races', icon: Flag },
  { key: 'betting', label: 'Betting', icon: CircleDollarSign },
  { key: 'results', label: 'Results', icon: Medal },
  { key: 'profile', label: 'Profile', icon: UserRound }
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

function EmptyState({ title, message }) {
  return (
    <div className="rounded-[24px] border border-dashed border-brown-700/20 bg-white/60 p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream-200 text-2xl">🏇</div>
      <h3 className="mt-4 text-xl font-black text-brown-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl font-medium text-slate-500">{message}</p>
    </div>
  );
}

function DashboardHome({ onGoProfile, onBecomeJockey }) {
  return (
    <section className="owner-stack">
      <section className="owner-stats-grid">
        <StatCard label="Total Horses" value={248} description="Published horse profiles" highlight />
        <StatCard label="Upcoming Races" value={12} description="Open schedule for spectators" />
        <StatCard label="Today's Races" value={4} description="Races running today" />
        <StatCard label="Betting Overview" value="Mock" description="UI placeholder for future API" />
      </section>

      <section className="owner-overview-grid">
        <div className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Spectator Dashboard</p>
            <h2>Premium race-day command center</h2>
            <p>
              Track horses, upcoming races, betting summaries, and results from one clean dashboard. Become an Owner from your profile when you are ready to register horses.
            </p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button" onClick={onGoProfile}>
              Become an Owner
            </button>
            <button className="outline-button owner-hero-action" type="button" onClick={onBecomeJockey}>
              Become a Jockey
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
          <h3 className="text-xl font-black text-brown-900">Personal Information</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ApplicationDetailItem label="Full Name" value={application.fullName} />
            <ApplicationDetailItem label="Date of Birth" value={formatDate(application.dateOfBirth)} />
            <ApplicationDetailItem label="Gender" value={application.gender} />
            <ApplicationDetailItem label="Nationality" value={application.nationality} />
            <ApplicationDetailItem label="Address" value={application.address} />
            <ApplicationDocumentLink label="Identity Document" url={application.identityDocumentUrl} />
          </div>
        </div>

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

function ProfileSection({ user, ownerApplication, jockeyApplication, isLoading, onOpenApplication, onOpenAgain, onBecomeJockey }) {
  const role = getUserRole(user) || 'SPECTATOR';
  const status = ownerApplication?.status || null;
  const jockeyStatus = jockeyApplication?.verificationStatus || null;
  const [showOwnerApplicationDetail, setShowOwnerApplicationDetail] = useState(false);

  const detailRows = [
    ['Username', user?.username || user?.fullName || 'Chưa cập nhật'],
    ['Email', user?.email || 'Chưa cập nhật'],
    ['Phone Number', user?.phone || 'Chưa cập nhật'],
    ['Role', <span className="role-badge" key="role">{formatDisplayLabel(role)}</span>],
    ['Owner Status', <StatusBadge key="status" status={status} />],
    ['Jockey Status', <StatusBadge key="jockey-status" status={jockeyStatus} />]
  ];

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
              {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="eyebrow">Profile</p>
              <h2>{user?.fullName || user?.email}</h2>
              <p>Manage account information and Owner application status.</p>
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

      {!status && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Not Registered</p>
            <h2>You are currently registered as a Spectator.</h2>
            <p>Become an Owner to register horses, or apply as a Jockey to receive race invitations after admin approval.</p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button" onClick={onOpenApplication}>
              Become an Owner
            </button>
            <button className="outline-button owner-hero-action" type="button" onClick={onBecomeJockey}>
              {jockeyStatus === 'REJECTED' ? 'Apply Again as Jockey' : 'Become a Jockey'}
            </button>
          </div>
        </section>
      )}

      {jockeyStatus === 'PENDING' && (
        <section className="owner-panel warning-owner-panel">
          <p className="eyebrow">Jockey Pending Approval</p>
          <h2>Your Jockey application has been submitted and is waiting for administrator approval.</h2>
          <p>After admin approval, sign out and sign in again to enter the Jockey dashboard.</p>
          <button className="outline-button mt-5" type="button" disabled>
            Waiting For Approval
          </button>
        </section>
      )}

      {jockeyStatus === 'REJECTED' && (
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

      {jockeyStatus === 'APPROVED' && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Jockey Approved</p>
            <h2>Your Jockey application has been approved.</h2>
            <p>Sign out and sign in again so the app can load your new Jockey role and dashboard.</p>
          </div>
        </section>
      )}

      {status === 'PENDING' && (
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

      {status === 'PENDING' && showOwnerApplicationDetail && (
        <OwnerApplicationDetail application={ownerApplication} />
      )}

      {status === 'REJECTED' && (
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

      {status === 'REJECTED' && showOwnerApplicationDetail && (
        <OwnerApplicationDetail application={ownerApplication} />
      )}

      {status === 'APPROVED' && (
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
  const [activeSection, setActiveSection] = useState('dashboard');
  const [ownerApplication, setOwnerApplication] = useState(null);
  const [jockeyApplication, setJockeyApplication] = useState(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isJockeyFormOpen, setIsJockeyFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingJockey, setIsSubmittingJockey] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileName = user?.fullName || user?.email || 'Spectator';
  const role = getUserRole(user) || 'SPECTATOR';

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

    return ['No new notifications.'];
  }, [ownerApplication, jockeyApplication]);

  async function loadOwnerApplication() {
    setIsLoadingApplication(true);
    setError('');

    try {
      const [ownerResult, jockeyResult] = await Promise.allSettled([
        getMyOwnerApplication(user),
        getMyJockeyVerification()
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
    } catch (err) {
      setError(err.message || 'Không thể tải trạng thái Owner application.');
    } finally {
      setIsLoadingApplication(false);
    }
  }

  useEffect(() => {
    loadOwnerApplication();
  }, [user?.userID, user?.id]);

  async function handleSubmitApplication(values) {
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const application = await submitOwnerApplication(user, values);
      setOwnerApplication(application);
      setIsFormOpen(false);
      setActiveSection('profile');
      setMessage('Your Owner Application has been submitted and is pending Admin review.');
    } catch (err) {
      setError(err.message || 'Không thể gửi Owner application.');
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
    setError('');
    setMessage('');

    try {
      const application = jockeyApplication?.verificationStatus === 'REJECTED'
        ? await resubmitJockeyVerification(jockeyApplication.verificationId, values)
        : await submitJockeyVerification(values);

      setJockeyApplication(application);
      setIsJockeyFormOpen(false);
      setActiveSection('profile');
      setMessage('Jockey application submitted successfully. Please wait for admin approval, then sign in again after approval.');
    } catch (err) {
      setError(err.message || 'Cannot submit Jockey application.');
    } finally {
      setIsSubmittingJockey(false);
    }
  }

  function renderSection() {
    if (activeSection === 'dashboard') {
      return <DashboardHome onGoProfile={() => setActiveSection('profile')} onBecomeJockey={handleBecomeJockey} />;
    }

    if (activeSection === 'profile') {
      return (
        <ProfileSection
          user={user}
          ownerApplication={ownerApplication}
          jockeyApplication={jockeyApplication}
          isLoading={isLoadingApplication}
          onOpenApplication={() => setIsFormOpen(true)}
          onOpenAgain={() => setIsFormOpen(true)}
          onBecomeJockey={handleBecomeJockey}
        />
      );
    }

    if (activeSection === 'horses') {
      return <PlaceholderSection title="Horses" message="Browse horse profiles and race-card information." icon="🐎" />;
    }

    if (activeSection === 'races') {
      return <PlaceholderSection title="Races" message="View upcoming and current races." icon="🏁" />;
    }

    if (activeSection === 'betting') {
      return <PlaceholderSection title="Betting" message="Betting overview placeholder for the future backend." icon="💰" />;
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
            <span>Spectator Dashboard</span>
          </div>
        </div>

        <nav className="owner-nav" aria-label="Spectator navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;

            return (
              <button
                key={item.key}
                className={active ? 'owner-nav-item active' : 'owner-nav-item'}
                type="button"
                onClick={() => setActiveSection(item.key)}
              >
                <span><Icon size={16} /></span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="owner-profile-card">
          <span>Signed in as</span>
          <strong>{profileName}</strong>
          <small>{formatDisplayLabel(role)}</small>
        </div>

        <button className="owner-logout" type="button" onClick={onLogout}>
          Sign Out
        </button>
      </aside>

      <section className="owner-main">
        <header className="owner-topbar">
          <div>
            <p className="eyebrow">Horse Racing</p>
            <h1>{activeSection === 'profile' ? 'Profile' : 'Spectator Dashboard'}</h1>
            <p>Explore races as a Spectator and apply to become an Owner when ready.</p>
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

      {isFormOpen && (
        <OwnerApplicationForm
          user={user}
          application={ownerApplication}
          isSubmitting={isSubmitting}
          onCancel={() => setIsFormOpen(false)}
          onSubmit={handleSubmitApplication}
        />
      )}

      {isJockeyFormOpen && (
        <JockeyApplicationForm
          user={user}
          application={jockeyApplication}
          mode={jockeyApplication?.verificationStatus === 'REJECTED' ? 'resubmit' : 'submit'}
          isSubmitting={isSubmittingJockey}
          onCancel={() => setIsJockeyFormOpen(false)}
          onSubmit={handleSubmitJockeyApplication}
        />
      )}
    </main>
  );
}
