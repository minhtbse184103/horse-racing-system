import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CircleDot,
  FileCheck2,
  Gauge,
  List,
  LockKeyhole,
  UserRound,
  Wallet
} from 'lucide-react';
import AppShell from '../common/AppShell';
import JockeyApplicationForm from '../profile/JockeyApplicationForm';
import WalletTransferPanel from '../payment/WalletTransferPanel';
import {
  getMyJockeyVerification,
  resubmitJockeyVerification,
  submitJockeyVerification
} from '../../services/jockeyVerificationService';
import { getMyKyc } from '../../services/kycService';
import { getMyWallet } from '../../services/walletService';
import { formatDate, formatDisplayLabel } from '../../lib';
import { useLanguage } from '../../context/LanguageContext';

const pendingCopy = {
  vi: {
    notUpdated: 'Chưa cập nhật', lockedReason: 'Khả dụng sau khi hồ sơ Jockey được quản trị viên phê duyệt.', overview: 'Tổng quan', professionalProfile: 'Hồ sơ nghề nghiệp', invitations: 'Lời mời thi đấu', application: 'Hồ sơ Jockey', account: 'Tài khoản',
    NOT_SUBMITTED: ['Bắt đầu với Jockey', 'Hoàn tất hồ sơ Jockey', 'Cung cấp giấy phép và thông tin huấn luyện viên để quản trị viên xét duyệt.', 'Gửi hồ sơ Jockey'],
    PENDING: ['Hồ sơ đang được xét duyệt', 'Tài liệu Jockey của bạn đang được kiểm tra', 'Các tính năng nghề nghiệp sẽ bị khóa cho đến khi quản trị viên phê duyệt hồ sơ.', 'Xem hồ sơ đã gửi'],
    REJECTED: ['Cần chỉnh sửa', 'Cập nhật và gửi lại hồ sơ Jockey', 'Xem phản hồi của quản trị viên và chỉnh sửa tài liệu.', 'Cập nhật hồ sơ'],
    APPROVED: ['Hồ sơ đã được phê duyệt', 'Quyền truy cập Jockey đã sẵn sàng', 'Đăng nhập lại để làm mới quyền truy cập và mở khóa các tính năng nghề nghiệp.', 'Đăng xuất và đăng nhập lại'],
    fallback: ['Bắt đầu với Jockey', 'Kiểm tra hồ sơ Jockey', 'Làm mới trang để xem trạng thái xét duyệt mới nhất.', 'Xem hồ sơ'],
    loadError: 'Không thể tải hồ sơ Jockey.', submitSuccess: 'Đã gửi hồ sơ Jockey. Vui lòng chờ quản trị viên xét duyệt.', submitError: 'Không thể gửi hồ sơ Jockey.', loadingApplication: 'Đang tải hồ sơ Jockey...', applicant: 'Người đăng ký', trainer: 'Huấn luyện viên', trainerEmail: 'Email huấn luyện viên', academyAddress: 'Học viện / Địa chỉ chuồng ngựa', issuingAuthority: 'Cơ quan cấp phép', licenceType: 'Loại giấy phép', licenceExpiry: 'Ngày hết hạn giấy phép', weight: 'Cân nặng', submittedAt: 'Ngày gửi', rejectionReason: 'Lý do từ chối', licenceDocument: 'Tài liệu giấy phép {{number}}', viewDocument: 'Xem tài liệu', accountStatus: 'Trạng thái tài khoản Jockey', professionalReview: 'Xét duyệt giấy phép nghề nghiệp', activationProgress: 'Tiến trình kích hoạt', unlockFeatures: 'Mở khóa tính năng Jockey', featuresAfterApproval: 'Các tính năng nghề nghiệp khả dụng sau khi quản trị viên phê duyệt.', accountCreated: 'Đã tạo tài khoản Jockey', accountCreatedDesc: 'Bạn có thể đăng nhập và truy cập cổng Jockey.', applicationSubmitted: 'Đã gửi hồ sơ Jockey', applicationSubmittedDesc: 'Cần cung cấp giấy phép và thông tin huấn luyện viên.', adminApproval: 'Quản trị viên phê duyệt', adminApprovalDesc: 'Quản trị viên xem xét các tài liệu nghề nghiệp.', featuresUnlocked: 'Đã mở khóa tính năng Jockey', featuresUnlockedDesc: 'Đăng nhập lại sau khi được duyệt để làm mới quyền truy cập.', afterApproval: 'Sau khi phê duyệt', availableTools: 'Công cụ Jockey khả dụng', toolsLocked: 'Các công cụ này bị khóa cho đến khi hồ sơ nghề nghiệp được phê duyệt.', manageProfile: 'Quản lý hồ sơ nghề nghiệp', reviewInvitations: 'Xem lời mời thi đấu', decideInvitations: 'Chấp nhận hoặc từ chối lời mời', accountInfo: 'Thông tin tài khoản', accountActive: 'Tài khoản vẫn hoạt động trong khi quyền truy cập nghề nghiệp được xét duyệt.', username: 'Tên đăng nhập', email: 'Email', phone: 'Số điện thoại', accountType: 'Loại tài khoản', jockeyAccess: 'Quyền truy cập Jockey', welcome: 'Xin chào, {{name}}', subtitle: 'Trạng thái tài khoản và quyền truy cập nghề nghiệp Jockey.', accessRole: 'Quyền Jockey: {{status}}', loading: 'Đang tải...', refresh: 'Làm mới trạng thái'
  },
  en: {
    notUpdated: 'Not updated', lockedReason: 'Available after the Jockey application is approved by an administrator.', overview: 'Overview', professionalProfile: 'Professional Profile', invitations: 'Race Invitations', application: 'Jockey Application', account: 'Account',
    NOT_SUBMITTED: ['Jockey onboarding', 'Complete your Jockey application', 'Provide your licence and trainer information for administrator review.', 'Submit Jockey Application'], PENDING: ['Application under review', 'Your Jockey documents are being reviewed', 'Professional features remain locked until an administrator approves the application.', 'View Submitted Application'], REJECTED: ['Changes required', 'Update and resubmit your Jockey application', 'Review the administrator feedback and correct your documents.', 'Update Application'], APPROVED: ['Application approved', 'Your Jockey access is ready', 'Sign in again to refresh your access token and unlock professional features.', 'Sign Out and Sign In Again'], fallback: ['Jockey onboarding', 'Check your Jockey application', 'Refresh the page to get the latest review status.', 'View Application'],
    loadError: 'Unable to load the Jockey application.', submitSuccess: 'Jockey application submitted. Please wait for administrator review.', submitError: 'Unable to submit the Jockey application.', loadingApplication: 'Loading Jockey application...', applicant: 'Applicant', trainer: 'Trainer', trainerEmail: 'Trainer Email', academyAddress: 'Academy / Stable Address', issuingAuthority: 'Issuing Authority', licenceType: 'Licence Type', licenceExpiry: 'Licence Expiry', weight: 'Weight', submittedAt: 'Submitted At', rejectionReason: 'Rejection Reason', licenceDocument: 'Licence Document {{number}}', viewDocument: 'View document', accountStatus: 'Jockey account status', professionalReview: 'Professional licence review', activationProgress: 'Activation progress', unlockFeatures: 'Unlock Jockey features', featuresAfterApproval: 'Professional features become available after administrator approval.', accountCreated: 'Jockey account created', accountCreatedDesc: 'You can sign in and access the Jockey portal.', applicationSubmitted: 'Jockey application submitted', applicationSubmittedDesc: 'Licence and trainer information are required.', adminApproval: 'Administrator approval', adminApprovalDesc: 'An administrator reviews the professional documents.', featuresUnlocked: 'Jockey features unlocked', featuresUnlockedDesc: 'Sign in again after approval to refresh your access token.', afterApproval: 'After approval', availableTools: 'Available Jockey tools', toolsLocked: 'These tools stay locked until professional approval.', manageProfile: 'Manage professional profile', reviewInvitations: 'Review race invitations', decideInvitations: 'Accept or reject invitations', accountInfo: 'Account information', accountActive: 'Your account remains active while professional access is reviewed.', username: 'Username', email: 'Email', phone: 'Phone Number', accountType: 'Account Type', jockeyAccess: 'Jockey Access', welcome: 'Welcome, {{name}}', subtitle: 'Jockey account and professional access status.', accessRole: 'Jockey access: {{status}}', loading: 'Loading...', refresh: 'Refresh status'
  }
};

function verificationStatus(application) {
  return String(application?.verificationStatus || 'NOT_SUBMITTED').toUpperCase();
}

function resourceStatus(resource, fallback) {
  return String(resource?.status || fallback).toUpperCase();
}

function StatusBadge({ status }) {
  const normalized = String(status || 'NOT_SUBMITTED').toLowerCase();
  return <span className={`status-badge ${normalized}`}>{formatDisplayLabel(status || 'NOT_SUBMITTED')}</span>;
}

function Detail({ label, value }) {
  const { language } = useLanguage();
  const emptyText = pendingCopy[language]?.notUpdated || pendingCopy.vi.notUpdated;
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || emptyText}</strong>
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
  const { language, t } = useLanguage();
  const c = pendingCopy[language] || pendingCopy.vi;
  const fill = (text, params = {}) => Object.entries(params).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, value), text);
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('vnp_TxnRef') || params.has('vnp_SecureHash')) return 'wallet';
    const section = params.get('section');
    return ['overview', 'application', 'account', 'wallet'].includes(section) ? section : 'overview';
  });
  const [application, setApplication] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const status = verificationStatus(application);
  const kycStatus = resourceStatus(kyc, 'NOT_SUBMITTED');
  const walletStatus = resourceStatus(wallet, 'NOT_OPENED');
  const profileName = currentUser?.fullName || currentUser?.username || currentUser?.email || 'Jockey';
  const lockedReason = c.lockedReason;
  const navItems = useMemo(() => [
    { key: 'overview', label: c.overview, icon: Gauge }, { key: 'professional-profile', label: c.professionalProfile, icon: UserRound, disabled: true, disabledReason: lockedReason }, { key: 'invitations', label: c.invitations, icon: List, disabled: true, disabledReason: lockedReason }, { key: 'application', label: c.application, icon: FileCheck2 }, { key: 'account', label: c.account, icon: UserRound }, { key: 'wallet', labelKey: 'wallet', icon: Wallet }
  ], [c, lockedReason]);

  const localized = c[status] || c.fallback;
  const copy = { eyebrow: localized[0], title: localized[1], description: status === 'REJECTED' && application?.rejectionReason ? application.rejectionReason : localized[2], action: localized[3] };

  async function loadStatus() {
    setIsLoading(true);
    setError('');
    const [applicationResult, kycResult, walletResult] = await Promise.allSettled([
      getMyJockeyVerification(),
      getMyKyc(),
      getMyWallet()
    ]);

    if (applicationResult.status === 'fulfilled') {
      setApplication(applicationResult.value);
    } else if (applicationResult.reason?.status === 404) {
      setApplication(null);
    } else {
      setError(applicationResult.reason?.message || c.loadError);
    }
    setKyc(kycResult.status === 'fulfilled' ? kycResult.value : null);
    setWallet(walletResult.status === 'fulfilled' ? walletResult.value : null);
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
      setMessage(c.submitSuccess);
    } catch (submitError) {
      setFormError(submitError?.message || c.submitError);
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
    if (isLoading) return <div className="admin-alert success" role="status">{c.loadingApplication}</div>;
    const files = Array.isArray(application?.files) ? application.files : [];
    return (
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div><p className="eyebrow">{c.application}</p><h2>{copy.title}</h2><p>{copy.description}</p></div>
          <StatusBadge status={status} />
        </div>
        {application && (
          <div className="grid gap-3 md:grid-cols-2">
            <Detail label={c.applicant} value={application.jockeyUsername} /><Detail label={c.trainer} value={application.trainerName} /><Detail label={c.trainerEmail} value={application.trainerEmail} /><Detail label={c.academyAddress} value={application.academyStableAddress} /><Detail label={c.issuingAuthority} value={application.issuingAuthority} /><Detail label={c.licenceType} value={formatDisplayLabel(application.licenceType)} /><Detail label={c.licenceExpiry} value={formatDate(application.expiryDate)} /><Detail label={c.weight} value={application.weight != null ? `${application.weight} kg` : null} /><Detail label={c.submittedAt} value={formatDate(application.submittedAt)} />
            {application.rejectionReason && <Detail label={c.rejectionReason} value={application.rejectionReason} />}
            {files.map((file, index) => (
              <Detail key={file.fileUrl || index} label={fill(c.licenceDocument, { number: index + 1 })} value={<a className="table-button" href={file.fileUrl} target="_blank" rel="noreferrer">{c.viewDocument}</a>} />
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
        <section className="owner-stats-grid" aria-label={c.accountStatus}>
          <div className="owner-stat-card highlight"><span>{c.application}</span><strong><StatusBadge status={status} /></strong><small>{c.professionalReview}</small></div>
          <div className="owner-stat-card"><span>{t('jockeyIdentityVerification')}</span><strong><StatusBadge status={kycStatus} /></strong><small>{t('jockeyKycHelp')}</small></div>
          <div className="owner-stat-card"><span>{t('wallet')}</span><strong><StatusBadge status={walletStatus} /></strong><small>{wallet ? t('ownerPendingWalletAvailable') : t('ownerPendingWalletNeedKyc')}</small></div>
        </section>
        <section className="owner-overview-grid">
          <section className="owner-panel">
            <div className="owner-panel-header"><div><p className="eyebrow">{c.activationProgress}</p><h2>{c.unlockFeatures}</h2><p>{t('jockeyKycHelp')}</p></div></div>
            <ol className="m-0 list-none p-0">
              <ActivationStep complete title={c.accountCreated} description={c.accountCreatedDesc} /><ActivationStep complete={submitted} current={!submitted} title={c.applicationSubmitted} description={c.applicationSubmittedDesc} /><ActivationStep complete={approved} current={status === 'PENDING'} title={c.adminApproval} description={c.adminApprovalDesc} /><ActivationStep complete={false} current={approved} title={c.featuresUnlocked} description={c.featuresUnlockedDesc} />
            </ol>
          </section>
          <section className="owner-panel compact-panel">
            <div className="owner-panel-header"><div><p className="eyebrow">{c.afterApproval}</p><h2>{c.availableTools}</h2><p>{c.toolsLocked}</p></div></div>
            <div className="owner-mini-list">
              <div><span>{c.manageProfile}</span><LockKeyhole size={18} /></div><div><span>{c.reviewInvitations}</span><LockKeyhole size={18} /></div><div><span>{c.decideInvitations}</span><LockKeyhole size={18} /></div>
            </div>
          </section>
        </section>
      </section>
    );
  }

  function renderContent() {
    if (activeSection === 'wallet') return <WalletTransferPanel currentUser={currentUser} role="JOCKEY" />;
    if (activeSection === 'application') return renderApplication();
    if (activeSection === 'account') {
      return (
        <section className="owner-panel">
          <div className="owner-panel-header"><div><p className="eyebrow">{c.accountInfo}</p><h2>{profileName}</h2><p>{c.accountActive}</p></div><StatusBadge status={status} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <Detail label={c.username} value={currentUser?.username || currentUser?.fullName} /><Detail label={c.email} value={currentUser?.email} /><Detail label={c.phone} value={currentUser?.phone} /><Detail label={c.accountType} value="Jockey" /><Detail label={c.jockeyAccess} value={formatDisplayLabel(status)} /><Detail label={t('ownerPendingKycStatus')} value={formatDisplayLabel(kycStatus)} />
          </div>
        </section>
      );
    }
    return renderOverview();
  }

  return (
    <AppShell
      variant="jockey"
      title={fill(c.welcome, { name: profileName })}
      subtitle={c.subtitle}
      profileName={profileName}
      profileRole={fill(c.accessRole, { status: formatDisplayLabel(status) })}
      activeSection={activeSection}
      navItems={navItems}
      onNavigate={setActiveSection}
      onLogout={onLogout}
      headerAction={<button className="refresh-button" type="button" onClick={loadStatus} disabled={isLoading}>{isLoading ? c.loading : c.refresh}</button>}
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
