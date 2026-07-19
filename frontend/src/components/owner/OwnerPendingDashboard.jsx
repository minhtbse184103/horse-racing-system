import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CircleDot,
  FileCheck2,
  Gauge,
  List,
  LockKeyhole,
  Trophy,
  UserRound
} from 'lucide-react';
import AppShell from '../common/AppShell';
import OwnerApplicationForm from '../profile/OwnerApplicationForm';
import { getMyOwnerApplication, submitOwnerApplication } from '../../services/ownerApplicationService';
import { formatDate, formatDisplayLabel } from '../../lib';
import { useLanguage } from '../../context/LanguageContext';

function applicationStatus(application) {
  return String(application?.status || 'NOT_SUBMITTED').toUpperCase();
}

function StatusBadge({ status }) {
  const normalized = String(status || 'NOT_SUBMITTED').toLowerCase();
  return <span className={`status-badge ${normalized}`}>{formatDisplayLabel(status || 'NOT_SUBMITTED')}</span>;
}

function Detail({ label, value, fallback = 'Not updated' }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || fallback}</strong>
    </div>
  );
}

function DocumentLink({ label, url, t }) {
  return (
    <Detail
      label={label}
      value={url ? <a className="table-button" href={url} target="_blank" rel="noreferrer">{t('ownerPendingViewDocument')}</a> : t('ownerPendingNotUploaded')}
      fallback={t('notUpdated')}
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
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    return ['overview', 'application', 'profile'].includes(section) ? section : 'overview';
  });
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const status = applicationStatus(application);
  const profileName = currentUser?.fullName || currentUser?.username || currentUser?.email || 'Owner';
  const lockedReason = t('ownerPendingLockedReason');
  const navItems = useMemo(() => [
    { key: 'overview', labelKey: 'ownerNavOverview', icon: Gauge },
    { key: 'horses', labelKey: 'ownerNavHorses', icon: List, disabled: true, disabledReason: lockedReason },
    { key: 'register', labelKey: 'ownerPendingCompetitions', icon: Trophy, disabled: true, disabledReason: lockedReason },
    { key: 'application', labelKey: 'ownerPendingApplication', icon: FileCheck2 },
    { key: 'profile', labelKey: 'ownerNavProfile', icon: UserRound }
  ], [lockedReason]);

  const applicationCopy = {
    NOT_SUBMITTED: {
      eyebrow: t('ownerPendingOnboarding'),
      title: t('ownerPendingCompleteApplication'),
      description: t('ownerPendingCompleteDesc'),
      action: t('ownerPendingSubmitApplication')
    },
    PENDING: {
      eyebrow: t('ownerPendingUnderReview'),
      title: t('ownerPendingDocumentsReview'),
      description: t('ownerPendingReviewDesc'),
      action: t('ownerPendingViewApplication')
    },
    REJECTED: {
      eyebrow: t('ownerPendingChangesRequired'),
      title: t('ownerPendingUpdateApplication'),
      description: application?.rejectReason || t('ownerPendingReviewFeedback'),
      action: t('ownerPendingUpdateApplication')
    },
    APPROVED: {
      eyebrow: t('ownerPendingApprovedEyebrow'),
      title: t('ownerPendingApprovedTitle'),
      description: t('ownerPendingApprovedDesc'),
      action: t('ownerPendingSignOutAgain')
    }
  }[status] || null;

  async function loadOverview() {
    setIsLoading(true);
    setError('');

    const [applicationResult] = await Promise.allSettled([getMyOwnerApplication()]);

    if (applicationResult.status === 'fulfilled') {
      setApplication(applicationResult.value);
    } else if (applicationResult.reason?.status === 404) {
      setApplication(null);
    } else if (applicationResult.reason?.status !== 404) {
      setError(applicationResult.reason?.message || t('ownerPendingLoadError'));
    }

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
      setMessage(t('ownerPendingSubmitSuccess'));
    } catch (err) {
      setFormError(err?.message || t('ownerPendingSubmitError'));
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
    if (isLoading) return <div className="admin-alert success" role="status">{t('ownerPendingLoadingApplication')}</div>;

    return (
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">{t('ownerPendingApplication')}</p>
            <h2>{applicationCopy?.title}</h2>
            <p>{applicationCopy?.description}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {application && (
          <div className="grid gap-3 md:grid-cols-2">
            <Detail label={t('ownerProfileStableName')} value={application.stableName} fallback={t('notUpdated')} />
            <Detail label={t('ownerProfileStableAddress')} value={application.stableAddress} fallback={t('notUpdated')} />
            <Detail label={t('ownerProfileTotalHorses')} value={application.totalHorsesOwned} fallback={t('notUpdated')} />
            <Detail label={t('ownerPendingSubmittedAt')} value={formatDate(application.submittedAt)} fallback={t('notUpdated')} />
            <DocumentLink label={t('ownerPendingStableCertificate')} url={application.stableCertificateUrl} t={t} />
            <DocumentLink label={t('ownerPendingOwnershipProof')} url={application.horseOwnershipProofUrl} t={t} />
            {application.reviewedAt && <Detail label={t('ownerPendingReviewedAt')} value={formatDate(application.reviewedAt)} fallback={t('notUpdated')} />}
            {application.rejectReason && <Detail label={t('ownerPendingRejectionReason')} value={application.rejectReason} fallback={t('notUpdated')} />}
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

        <section className="owner-stats-grid" aria-label={t('ownerPendingStatusSummary')}>
          <div className="owner-stat-card highlight">
            <span>{t('ownerPendingApplication')}</span>
            <strong className="text-2xl"><StatusBadge status={status} /></strong>
            <small>{application?.submittedAt ? t('ownerPendingApplicationSubmitted', { date: formatDate(application.submittedAt) }) : t('ownerPendingDocumentsRequired')}</small>
          </div>
        </section>

        <section className="owner-overview-grid">
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div><p className="eyebrow">{t('ownerPendingActivationProgress')}</p><h2>{t('ownerPendingUnlockFeatures')}</h2><p>{t('ownerPendingIndependentReview')}</p></div>
            </div>
            <ol className="m-0 list-none p-0">
              <ActivationStep complete title={t('ownerPendingAccountCreated')} description={t('ownerPendingAccountCreatedDesc')} />
              <ActivationStep complete={submitted} current={!submitted} title={t('ownerPendingApplicationSubmittedStep')} description={t('ownerPendingApplicationSubmittedDesc')} />
              <ActivationStep complete={approved} current={status === 'PENDING'} title={t('ownerPendingAdminApproval')} description={t('ownerPendingAdminApprovalDesc')} />
              <ActivationStep complete={false} current={approved} title={t('ownerPendingFeaturesUnlocked')} description={t('ownerPendingFeaturesUnlockedDesc')} />
            </ol>
          </section>

          <section className="owner-panel compact-panel">
            <div className="owner-panel-header">
              <div><p className="eyebrow">{t('ownerPendingAfterApproval')}</p><h2>{t('ownerPendingAvailableTools')}</h2><p>{t('ownerPendingToolsLocked')}</p></div>
            </div>
            <div className="owner-mini-list">
              <div><span>{t('ownerPendingManageHorseProfiles')}</span><LockKeyhole size={18} aria-hidden="true" /></div>
              <div><span>{t('ownerPendingRegisterCompetitions')}</span><LockKeyhole size={18} aria-hidden="true" /></div>
              <div><span>{t('ownerPendingManageInvitations')}</span><LockKeyhole size={18} aria-hidden="true" /></div>
            </div>
          </section>
        </section>
      </section>
    );
  }

  function renderContent() {
    if (activeSection === 'application') return renderApplication();
    if (activeSection === 'profile') {
      return (
        <section className="owner-stack">
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div><p className="eyebrow">{t('ownerProfileAccountInfo')}</p><h2>{profileName}</h2><p>{t('ownerPendingProfileDesc')}</p></div>
              <StatusBadge status={status} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Detail label={t('username')} value={currentUser?.username || currentUser?.fullName} fallback={t('notUpdated')} />
              <Detail label={t('email')} value={currentUser?.email} fallback={t('notUpdated')} />
              <Detail label={t('phone')} value={currentUser?.phone} fallback={t('notUpdated')} />
              <Detail label={t('ownerPendingAccountType')} value="Owner" fallback={t('notUpdated')} />
              <Detail label={t('ownerPendingOwnerAccess')} value={formatDisplayLabel(status)} fallback={t('notUpdated')} />
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
      title={t('ownerPendingWelcome', { name: profileName })}
      subtitle={t('ownerPendingSubtitle')}
      profileName={profileName}
      profileRole={t('ownerPendingProfileRole', { status: formatDisplayLabel(status) })}
      activeSection={activeSection}
      navItems={navItems}
      onNavigate={setActiveSection}
      onLogout={onLogout}
      headerAction={<button className="refresh-button" type="button" onClick={loadOverview} disabled={isLoading}>{isLoading ? t('loading') : t('ownerPendingRefreshStatus')}</button>}
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
