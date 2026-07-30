import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Award, CalendarCheck2, ClipboardList, FileBadge2, Inbox, ShieldCheck, Trophy } from 'lucide-react';
import defaultJockeyAvatar from '../../assets/default-jockey-avatar.svg';
import AppShell from '../common/AppShell';
import ConfirmModal from '../common/ConfirmModal';
import JockeyPendingDashboard from './JockeyPendingDashboard';
import JockeyProfileView from './JockeyProfileView';
import JockeyRaces from './JockeyRaces';
import {
  acceptJockeyInvitation,
  createJockeyProfile,
  deactivateJockeyProfile,
  getJockeyInvitations,
  getJockeyInvitationDetail,
  getJockeyProfile,
  rejectJockeyInvitation,
  toJockeyProfilePayload,
  updateJockeyProfile
} from '../../services/jockeyService';

import { formatDate, formatDisplayLabel, getUserRole } from '../../lib';
import { formatVndCurrency } from '../../lib/eventFormatters';
import { useLanguage } from '../../context/LanguageContext';

const jockeyNavItems = [
  { key: 'overview', labelKey: 'jockeyNavOverview', icon: '📊' },
  { key: 'profile', labelKey: 'jockeyNavProfile', icon: '🧑‍✈️' },
  { key: 'invitations', labelKey: 'jockeyNavInvitations', icon: '✉️' },
  { key: 'races', labelKey: 'jockeyNavRaces', icon: '🏁' }
];

const INVITATION_TABS = [
  { key: 'PENDING', labelKey: 'jockeyFilterPending' },
  { key: 'ALL', labelKey: 'jockeyFilterAll' },
  { key: 'ACCEPTED', labelKey: 'jockeyFilterAccepted' },
  { key: 'REJECTED', labelKey: 'jockeyFilterRejected' },
  { key: 'EXPIRED', labelKey: 'jockeyFilterExpired' },
  { key: 'CANCELLED', labelKey: 'jockeyFilterCancelled' }
];

function emptyProfileForm(currentUser = {}) {
  return {
    applicantFullName: currentUser?.fullName || '',
    applicantEmail: currentUser?.email || '',
    phoneNumber: '',
    trainerName: '',
    trainerEmail: '',
    stableAddress: '',
    issuingAuthority: '',
    verificationLink: '',
    licenseFileName: '',
    licenseFiles: [],
    weight: '55',
    biography: '',
    totalRaces: 0,
    totalWins: 0,
    imgUrl: ''
  };
}

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function translatedStatus(status, t) {
  const normalized = String(status || '').toUpperCase();
  if (!normalized) return t('notUpdated');
  const key = `status_${normalized}`;
  const translated = t(key);
  return translated === key ? formatDisplayLabel(normalized) : translated;
}

function isJockeySection(section) {
  return section === 'overview' || section === 'profile' || section === 'invitations' || section === 'races';
}

function isMissingProfileError(error) {
  return (
    error instanceof Error &&
    /profile does not exist|not found|không tồn tại/i.test(error.message)
  );
}

function toProfileForm(profile, currentUser = {}) {
  const licenseFiles = Array.isArray(profile.files) ? profile.files : [];
  const firstFile = licenseFiles[0] || null;
  const imgUrl = profile.imgUrl || firstFile?.fileUrl ? String(profile.imgUrl || firstFile.fileUrl) : '';

  return {
    applicantFullName: String(
      profile.applicantFullName ||
      profile.fullName ||
      currentUser?.fullName ||
      ''
    ),

    applicantEmail: String(
      profile.applicantEmail ||
      profile.email ||
      currentUser?.email ||
      ''
    ),

    phoneNumber: String(profile.phoneNumber || profile.phone || ''),
    trainerName: String(profile.trainerName || ''),
    trainerEmail: String(profile.trainerEmail || ''),
    stableAddress: String(profile.stableAddress || profile.academyStableAddress || ''),
    issuingAuthority: String(profile.issuingAuthority || ''),

    verificationLink: String(
      profile.verificationLink ||
      profile.licenseUrl ||
      profile.imgUrl ||
      ''
    ),

    licenseFileName: String(
      profile.licenseFileName ||
      licenseFiles.map((file) => file.fileUrl?.split('/').pop()).filter(Boolean).join(', ') ||
      ''
    ),
    licenseFiles,
    licenseNo: String(profile.licenseNo || profile.licenceType || ''),

    weight: profile.weight == null ? '55' : String(profile.weight),
    biography: String(profile.biography || ''),

    totalRaces: Number(profile.totalRaces ?? 0),
    totalWins: Number(profile.totalWins ?? 0),

    imgUrl
  };
}

function validateProfileForm(form) {
  const errors = {};
  const weight = Number(form.weight || 55);
  const phoneNumber = String(form.phoneNumber || '').trim();
  const verificationLinks = form.verificationLink
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);
  const invalidVerificationLink = verificationLinks.find((link) => !/^https?:\/\/.+/i.test(link));

  if (invalidVerificationLink) {
    errors.verificationLink = 'Every verification link must start with http:// or https://';
  }

  if (!phoneNumber) {
    errors.phoneNumber = 'Phone number is required.';
  }

  if (!Number.isFinite(weight) || weight < 35 || weight > 90) {
    errors.weight = 'Jockey weight must be between 35 and 90 kg.';
  }

  return errors;
}

function statusClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/\s+/g, '_');
}

function displayValue(value, fallback = 'Chưa cập nhật') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function formatTournamentDateRange(invitation) {
  const startDate = invitation.tournamentStartDate;
  const endDate = invitation.tournamentEndDate;

  if (!startDate && !endDate) return '—';
  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  return formatDate(startDate || endDate);
}

function getInvitationRegistrationDeadline(invitation, tournamentById) {
  return invitation.registrationDeadline
    ?? invitation.tournamentRegistrationDeadline
    ?? invitation.tournament?.registrationCloseAt
    ?? invitation.tournament?.registrationDeadline
    ?? tournamentById.get(String(invitation.tournamentId))?.registrationCloseAt
    ?? tournamentById.get(String(invitation.tournamentId))?.registrationDeadline
    ?? null;
}

function getNestedHorse(invitation) {
  return invitation.horse || invitation.horseInfo || invitation.horseDetail || invitation.horseResponse || {};
}

function readHorseValue(invitation, nestedHorse, fieldName, prefixedFieldName) {
  return invitation[prefixedFieldName] ?? nestedHorse[fieldName] ?? nestedHorse[prefixedFieldName] ?? null;
}

function getInvitationHorseDetails(invitation) {
  const horse = getNestedHorse(invitation);

  return {
    horseId: invitation.horseId ?? horse.horseId ?? horse.id,
    horseName: invitation.horseName ?? horse.horseName ?? horse.name,
    breed: firstDefined(readHorseValue(invitation, horse, 'breed', 'horseBreed'), horse.breeding),
    gender: firstDefined(readHorseValue(invitation, horse, 'gender', 'horseGender'), horse.sex),
    color: firstDefined(readHorseValue(invitation, horse, 'color', 'horseColor'), horse.colour),
    dayOfBirth: readHorseValue(invitation, horse, 'dayOfBirth', 'horseDayOfBirth'),
    weight: readHorseValue(invitation, horse, 'weight', 'horseWeight'),
    trainer: readHorseValue(invitation, horse, 'trainer', 'horseTrainer'),
    healthCertExpiry: readHorseValue(invitation, horse, 'healthCertExpiry', 'horseHealthCertExpiry'),
    status: readHorseValue(invitation, horse, 'status', 'horseStatus'),
    imgUrl: firstDefined(
      readHorseValue(invitation, horse, 'healthCertificateUrl', 'horseHealthCertificateUrl'),
      readHorseValue(invitation, horse, 'imgUrl', 'horseImgUrl')
    )
  };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function formatRequirementItem(item) {
  if (item === undefined || item === null || item === '') return '';
  if (typeof item !== 'object') return String(item);

  const label = firstDefined(
    item.conditionName,
    item.name,
    item.description,
    item.conditionDescription,
    item.conditionType,
    item.type,
    item.field
  );
  const operator = firstDefined(item.operator, item.comparisonOperator);
  const value = firstDefined(item.value, item.expectedValue, item.minValue, item.maxValue);

  if (label && operator && value !== undefined) return `${label} ${operator} ${value}`;
  if (label && item.minValue !== undefined && item.maxValue !== undefined) return `${label}: ${item.minValue} - ${item.maxValue}`;
  if (label && value !== undefined) return `${label}: ${value}`;
  if (label) return String(label);

  const readableValues = Object.entries(item)
    .filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && typeof entryValue !== 'object')
    .map(([key, entryValue]) => `${key}: ${entryValue}`);

  return readableValues.join(', ');
}

function formatRequirement(value) {
  if (value === undefined || value === null || value === '') return 'Chưa có dữ liệu';

  if (Array.isArray(value)) {
    const formattedItems = value.map(formatRequirementItem).filter(Boolean);
    return formattedItems.length > 0 ? formattedItems.join(', ') : 'Chưa có dữ liệu';
  }

  if (typeof value === 'object') {
    return formatRequirementItem(value) || 'Chưa có dữ liệu';
  }

  return String(value);
}

function getInvitationRaceDetails(invitation, tournamentById) {
  const tournament = invitation.tournament || tournamentById.get(String(invitation.tournamentId)) || {};
  return {
    name: firstDefined(invitation.tournamentName, tournament.tournamentName, invitation.tournamentId),
    startTime: firstDefined(invitation.tournamentStartDate, tournament.startDate),
    endTime: firstDefined(invitation.tournamentEndDate, tournament.endDate),
    track: firstDefined(tournament.venue, invitation.venue),
    fee: firstDefined(invitation.entryFee, invitation.tournamentEntryFee, tournament.entryFee),
    requirement: firstDefined(invitation.conditions, tournament.conditions, 'Chưa có dữ liệu'),
    deadline: getInvitationRegistrationDeadline(invitation, tournamentById)
  };
}

function getOwnerName(invitation) {
  return firstDefined(invitation.ownerName, invitation.owner?.fullName, invitation.ownerEmail, invitation.ownerId, 'Chưa có dữ liệu');
}

function InvitationDetailModal({
  invitation,
  tournamentById,
  isLoading,
  error,
  canAccept,
  actionId,
  onAccept,
  onDecline,
  onClose
}) {
  const { t } = useLanguage();
  if (!invitation) return null;

  const horse = getInvitationHorseDetails(invitation);
  const tournament = getInvitationRaceDetails(invitation, tournamentById);
  const registrationDeadline = getInvitationRegistrationDeadline(invitation, tournamentById);
  const invitationStatus = String(invitation.status || '').toUpperCase();
  const isPending = invitationStatus === 'PENDING';
  const isExpired = invitation.expiredAt && new Date(invitation.expiredAt).getTime() <= Date.now();
  const isProcessing = actionId === getInvitationId(invitation);

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="jockey-invitation-detail-modal w-full max-w-5xl rounded-lg bg-cream-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="jockey-invitation-detail-header">
          <div>
            <p className="eyebrow">Chi tiết lời mời</p>
            <h2>{invitation.tournamentName || tournament.name || 'Lời mời tham gia giải đấu'}</h2>
            <p>{horse.horseName ? `Ngựa ${horse.horseName}` : 'Thông tin lời mời từ owner'}</p>
          </div>
          <div className="jockey-invitation-detail-heading-actions">
            <span className={`status-badge ${statusClass(invitation.status)}`}>{translatedStatus(invitation.status, t)}</span>
            <button className="outline-button compact-button" type="button" onClick={onClose}>Đóng</button>
          </div>
        </div>

        {isLoading && <div className="admin-alert info" role="status">Đang tải thông tin đầy đủ từ backend...</div>}
        {error && <div className="admin-alert error" role="alert">{error}</div>}

        <div className="jockey-invitation-detail-sections">
          <section className="jockey-invitation-detail-section invitation-summary-section">
            <div className="jockey-detail-section-heading">
              <div>
                <span className="jockey-detail-section-icon">i</span>
                <h3>Lời mời</h3>
              </div>
              {invitation.registrationStatus && (
                <span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>
                  {t('jockeyRegistrationLabel')}: {translatedStatus(invitation.registrationStatus, t)}
                </span>
              )}
            </div>
            <div className="jockey-invitation-message">
              <span>Lời nhắn từ owner</span>
              <strong>{invitation.message || 'Chủ ngựa không gửi lời nhắn kèm theo.'}</strong>
            </div>
            <dl className="jockey-detail-grid">
              <div><dt>{t('jockeyOwnerLabel')}</dt><dd>{getOwnerName(invitation)}</dd></div>
              <div><dt>Gửi lúc</dt><dd>{formatDate(invitation.createdAt)}</dd></div>
              <div><dt>Hạn phản hồi</dt><dd>{formatDate(invitation.expiredAt)}</dd></div>
              <div><dt>{t('jockeyInvitationStatus')}</dt><dd>{translatedStatus(invitation.status, t)}</dd></div>
            </dl>
          </section>

          <section className="jockey-invitation-detail-section">
            <div className="jockey-detail-section-heading"><div><span className="jockey-detail-section-icon">T</span><h3>Giải đấu</h3></div></div>
            <dl className="jockey-detail-grid">
              <div><dt>Tên giải</dt><dd>{invitation.tournamentName || tournament.name || 'Chưa có dữ liệu'}</dd></div>
              <div><dt>Thời gian</dt><dd>{formatTournamentDateRange(invitation)}</dd></div>
              <div><dt>Địa điểm</dt><dd>{tournament.track || 'Chưa có dữ liệu'}</dd></div>
              <div><dt>Hạn đăng ký</dt><dd>{formatDate(registrationDeadline)}</dd></div>
              <div><dt>Phí đăng ký của owner</dt><dd>{tournament.fee == null ? 'Chưa có dữ liệu' : formatVndCurrency(tournament.fee)}</dd></div>
              <div className="wide"><dt>Điều kiện tham gia</dt><dd>{formatRequirement(tournament.requirement)}</dd></div>
            </dl>
          </section>

          <section className="jockey-invitation-detail-section">
            <div className="jockey-detail-section-heading">
              <div><span className="jockey-detail-section-icon">H</span><h3>Ngựa tham gia</h3></div>
              <span className={`status-badge ${statusClass(horse.status)}`}>{translatedStatus(horse.status, t)}</span>
            </div>
            <dl className="jockey-detail-grid">
              <div><dt>Tên ngựa</dt><dd>{horse.horseName || 'Chưa có dữ liệu'}</dd></div>
              <div><dt>Giống</dt><dd>{horse.breed || 'Chưa có dữ liệu'}</dd></div>
              <div><dt>Giới tính</dt><dd>{horse.gender ? formatDisplayLabel(horse.gender) : 'Chưa có dữ liệu'}</dd></div>
              <div><dt>Ngày sinh</dt><dd>{formatDate(horse.dayOfBirth)}</dd></div>
              <div><dt>Cân nặng</dt><dd>{horse.weight ? `${horse.weight} kg` : 'Chưa có dữ liệu'}</dd></div>
              <div><dt>Hạn giấy sức khỏe</dt><dd>{formatDate(horse.healthCertExpiry)}</dd></div>
              <div><dt>Huấn luyện viên</dt><dd>{horse.trainer || 'Chưa có dữ liệu'}</dd></div>
              <div><dt>Màu lông</dt><dd>{horse.color || 'Chưa có dữ liệu'}</dd></div>
            </dl>
            {horse.imgUrl && (
              <a className="outline-button jockey-certificate-link" href={horse.imgUrl} target="_blank" rel="noreferrer">
                Xem giấy chứng nhận sức khỏe
              </a>
            )}
          </section>
        </div>

        <footer className="jockey-invitation-detail-footer">
          <p>
            {isExpired
              ? t('jockeyInvitationExpiredNotice')
              : isPending
                ? t('jockeyInvitationDecisionHint')
                : t('jockeyInvitationProcessed', { status: translatedStatus(invitation.status, t) })}
          </p>
          <div>
            <button className="outline-button" type="button" onClick={onClose}>Đóng</button>
            {isPending && !isExpired && (
              <>
                <button className="outline-button danger-action" type="button" onClick={() => onDecline(invitation)} disabled={isProcessing}>Từ chối</button>
                <button className="primary-button" type="button" onClick={() => onAccept(invitation)} disabled={!canAccept || isProcessing}>
                  {isProcessing ? 'Đang xử lý...' : 'Chấp nhận lời mời'}
                </button>
              </>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}

function getInvitationId(invitation) {
  return invitation.invitationId;
}

function isAcceptedInvitation(invitation) {
  return ['ACCEPTED', 'APPROVED'].includes(String(invitation?.status || '').toUpperCase());
}

function countByStatus(invitations, status) {
  return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === status).length;
}

function toPerformanceNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculatePerformanceRate(part, total) {
  const totalValue = toPerformanceNumber(total);
  if (!totalValue) return 0;
  return Math.round((toPerformanceNumber(part) / totalValue) * 100);
}

function getJockeyPerformanceSummary(profile) {
  const performance = profile?.performance || {};
  const totalRaces = toPerformanceNumber(performance.totalRaces ?? profile?.totalRaces);
  const wins = toPerformanceNumber(performance.top1Count ?? profile?.totalWins);
  return {
    totalRaces,
    wins,
    winRate: performance.winRate ?? calculatePerformanceRate(wins, totalRaces)
  };
}

const jockeyOverviewIcons = [Trophy, Award, ShieldCheck, Inbox];

function getProfileNotice(profile, isLoadingProfile) {
  if (isLoadingProfile) return null;
  if (!profile) {
    return {
      type: 'error',
      text: 'Bạn chưa có hồ sơ jockey. Hãy tạo hồ sơ trước khi chấp nhận lời mời.'
    };
  }

  const verificationStatus = String(profile.verificationStatus || '').toUpperCase();
  const status = verificationStatus === 'APPROVED'
    ? 'ACTIVE'
    : verificationStatus || String(profile.status || '').toUpperCase();

  if (status === 'PENDING' || status === 'UNDER_REVIEW') {
    return {
      type: 'warning',
      text: 'Hồ sơ của bạn chưa được xác minh. Vui lòng chờ admin xét duyệt.'
    };
  }

  if (status === 'REJECTED') {
    return {
      type: 'error',
      text: `Hồ sơ của bạn đã bị từ chối.${profile.rejectionReason ? ` Lý do: ${profile.rejectionReason}` : ''}`
    };
  }

  if (status !== 'ACTIVE') {
    return {
      type: 'error',
      text: `Hồ sơ đang ở trạng thái ${formatDisplayLabel(profile.status)}, nên chưa thể chấp nhận lời mời.`
    };
  }

  return null;
}

function mergeProfileWithUser(profile, currentUser = {}) {
  if (!profile) return null;
  const verificationStatus = String(profile.verificationStatus || '').toUpperCase();
  const derivedStatus = verificationStatus === 'APPROVED'
    ? 'ACTIVE'
    : verificationStatus || profile.status || currentUser?.status || currentUser?.accountStatus || '';

  return {
    ...profile,
    fullName: profile.fullName || currentUser?.fullName || '',
    email: profile.email || currentUser?.email || '',
    status: derivedStatus
  };
}

export default function JockeyDashboard(props) {
  if (getUserRole(props.currentUser) !== 'JOCKEY') {
    return <JockeyPendingDashboard {...props} />;
  }

  return <ApprovedJockeyDashboard {...props} />;
}

function ApprovedJockeyDashboard({ currentUser, onLogout, onUserUpdated }) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    return isJockeySection(section) ? section : 'overview';
  });
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(() => emptyProfileForm(currentUser));
  const [profileErrors, setProfileErrors] = useState({});
  const [invitations, setInvitations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [invitationDecision, setInvitationDecision] = useState(null);
  const [isLoadingInvitationDetail, setIsLoadingInvitationDetail] = useState(false);
  const [invitationDetailError, setInvitationDetailError] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [pageError, setPageError] = useState('');
  const [profileSubmitError, setProfileSubmitError] = useState('');
  const [message, setMessage] = useState('');

  const jockeyName = currentUser?.fullName || currentUser?.email || t('role_JOCKEY');
  const isLoading = isLoadingProfile || isLoadingInvitations;
  const profileStatus = String(profile?.status || '').toUpperCase();
  const verificationStatus = String(profile?.verificationStatus || '').toUpperCase();
  const isApprovedProfile = verificationStatus === 'APPROVED' || (!verificationStatus && profileStatus === 'ACTIVE');
  const isProfileActive = Boolean(profile) && isApprovedProfile;
  const profileNotice = getProfileNotice(profile, isLoadingProfile);

  const tournamentById = useMemo(() => new Map(tournaments.map((tournament) => [String(tournament.tournamentId ?? tournament.tournamentID ?? tournament.id), tournament])), [tournaments]);

  const pendingInvitations = useMemo(() => invitations.filter((invitation) => {
    const isPending = String(invitation.status || '').toUpperCase() === 'PENDING';
    const expiresAt = invitation.expiredAt ? new Date(invitation.expiredAt).getTime() : null;
    return isPending && (!Number.isFinite(expiresAt) || expiresAt > Date.now());
  }), [invitations]);
  const pendingInvitationCount = pendingInvitations.length;
  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'PENDING') return pendingInvitations;
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, pendingInvitations, statusFilter]);
  const acceptedInvitationCount = invitations.filter(isAcceptedInvitation).length;
  const profileCompletionItems = [
    profile?.fullName || profileForm.applicantFullName,
    profile?.email || profileForm.applicantEmail,
    profileForm.phoneNumber,
    profileForm.trainerName,
    profileForm.issuingAuthority,
    profileForm.licenseFileName || profileForm.licenseFiles.length > 0
  ];
  const profileCompletion = Math.round(
    (profileCompletionItems.filter(Boolean).length / profileCompletionItems.length) * 100
  );
  const performanceSummary = getJockeyPerformanceSummary(profile);
  const jockeyStats = [
    {
      label: t('jockeyStatRaces'),
      value: performanceSummary.totalRaces,
      detail: t('jockeyStatTotalStarts')
    },
    {
      label: t('jockeyStatWins'),
      value: performanceSummary.wins,
      detail: t('jockeyStatWinRate', { rate: `${performanceSummary.winRate}%` })
    },
    {
      label: t('jockeyStatProfile'),
      value: profile ? translatedStatus(profile.status, t) : t('jockeyStatMissing'),
      detail: profile ? t('jockeyStatLicence', { licence: profile.licenseNo || t('notUpdated') }) : t('jockeyStatCreateProfile')
    },
    {
      label: t('jockeyStatPending'),
      value: pendingInvitationCount,
      detail: t('jockeyStatAccepted', { count: acceptedInvitationCount })
    }
  ];
  async function loadProfile({ silentMissing = false } = {}) {
    setIsLoadingProfile(true);
    setPageError('');

    try {
      const data = await getJockeyProfile();
      const nextProfile = mergeProfileWithUser(data, currentUser);
      setProfile(nextProfile);
      setProfileForm(toProfileForm(nextProfile, currentUser));
    } catch (error) {
      if (silentMissing && isMissingProfileError(error)) {
        setProfile(null);
        setProfileForm(emptyProfileForm(currentUser));
        return;
      }

      setPageError(getErrorText(error, 'Không thể tải hồ sơ jockey.'));
    } finally {
      setIsLoadingProfile(false);
    }
  }

  async function loadInvitations() {
    setIsLoadingInvitations(true);
    setPageError('');

    try {
      const data = await getJockeyInvitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể tải lời mời jockey.'));
    } finally {
      setIsLoadingInvitations(false);
    }
  }

  function reloadData() {
    setMessage('');
    setProfileSubmitError('');
    setPageError('');
    loadProfile({ silentMissing: true });
    loadInvitations();
  }

  useEffect(() => {
    loadProfile({ silentMissing: true });
    loadInvitations();
  }, []);

  function handleNavigate(section) {
    if (isJockeySection(section)) {
      setActiveSection(section);
      setPageError('');
      setProfileSubmitError('');
      setMessage('');
      if (section === 'profile') {
        setProfileForm((current) => ({
          ...current,
          applicantFullName: profile?.fullName || currentUser?.fullName || '',
          applicantEmail: profile?.email || currentUser?.email || ''
        }));
      }
    }
  }


  function handleProfileChange(event) {
    const { name, value } = event.target;


    setProfileForm((current) => ({
      ...current,
      [name]: value
    }));

    setProfileErrors((current) => ({
      ...current,
      [name]: ''
    }));

    setProfileSubmitError('');
    setPageError('');
    setMessage('');
  }

  function handleLicenceFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileForm((current) => ({
      ...current,
      licenseFileName: file.name
    }));

    setProfileErrors((current) => ({ ...current, licenseFileName: '' }));
    setProfileSubmitError('');
    setPageError('');
    setMessage('');
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    const errors = validateProfileForm(profileForm);
    setProfileErrors(errors);
    setProfileSubmitError('');
    setPageError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);

    try {
      const payload = toJockeyProfilePayload(profileForm);
      const data = profile
        ? await updateJockeyProfile(payload)
        : await createJockeyProfile(payload);
      const nextProfile = mergeProfileWithUser(data, currentUser);
      setProfile(nextProfile);
      setProfileForm(toProfileForm(nextProfile, currentUser));
      setMessage(profile ? 'Đã cập nhật hồ sơ jockey.' : 'Đã tạo hồ sơ jockey.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Không thể lưu hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
    return;

  }

  async function handleDeactivateProfile() {
    const confirmed = window.confirm('Bạn có chắc muốn xóa hồ sơ tạm thời hiện tại?');
    if (!confirmed) return;

    setProfileSubmitError('');
    setPageError('');
    setMessage('');
    setIsSavingProfile(true);

    try {
      const data = await deactivateJockeyProfile();
      const nextProfile = mergeProfileWithUser({ ...data, status: 'INACTIVE' }, currentUser);
      setProfile(nextProfile);
      setProfileForm(toProfileForm(nextProfile, currentUser));
      setMessage('Đã vô hiệu hóa hồ sơ jockey.');
    } catch (error) {
      setProfileSubmitError(getErrorText(error, 'Không thể vô hiệu hóa hồ sơ jockey.'));
    } finally {
      setIsSavingProfile(false);
    }
    return;
  }

  async function openInvitationDetail(invitation) {
    setSelectedInvitation(invitation);
    setInvitationDetailError('');

    const invitationId = getInvitationId(invitation);
    if (!invitationId) return;

    setIsLoadingInvitationDetail(true);
    try {
      const detail = await getJockeyInvitationDetail(invitationId);
      const detailInvitation = detail?.invitation || {};
      const detailHorse = detail?.horse || {};
      setSelectedInvitation((current) => {
        if (!current || getInvitationId(current) !== invitationId) return current;

        return {
          ...current,
          ...detailInvitation,
          tournament: detail?.tournament || current.tournament,
          horse: detailHorse,
          tournamentName: firstDefined(detailInvitation.tournamentName, detail?.tournament?.tournamentName, current.tournamentName),
          horseName: firstDefined(detailInvitation.horseName, detailHorse.horseName, current.horseName),
          ownerName: firstDefined(detailInvitation.ownerName, current.ownerName),
          jockeyName: firstDefined(detailInvitation.jockeyName, current.jockeyName)
        };
      });
    } catch (error) {
      setInvitationDetailError(getErrorText(error, 'Không thể tải đầy đủ thông tin lời mời từ backend.'));
    } finally {
      setIsLoadingInvitationDetail(false);
    }
  }

  function requestInvitationDecision(invitation, action) {
    const invitationId = getInvitationId(invitation);

    if (!invitationId) {
      setPageError('Không tìm thấy mã lời mời.');
      return;
    }

    setSelectedInvitation(null);
    setInvitationDecision({ invitation, action });
  }

  async function confirmInvitationDecision() {
    const invitation = invitationDecision?.invitation;
    const action = invitationDecision?.action;
    const invitationId = getInvitationId(invitation);

    if (!invitationId || !action) return;

    setPageError('');
    setMessage('');
    setActionId(invitationId);

    try {
      const updatedInvitation = action === 'accept'
        ? await acceptJockeyInvitation(invitationId)
        : await rejectJockeyInvitation(invitationId);
      setInvitations((current) =>
        current.map((item) =>
          getInvitationId(item) === invitationId ? { ...item, ...updatedInvitation } : item
        )
      );
      setSelectedInvitation((current) =>
        current && getInvitationId(current) === invitationId
          ? { ...current, ...updatedInvitation }
          : current
      );

      setMessage(action === 'accept' ? 'Đã chấp nhận lời mời.' : 'Đã từ chối lời mời.');
      setInvitationDecision(null);
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể xử lý lời mời.'));
    } finally {
      setActionId(null);
    }
  }

  function renderProfileForm() {
    return (
      <form className="owner-panel owner-form jockey-profile-form licence-application-form" onSubmit={handleProfileSubmit} noValidate>
        <div className="owner-panel-header jockey-form-header">
          <div>
            <p className="eyebrow">Hồ sơ jockey</p>
            <h2>{profile ? 'Cập nhật hồ sơ jockey' : 'Tạo hồ sơ jockey'}</h2>
            <p>Thông tin này dùng để admin kiểm tra licence và xác minh hồ sơ jockey.</p>
          </div>
          {profile && (
            <span className={`status-badge ${statusClass(profile.status)}`}>
              {formatDisplayLabel(profile.status)}
            </span>
          )}
        </div>

        <section className="jockey-profile-summary">
          <div className="jockey-profile-avatar-large">
            <img src={profileForm.imgUrl || defaultJockeyAvatar} alt="" />
          </div>
          <div>
            <p className="eyebrow">Profile readiness</p>
            <h3>{displayValue(profileForm.applicantFullName, jockeyName)}</h3>
            <p>{profileCompletion}% complete before review. Keep phone, trainer, licence authority and licence file easy to verify.</p>
          </div>
          <div className="jockey-completion-meter" aria-label={`${profileCompletion}% profile complete`}>
            <span style={{ width: `${profileCompletion}%` }} />
          </div>
        </section>

        {profileSubmitError && (
          <div className="admin-alert error modal-alert" role="alert">
            {profileSubmitError}
          </div>
        )}

        {profileNotice && (
          <div className={`admin-alert ${profileNotice.type} soft-alert`} role="alert">
            {profileNotice.text}
          </div>
        )}

        <section className="jockey-application-section">
          <div className="jockey-application-heading">
            <h3>Applicant Details</h3>
            <p>Tell us about yourself.</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="applicantFullName">
                Full Name <span className="required">*</span>
              </label>
              <input
                className={profileErrors.applicantFullName ? 'input has-error' : 'input'}
                id="applicantFullName"
                name="applicantFullName"
                type="text"
                placeholder="e.g. Aiden Walsh"
                value={profileForm.applicantFullName}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              {profileErrors.applicantFullName && (
                <p className="field-error">{profileErrors.applicantFullName}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="applicantEmail">
                Email <span className="required">*</span>
              </label>
              <input
                className={profileErrors.applicantEmail ? 'input has-error' : 'input'}
                id="applicantEmail"
                name="applicantEmail"
                type="email"
                placeholder="you@example.com"
                value={profileForm.applicantEmail}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              {profileErrors.applicantEmail && (
                <p className="field-error">{profileErrors.applicantEmail}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="phoneNumber">
                Phone Number <span className="required">*</span>
              </label>
              <input
                className={profileErrors.phoneNumber ? 'input has-error' : 'input'}
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+44 7700 900000"
                value={profileForm.phoneNumber}
                onChange={handleProfileChange}
                disabled={isSavingProfile}
              />
              {profileErrors.phoneNumber && (
                <p className="field-error">{profileErrors.phoneNumber}</p>
              )}
            </div>
          </div>
        </section>

        <section className="jockey-application-section">
          <div className="jockey-application-heading">
            <h3>Racing Profile</h3>
            <p>Thông tin này được lưu trong hồ sơ jockey hiện có.</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="weight">
                Weight <span className="required">*</span>
              </label>
              <input
                className={profileErrors.weight ? 'input has-error' : 'input'}
                id="weight"
                name="weight"
                type="number"
                min="35"
                max="90"
                step="0.1"
                value={profileForm.weight}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              {profileErrors.weight && (
                <p className="field-error">{profileErrors.weight}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="totalRaces">
                Total Races
              </label>
              <input
                className="input"
                id="totalRaces"
                name="totalRaces"
                type="number"
                value={profileForm.totalRaces}
                disabled
                readOnly
              />
            </div>

            <div>
              <label className="field-label" htmlFor="totalWins">
                Total Wins
              </label>
              <input
                className="input"
                id="totalWins"
                name="totalWins"
                type="number"
                value={profileForm.totalWins}
                disabled
                readOnly
              />
            </div>

            <div className="jockey-form-wide">
              <label className="field-label" htmlFor="biography">
                Biography
              </label>
              <textarea
                className="input"
                id="biography"
                name="biography"
                rows={4}
                maxLength={1000}
                placeholder="Kinh nghiệm thi đấu, thế mạnh hoặc ghi chú hồ sơ..."
                value={profileForm.biography}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
            </div>
          </div>
        </section>

        <section className="jockey-application-section">
          <div className="jockey-application-heading">
            <h3>Trainer &amp; Stable</h3>
            <p>Your current trainer and operating base.</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="trainerName">
                Trainer Name <span className="required">*</span>
              </label>
              <input
                className={profileErrors.trainerName ? 'input has-error' : 'input'}
                id="trainerName"
                name="trainerName"
                type="text"
                placeholder="e.g. Henrietta Crane"
                value={profileForm.trainerName}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              {profileErrors.trainerName && (
                <p className="field-error">{profileErrors.trainerName}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="trainerEmail">
                Trainer Email <span className="required">*</span>
              </label>
              <input
                className={profileErrors.trainerEmail ? 'input has-error' : 'input'}
                id="trainerEmail"
                name="trainerEmail"
                type="email"
                placeholder="trainer@stable.com"
                value={profileForm.trainerEmail}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              {profileErrors.trainerEmail && (
                <p className="field-error">{profileErrors.trainerEmail}</p>
              )}
            </div>

            <div className="jockey-form-wide">
              <label className="field-label" htmlFor="stableAddress">
                Academy or Stable Address <span className="required">*</span>
              </label>
              <input
                className={profileErrors.stableAddress ? 'input has-error' : 'input'}
                id="stableAddress"
                name="stableAddress"
                type="text"
                placeholder="Stable name, town, country"
                value={profileForm.stableAddress}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              {profileErrors.stableAddress && (
                <p className="field-error">{profileErrors.stableAddress}</p>
              )}
            </div>
          </div>
        </section>

        <section className="jockey-application-section">
          <div className="jockey-application-heading">
            <h3>Licence Verification</h3>
            <p>Help our team confirm your credentials.</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="issuingAuthority">
                Issuing Authority <span className="required">*</span>
              </label>
              <input
                className={profileErrors.issuingAuthority ? 'input has-error' : 'input'}
                id="issuingAuthority"
                name="issuingAuthority"
                type="text"
                placeholder="Nhập cơ quan cấp phép, ví dụ: BHA, IHRB, France Galop..."
                value={profileForm.issuingAuthority}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              {profileErrors.issuingAuthority && (
                <p className="field-error">{profileErrors.issuingAuthority}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="verificationLink">
                Verification Link
              </label>
              <textarea
                className={profileErrors.verificationLink ? 'input has-error' : 'input'}
                id="verificationLink"
                name="verificationLink"
                placeholder="https://authority.org/jockeys/your-id"
                rows={3}
                value={profileForm.verificationLink}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              />
              <p className="field-help">Optional - one public licence or profile page per line.</p>
              {profileErrors.verificationLink && (
                <p className="field-error">{profileErrors.verificationLink}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="licenseNo">
                Licence Type
              </label>
              <input
                className="input"
                id="licenseNo"
                name="licenseNo"
                type="text"
                value={profileForm.licenseNo}
                disabled
                readOnly
              />
            </div>

          </div>

          <div className="jockey-license-upload-group">
            <label className="field-label" htmlFor="jockeyLicenceFile">
              Jockey Licence File <span className="required">*</span>
            </label>

            <label
              className={
                profileErrors.licenseFileName
                  ? 'jockey-license-upload has-error'
                  : 'jockey-license-upload'
              }
              htmlFor="jockeyLicenceFile"
            >
              <span className="jockey-upload-icon" aria-hidden="true">
                ↥
              </span>

              <span className="jockey-upload-copy">
                <strong>
                  {profileForm.licenseFileName || 'Click to upload your licence'}
                </strong>
                <small>JPG, PNG, or PDF</small>
              </span>
            </label>

            <input
              className="image-file-input"
              id="jockeyLicenceFile"
              name="licenceFile"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={handleLicenceFileChange}
              disabled={isApprovedProfile || isSavingProfile}
            />

            <p className="field-help">JPG, PNG, or PDF (max 10MB).</p>

            {profileErrors.licenseFileName && (
              <p className="field-error">{profileErrors.licenseFileName}</p>
            )}

            {profileForm.licenseFiles.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profileForm.licenseFiles.map((file, index) => {
                  const fileUrl = file.fileUrl || file.url || '';
                  const fileType = String(file.fileType || '').toUpperCase();
                  const isImage = /^https?:\/\/.+/i.test(fileUrl) && fileType !== 'PDF';

                  return (
                    <div className="identity-preview-card flex min-h-[17rem] flex-col" key={file.fileId || fileUrl || index}>
                      {isImage ? (
                        <img
                          className="h-48 w-full rounded-lg bg-white object-contain"
                          src={fileUrl}
                          alt={`Jockey licence ${index + 1}`}
                        />
                      ) : (
                        <div className="grid h-48 place-items-center rounded-lg bg-white text-sm font-extrabold text-slate-500">
                          Licence file {index + 1}
                        </div>
                      )}
                      <a className="mt-auto min-w-0 truncate pt-3 font-bold text-green-700 underline" href={fileUrl} target="_blank" rel="noreferrer">
                        {fileUrl.split('/').pop() || `Licence file ${index + 1}`}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="admin-form-actions">
          <button className="primary-button" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Đang lưu...' : profile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
          </button>

          {profile && (
            <button
              className="outline-button danger-action"
              type="button"
              onClick={handleDeactivateProfile}
              disabled={isSavingProfile}
            >
              Deactivate Profile
            </button>
          )}
        </div>
      </form>
    );
  }

  function renderInvitationList(limit) {
    const items = typeof limit === 'number' ? pendingInvitations.slice(0, limit) : filteredInvitations;

    if (isLoadingInvitations) return <p className="table-empty">{t('jockeyLoadingInvitations')}</p>;
    if (items.length === 0) return <p className="table-empty">{t('jockeyNoMatchingInvitations')}</p>;

    return (
      <div className="jockey-invitation-list">
        {items.map((invitation) => {
          const invitationId = getInvitationId(invitation);
          const isPending = String(invitation.status || '').toUpperCase() === 'PENDING';
          const acceptDisabled = !isPending || !isProfileActive || actionId === invitationId;
          const horse = getInvitationHorseDetails(invitation);
          const registrationDeadline = getInvitationRegistrationDeadline(invitation, tournamentById);

          return (
            <article className="jockey-invitation-card" key={invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
              <header className="jockey-invitation-card-header">
                <div className="jockey-invitation-title">
                  <span className="jockey-id-chip">#{invitationId || '-'}</span>
                  <div>
                    <h3>{invitation.tournamentName || `Giải đấu #${invitation.tournamentId}`}</h3>
                    <p>Được mời bởi {getOwnerName(invitation)}</p>
                  </div>
                </div>
                <div className="jockey-status-pair">
                  <span className={`status-badge ${statusClass(invitation.status)}`}>{translatedStatus(invitation.status, t)}</span>
                  {invitation.registrationStatus && (
                    <span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>
                      {t('jockeyRegistrationLabel')}: {translatedStatus(invitation.registrationStatus, t)}
                    </span>
                  )}
                </div>
              </header>

              {invitation.message && (
                <div className="jockey-invitation-message compact">
                  <span>Lời nhắn từ chủ ngựa</span>
                  <strong>{invitation.message}</strong>
                </div>
              )}

              <dl className="jockey-invitation-summary-grid">
                <div><dt>Ngựa</dt><dd>{horse.horseName || `#${horse.horseId}`}</dd></div>
                <div><dt>Thời gian giải</dt><dd>{formatTournamentDateRange(invitation)}</dd></div>
                <div><dt>Hạn phản hồi</dt><dd>{formatDate(invitation.expiredAt)}</dd></div>
                {registrationDeadline && <div><dt>Hạn đăng ký</dt><dd>{formatDate(registrationDeadline)}</dd></div>}
              </dl>

              <footer className="jockey-invitation-card-footer">
                <button className="outline-button" type="button" onClick={() => openInvitationDetail(invitation)}>
                  Xem chi tiết
                </button>
                {isPending ? (
                  <div className="jockey-invitation-actions">
                    <button
                      type="button"
                      className="outline-button danger-action"
                      onClick={() => requestInvitationDecision(invitation, 'decline')}
                      disabled={actionId === invitationId}
                    >
                      Từ chối
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => requestInvitationDecision(invitation, 'accept')}
                      disabled={acceptDisabled}
                      title={!isProfileActive ? 'Hồ sơ chưa hoạt động nên không thể chấp nhận lời mời này.' : 'Chấp nhận lời mời'}
                    >
                      {actionId === invitationId ? 'Đang xử lý...' : 'Chấp nhận'}
                    </button>
                  </div>
                ) : (
                  <span className="readonly-note">Lời mời đã được xử lý</span>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <AppShell
      variant="jockey"
      title={t('jockeyDashboardTitle', { name: jockeyName })}
      subtitle={t('jockeyDashboardSubtitle')}
      profileName={jockeyName}
      profileRole={t(`role_${String(currentUser?.role || currentUser?.roleName || 'JOCKEY').toUpperCase()}`)}
      activeSection={activeSection}
      navItems={jockeyNavItems}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerAction={(
        <button className="refresh-button" type="button" onClick={reloadData} disabled={isLoading}>
          {isLoading ? t('jockeyRefreshing') : t('jockeyRefresh')}
        </button>
      )}
    >
      {pageError && <div className="admin-alert error" role="alert">{pageError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}
      {profileNotice && activeSection !== 'profile' && <div className={`admin-alert ${profileNotice.type}`} role="alert">{profileNotice.text}</div>}

      {activeSection === 'overview' && (
        <section className="jockey-overview-page">
          <section className="jockey-overview-metric-grid" aria-label={t('jockeyOverviewMetrics')}>
            {jockeyStats.map((stat, index) => {
              const Icon = jockeyOverviewIcons[index] || Trophy;
              return (
                <article className={`jockey-overview-metric-card tone-${index}`} key={stat.label}>
                  <div className="jockey-overview-metric-icon">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                    <small>{stat.detail}</small>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="jockey-overview-workspace-grid">
            <article className="jockey-overview-panel jockey-overview-inbox">
              <header className="jockey-overview-panel-header">
                <div>
                  <span className="jockey-overview-kicker">{t('jockeyInbox')}</span>
                  <h3>{t('jockeyLatestInvitations')}</h3>
                  <p>{t('jockeyLatestInvitationsDesc')}</p>
                </div>
                <button className="jockey-overview-secondary-action" type="button" onClick={() => setActiveSection('invitations')}>
                  {t('jockeyViewAll')}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </header>

              <div className="jockey-overview-invitation-list">
                {pendingInvitations.length === 0 ? (
                  <div className="jockey-overview-empty">
                    <CalendarCheck2 size={22} aria-hidden="true" />
                    <strong>{t('jockeyNoInvitations')}</strong>
                  </div>
                ) : pendingInvitations.slice(0, 5).map((invitation) => (
                  <button className="jockey-overview-invitation-row" type="button" onClick={() => openInvitationDetail(invitation)} key={invitation.invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
                    <span className="jockey-overview-invitation-main">
                      <strong>{invitation.tournamentName || t('jockeyTournamentNumber', { id: invitation.tournamentId || '' })}</strong>
                      <small>{invitation.horseName || invitation.horseId || t('notUpdated')} · {formatTournamentDateRange(invitation)}</small>
                    </span>
                    <span className={`status-badge ${statusClass(invitation.status)}`}>
                      {translatedStatus(invitation.status, t)}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            <article className="jockey-overview-panel jockey-overview-priority">
              <header className="jockey-overview-panel-header">
                <div>
                  <span className="jockey-overview-kicker">{t('jockeyNextSteps')}</span>
                  <h3>{t('jockeyPriorityTasks')}</h3>
                </div>
              </header>

              <div className="jockey-overview-task-list">
                <button type="button" onClick={() => setActiveSection('profile')}>
                  <FileBadge2 size={18} aria-hidden="true" />
                  <span>
                    <strong>{t('jockeyProfileVerified')}</strong>
                    <small>{t('jockeyProfileReadiness', { percent: profileCompletion })}</small>
                  </span>
                </button>
                <button type="button" onClick={() => setActiveSection('invitations')}>
                  <ClipboardList size={18} aria-hidden="true" />
                  <span>
                    <strong>{t('jockeyCheckPending', { count: pendingInvitationCount })}</strong>
                    <small>{t('jockeyAcceptedInvitationCount', { count: acceptedInvitationCount })}</small>
                  </span>
                </button>
                <button type="button" onClick={() => setActiveSection('races')}>
                  <Trophy size={18} aria-hidden="true" />
                  <span>
                    <strong>{t('jockeyNavRaces')}</strong>
                    <small>{t('jockeyRacesQuickDescription')}</small>
                  </span>
                </button>
              </div>
            </article>
          </section>
        </section>
      )}

      {activeSection === 'profile' && (
        <section className="owner-stack jockey-section">
          <JockeyProfileView
            user={currentUser}
            profile={profile}
            isLoading={isLoadingProfile}
            onReload={loadProfile}
            onUserUpdated={onUserUpdated}
          />
        </section>
      )}

      {activeSection === 'invitations' && (
        <section className="owner-stack jockey-section">
          <section className="owner-panel jockey-invitations-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">{t('jockeyInvitationsEyebrow')}</p>
                <h2>{t('jockeyReceivedInvitations')}</h2>
                <p>{t('jockeyReceivedInvitationsDesc')}</p>
              </div>
              <div className="jockey-invitation-filter">
                <label htmlFor="invitationStatusFilter">{t('jockeyInvitationStatus')}</label>
                <select
                  id="invitationStatusFilter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {INVITATION_TABS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {t(option.labelKey)} ({option.key === 'ALL' ? invitations.length : option.key === 'PENDING' ? pendingInvitationCount : countByStatus(invitations, option.key)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {renderInvitationList()}
          </section>
        </section>
      )}

      {activeSection === 'races' && (
        <section className="jockey-section">
          <JockeyRaces />
        </section>
      )}

      <InvitationDetailModal
        invitation={selectedInvitation}
        tournamentById={tournamentById}
        isLoading={isLoadingInvitationDetail}
        error={invitationDetailError}
        canAccept={isProfileActive}
        actionId={actionId}
        onAccept={(invitation) => requestInvitationDecision(invitation, 'accept')}
        onDecline={(invitation) => requestInvitationDecision(invitation, 'decline')}
        onClose={() => setSelectedInvitation(null)}
      />

      <ConfirmModal
        open={Boolean(invitationDecision)}
        title={invitationDecision?.action === 'accept' ? 'Chấp nhận lời mời?' : 'Từ chối lời mời?'}
        message={invitationDecision?.action === 'accept'
          ? 'Sau khi chấp nhận, chủ ngựa có thể thanh toán lệ phí cho đơn đăng ký này.'
          : 'Lời mời sẽ được đánh dấu đã từ chối và chủ ngựa phải chọn nài ngựa khác.'}
        confirmLabel={invitationDecision?.action === 'accept' ? 'Chấp nhận' : 'Từ chối'}
        cancelLabel="Quay lại"
        variant={invitationDecision?.action === 'accept' ? 'primary' : 'danger'}
        loading={Boolean(actionId)}
        onCancel={() => !actionId && setInvitationDecision(null)}
        onConfirm={confirmInvitationDecision}
      >
        <dl className="jockey-invitation-confirm-summary">
          <div><dt>Giải đấu</dt><dd>{invitationDecision?.invitation?.tournamentName || 'Chưa cập nhật'}</dd></div>
          <div><dt>Ngựa</dt><dd>{invitationDecision?.invitation?.horseName || 'Chưa cập nhật'}</dd></div>
          <div><dt>{t('jockeyOwnerLabel')}</dt><dd>{invitationDecision ? getOwnerName(invitationDecision.invitation) : ''}</dd></div>
          <div><dt>Hạn phản hồi</dt><dd>{formatDate(invitationDecision?.invitation?.expiredAt)}</dd></div>
        </dl>
      </ConfirmModal>
    </AppShell>
  );
}
