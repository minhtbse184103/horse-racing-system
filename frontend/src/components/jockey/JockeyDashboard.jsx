import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import defaultJockeyAvatar from '../../assets/default-jockey-avatar.svg';
import AppShell from '../common/AppShell';
import ConfirmModal from '../common/ConfirmModal';
import WalletTransferPanel from '../payment/WalletTransferPanel';
import JockeyPendingDashboard from './JockeyPendingDashboard';
import JockeyProfileView from './JockeyProfileView';
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
import { useLanguage } from '../../context/LanguageContext';

const jockeyNavItems = [
  { key: 'overview', labelKey: 'jockeyNavOverview', icon: '📊' },
  { key: 'profile', labelKey: 'jockeyNavProfile', icon: '🧑‍✈️' },
  { key: 'invitations', labelKey: 'jockeyNavInvitations', icon: '✉️' },
  { key: 'wallet', labelKey: 'wallet', icon: Wallet }
];

const INVITATION_TABS = [
  { key: 'ALL', labelKey: 'jockeyFilterAll' },
  { key: 'PENDING', labelKey: 'jockeyFilterPending' },
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

function isJockeySection(section) {
  return section === 'overview' || section === 'profile' || section === 'invitations' || section === 'wallet';
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

  if (!startDate && !endDate) return 'N/A';
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
  const { language } = useLanguage();
  const tr = (vi, en) => language === 'en' ? en : vi;
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
            <p className="eyebrow">{tr('Chi tiết lời mời', 'Invitation details')}</p>
            <h2>{invitation.tournamentName || tournament.name || tr('Lời mời tham gia giải đấu', 'Tournament invitation')}</h2>
            <p>{horse.horseName ? tr(`Ngựa ${horse.horseName}`, `Horse ${horse.horseName}`) : tr('Thông tin lời mời từ Owner', 'Invitation information from the Owner')}</p>
          </div>
          <div className="jockey-invitation-detail-heading-actions">
            <span className={`status-badge ${statusClass(invitation.status)}`}>{formatDisplayLabel(invitation.status)}</span>
            <button className="outline-button compact-button" type="button" onClick={onClose}>{tr('Đóng', 'Close')}</button>
          </div>
        </div>

        {isLoading && <div className="admin-alert info" role="status">{tr('Đang tải thông tin đầy đủ...', 'Loading complete information...')}</div>}
        {error && <div className="admin-alert error" role="alert">{error}</div>}

        <div className="jockey-invitation-detail-sections">
          <section className="jockey-invitation-detail-section invitation-summary-section">
            <div className="jockey-detail-section-heading">
              <div>
                <span className="jockey-detail-section-icon">i</span>
                <h3>{tr('Lời mời', 'Invitation')}</h3>
              </div>
              {invitation.registrationStatus && (
                <span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>
                  {tr('Đăng ký', 'Registration')}: {formatDisplayLabel(invitation.registrationStatus)}
                </span>
              )}
            </div>
            <div className="jockey-invitation-message">
              <span>{tr('Lời nhắn từ Owner', 'Message from the Owner')}</span>
              <strong>{invitation.message || tr('Owner không gửi lời nhắn kèm theo.', 'The Owner did not include a message.')}</strong>
            </div>
            <dl className="jockey-detail-grid">
              <div><dt>Owner</dt><dd>{getOwnerName(invitation)}</dd></div>
              <div><dt>{tr('Gửi lúc', 'Sent at')}</dt><dd>{formatDate(invitation.createdAt)}</dd></div><div><dt>{tr('Hạn phản hồi', 'Response deadline')}</dt><dd>{formatDate(invitation.expiredAt)}</dd></div><div><dt>{tr('Trạng thái', 'Status')}</dt><dd>{formatDisplayLabel(invitation.status)}</dd></div>
            </dl>
          </section>

          <section className="jockey-invitation-detail-section">
            <div className="jockey-detail-section-heading"><div><span className="jockey-detail-section-icon">T</span><h3>{tr('Giải đấu', 'Tournament')}</h3></div></div>
            <dl className="jockey-detail-grid">
              <div><dt>{tr('Tên giải', 'Tournament name')}</dt><dd>{invitation.tournamentName || tournament.name || tr('Chưa có dữ liệu', 'No data')}</dd></div><div><dt>{tr('Thời gian', 'Dates')}</dt><dd>{formatTournamentDateRange(invitation)}</dd></div><div><dt>{tr('Địa điểm', 'Venue')}</dt><dd>{tournament.track || tr('Chưa có dữ liệu', 'No data')}</dd></div><div><dt>{tr('Hạn đăng ký', 'Registration deadline')}</dt><dd>{formatDate(registrationDeadline)}</dd></div><div><dt>{tr('Phí đăng ký của Owner', 'Owner registration fee')}</dt><dd>{tournament.fee == null ? tr('Chưa có dữ liệu', 'No data') : `${Number(tournament.fee).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')} VND`}</dd></div><div className="wide"><dt>{tr('Điều kiện tham gia', 'Entry requirements')}</dt><dd>{formatRequirement(tournament.requirement)}</dd></div>
            </dl>
          </section>

          <section className="jockey-invitation-detail-section">
            <div className="jockey-detail-section-heading">
              <div><span className="jockey-detail-section-icon">H</span><h3>{tr('Ngựa tham gia', 'Participating horse')}</h3></div>
              <span className={`status-badge ${statusClass(horse.status)}`}>{formatDisplayLabel(horse.status)}</span>
            </div>
            <dl className="jockey-detail-grid">
              <div><dt>{tr('Tên ngựa', 'Horse name')}</dt><dd>{horse.horseName || tr('Chưa có dữ liệu', 'No data')}</dd></div><div><dt>{tr('Giống', 'Breed')}</dt><dd>{horse.breed || tr('Chưa có dữ liệu', 'No data')}</dd></div><div><dt>{tr('Giới tính', 'Gender')}</dt><dd>{horse.gender ? formatDisplayLabel(horse.gender) : tr('Chưa có dữ liệu', 'No data')}</dd></div><div><dt>{tr('Ngày sinh', 'Date of birth')}</dt><dd>{formatDate(horse.dayOfBirth)}</dd></div><div><dt>{tr('Cân nặng', 'Weight')}</dt><dd>{horse.weight ? `${horse.weight} kg` : tr('Chưa có dữ liệu', 'No data')}</dd></div><div><dt>{tr('Hạn giấy sức khỏe', 'Health certificate expiry')}</dt><dd>{formatDate(horse.healthCertExpiry)}</dd></div><div><dt>{tr('Huấn luyện viên', 'Trainer')}</dt><dd>{horse.trainer || tr('Chưa có dữ liệu', 'No data')}</dd></div><div><dt>{tr('Màu lông', 'Coat color')}</dt><dd>{horse.color || tr('Chưa có dữ liệu', 'No data')}</dd></div>
            </dl>
            {horse.imgUrl && (
              <a className="outline-button jockey-certificate-link" href={horse.imgUrl} target="_blank" rel="noreferrer">
                {tr('Xem giấy chứng nhận sức khỏe', 'View health certificate')}
              </a>
            )}
          </section>
        </div>

        <footer className="jockey-invitation-detail-footer">
          <p>
            {isExpired ? tr('Lời mời đã hết hạn phản hồi.', 'The response deadline has passed.') : isPending ? tr('Kiểm tra thông tin trước khi đưa ra quyết định.', 'Review the information before making a decision.') : tr(`Lời mời đã được xử lý: ${formatDisplayLabel(invitation.status)}.`, `Invitation processed: ${formatDisplayLabel(invitation.status)}.`)}
          </p>
          <div>
            <button className="outline-button" type="button" onClick={onClose}>{tr('Đóng', 'Close')}</button>
            {isPending && !isExpired && (
              <>
                <button className="outline-button danger-action" type="button" onClick={() => onDecline(invitation)} disabled={isProcessing}>{tr('Từ chối', 'Decline')}</button>
                <button className="primary-button" type="button" onClick={() => onAccept(invitation)} disabled={!canAccept || isProcessing}>
                  {isProcessing ? tr('Đang xử lý...', 'Processing...') : tr('Chấp nhận lời mời', 'Accept invitation')}
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

function countByStatus(invitations, status) {
  return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === status).length;
}

function isAcceptedInvitation(invitation) {
  return ['ACCEPTED', 'APPROVED'].includes(String(invitation?.status || '').toUpperCase());
}

function getWinRate(profile) {
  const totalRaces = Number(profile?.totalRaces ?? 0);
  const totalWins = Number(profile?.totalWins ?? 0);

  if (!totalRaces || totalRaces < 1) return '0%';
  return `${Math.round((totalWins / totalRaces) * 100)}%`;
}

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
  const { t, language } = useLanguage();
  const tr = (vi, en) => language === 'en' ? en : vi;
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('vnp_TxnRef') || params.has('vnp_SecureHash')) return 'wallet';
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [pageError, setPageError] = useState('');
  const [profileSubmitError, setProfileSubmitError] = useState('');
  const [message, setMessage] = useState('');

  const jockeyName = currentUser?.fullName || currentUser?.email || 'Jockey';
  const isLoading = isLoadingProfile || isLoadingInvitations;
  const profileStatus = String(profile?.status || '').toUpperCase();
  const verificationStatus = String(profile?.verificationStatus || '').toUpperCase();
  const isApprovedProfile = verificationStatus === 'APPROVED' || (!verificationStatus && profileStatus === 'ACTIVE');
  const isProfileActive = Boolean(profile) && isApprovedProfile;
  const profileNotice = getProfileNotice(profile, isLoadingProfile);

  const tournamentById = useMemo(() => new Map(tournaments.map((tournament) => [String(tournament.tournamentId ?? tournament.tournamentID ?? tournament.id), tournament])), [tournaments]);

  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);

  const latestInvitations = useMemo(() => invitations.slice(0, 5), [invitations]);
  const pendingInvitationCount = countByStatus(invitations, 'PENDING');
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
  const jockeyStats = [
    {
      label: t('jockeyStatRaces'),
      value: profile?.totalRaces ?? 0,
      detail: t('jockeyStatTotalStarts')
    },
    {
      label: t('jockeyStatWins'),
      value: profile?.totalWins ?? 0,
      detail: t('jockeyStatWinRate', { rate: getWinRate(profile) })
    },
    {
      label: t('jockeyStatProfile'),
      value: profile ? formatDisplayLabel(profile.status) : t('jockeyStatMissing'),
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
            <p className="eyebrow">{tr('Hồ sơ Jockey', 'Jockey profile')}</p><h2>{profile ? tr('Cập nhật hồ sơ Jockey', 'Update Jockey profile') : tr('Tạo hồ sơ Jockey', 'Create Jockey profile')}</h2><p>{tr('Thông tin này dùng để quản trị viên kiểm tra giấy phép và xác minh hồ sơ Jockey.', 'Administrators use this information to verify your licence and Jockey profile.')}</p>
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
            <p className="eyebrow">{tr('Mức độ hoàn thiện hồ sơ', 'Profile readiness')}</p>
            <h3>{displayValue(profileForm.applicantFullName, jockeyName)}</h3>
            <p>{tr(`Hoàn thành ${profileCompletion}% trước khi xét duyệt. Hãy cung cấp rõ số điện thoại, huấn luyện viên, cơ quan cấp phép và tệp giấy phép.`, `${profileCompletion}% complete before review. Keep phone, trainer, licence authority and licence file easy to verify.`)}</p>
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
            <h3>{tr('Thông tin người đăng ký', 'Applicant details')}</h3><p>{tr('Hãy giới thiệu thông tin của bạn.', 'Tell us about yourself.')}</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="applicantFullName">
                {tr('Họ và tên', 'Full name')} <span className="required">*</span>
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
                {tr('Số điện thoại', 'Phone number')} <span className="required">*</span>
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
            <h3>{tr('Hồ sơ thi đấu', 'Racing profile')}</h3><p>{tr('Thông tin này được lưu trong hồ sơ Jockey hiện có.', 'This information is stored in your current Jockey profile.')}</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="weight">
                {tr('Cân nặng', 'Weight')} <span className="required">*</span>
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
                {tr('Tổng cuộc đua', 'Total races')}
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
                {tr('Tổng chiến thắng', 'Total wins')}
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
                {tr('Tiểu sử', 'Biography')}
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
            <h3>{tr('Huấn luyện viên & Chuồng ngựa', 'Trainer & Stable')}</h3><p>{tr('Huấn luyện viên và cơ sở hoạt động hiện tại của bạn.', 'Your current trainer and operating base.')}</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="trainerName">
                {tr('Tên huấn luyện viên', 'Trainer name')} <span className="required">*</span>
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
                {tr('Email huấn luyện viên', 'Trainer email')} <span className="required">*</span>
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
                {tr('Địa chỉ học viện hoặc chuồng ngựa', 'Academy or stable address')} <span className="required">*</span>
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
            <h3>{tr('Xác minh giấy phép', 'Licence verification')}</h3><p>{tr('Giúp đội ngũ xác minh thông tin nghề nghiệp của bạn.', 'Help our team confirm your credentials.')}</p>
          </div>

          <div className="jockey-form-grid">
            <div>
              <label className="field-label" htmlFor="issuingAuthority">
                {tr('Cơ quan cấp phép', 'Issuing authority')} <span className="required">*</span>
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
                {tr('Liên kết xác minh', 'Verification link')}
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
              <p className="field-help">{tr('Không bắt buộc - mỗi dòng một liên kết giấy phép hoặc hồ sơ công khai.', 'Optional - one public licence or profile page per line.')}</p>
              {profileErrors.verificationLink && (
                <p className="field-error">{profileErrors.verificationLink}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="licenseNo">
                {tr('Loại giấy phép', 'Licence type')}
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
              {tr('Tệp giấy phép Jockey', 'Jockey licence file')} <span className="required">*</span>
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
                  {profileForm.licenseFileName || tr('Nhấn để tải giấy phép lên', 'Click to upload your licence')}
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
    const items = typeof limit === 'number' ? latestInvitations.slice(0, limit) : filteredInvitations;

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
                    <h3>{invitation.tournamentName || tr(`Giải đấu #${invitation.tournamentId}`, `Tournament #${invitation.tournamentId}`)}</h3>
                    <p>{tr('Được mời bởi', 'Invited by')} {getOwnerName(invitation)}</p>
                  </div>
                </div>
                <div className="jockey-status-pair">
                  <span className={`status-badge ${statusClass(invitation.status)}`}>{formatDisplayLabel(invitation.status)}</span>
                  {invitation.registrationStatus && (
                    <span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>
                      {tr('Đăng ký', 'Registration')}: {formatDisplayLabel(invitation.registrationStatus)}
                    </span>
                  )}
                </div>
              </header>

              {invitation.message && (
                <div className="jockey-invitation-message compact">
                  <span>{tr('Lời nhắn từ Owner', 'Message from the Owner')}</span>
                  <strong>{invitation.message}</strong>
                </div>
              )}

              <dl className="jockey-invitation-summary-grid">
                <div><dt>{tr('Ngựa', 'Horse')}</dt><dd>{horse.horseName || `#${horse.horseId}`}</dd></div><div><dt>{tr('Thời gian giải', 'Tournament dates')}</dt><dd>{formatTournamentDateRange(invitation)}</dd></div><div><dt>{tr('Hạn phản hồi', 'Response deadline')}</dt><dd>{formatDate(invitation.expiredAt)}</dd></div>{registrationDeadline && <div><dt>{tr('Hạn đăng ký', 'Registration deadline')}</dt><dd>{formatDate(registrationDeadline)}</dd></div>}
              </dl>

              <footer className="jockey-invitation-card-footer">
                <button className="outline-button" type="button" onClick={() => openInvitationDetail(invitation)}>
                  {tr('Xem chi tiết', 'View details')}
                </button>
                {isPending ? (
                  <div className="jockey-invitation-actions">
                    <button
                      type="button"
                      className="outline-button danger-action"
                      onClick={() => requestInvitationDecision(invitation, 'decline')}
                      disabled={actionId === invitationId}
                    >
                      {tr('Từ chối', 'Decline')}
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => requestInvitationDecision(invitation, 'accept')}
                      disabled={acceptDisabled}
                      title={!isProfileActive ? tr('Hồ sơ chưa ở trạng thái ACTIVE nên không thể chấp nhận lời mời này.', 'Your profile must be ACTIVE to accept this invitation.') : tr('Chấp nhận lời mời', 'Accept invitation')}
                    >
                      {actionId === invitationId ? tr('Đang xử lý...', 'Processing...') : tr('Chấp nhận', 'Accept')}
                    </button>
                  </div>
                ) : (
                  <span className="readonly-note">{tr('Lời mời đã được xử lý', 'Invitation processed')}</span>
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
      profileRole={String(currentUser?.role || currentUser?.roleName || 'JOCKEY')}
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
        <section className="jockey-dashboard">
          <section className="jockey-hero-panel">
            <div className="jockey-hero-copy">
              <p className="eyebrow">{t('jockeyDashboardEyebrow')}</p>
              <h2>{t('jockeyHeroTitle')}</h2>
              <p>{t('jockeyHeroDescription')}</p>
              <div className="owner-shortcut-actions">
                <button className="primary-button owner-hero-action" type="button" onClick={() => setActiveSection('invitations')}>
                  {t('jockeyViewInvitations')}
                </button>
                <button className="outline-button owner-hero-action" type="button" onClick={() => setActiveSection('profile')}>
                  {t('jockeyOpenProfile')}
                </button>
              </div>
            </div>
          </section>

          <section className="jockey-stat-grid">
            {jockeyStats.map((stat) => (
              <article className="jockey-stat-card" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </article>
            ))}
          </section>

          <section className="jockey-overview-grid">
            <div className="owner-panel jockey-inbox-panel">
              <div className="owner-panel-header">
                <div>
                  <p className="eyebrow">{t('jockeyInbox')}</p>
                  <h2>{t('jockeyLatestInvitations')}</h2>
                  <p>{t('jockeyLatestInvitationsDesc')}</p>
                </div>
                <button className="outline-button compact-button" type="button" onClick={() => setActiveSection('invitations')}>
                  {t('jockeyViewAll')}
                </button>
              </div>
              <div className="jockey-invitation-preview-list">
                {latestInvitations.length === 0 ? (
                  <p className="table-empty">{t('jockeyNoInvitations')}</p>
                ) : latestInvitations.map((invitation) => (
                  <article className="jockey-invitation-preview" key={invitation.invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
                    <div>
                      <strong>{invitation.tournamentName || `Tournament ${invitation.tournamentId || ''}`}</strong>
                      <span>{invitation.horseName || invitation.horseId || 'N/A'} · {formatTournamentDateRange(invitation)}</span>
                    </div>
                    <span className={`status-badge ${statusClass(invitation.status)}`}>
                      {formatDisplayLabel(invitation.status)}
                    </span>
                  </article>
                ))}
              </div>
            </div>

            <div className="owner-panel jockey-checklist-panel">
              <div className="owner-panel-header">
                <div>
                  <p className="eyebrow">{t('jockeyNextSteps')}</p>
                  <h2>{t('jockeyPriorityTasks')}</h2>
                </div>
              </div>
              <div className="jockey-checklist">
                <div>
                  <span>✓</span>
                  <p>{t('jockeyProfileVerified')}</p>
                </div>
                <div>
                  <span>{pendingInvitationCount > 0 ? '!' : '✓'}</span>
                  <p>{t('jockeyCheckPending', { count: pendingInvitationCount })}</p>
                </div>
                <div>
                  <span>3</span>
                  <p>{t('jockeyWalletKycHint')}</p>
                </div>
              </div>
            </div>
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
                      {t(option.labelKey)} ({option.key === 'ALL' ? invitations.length : countByStatus(invitations, option.key)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {renderInvitationList()}
          </section>
        </section>
      )}

      {activeSection === 'wallet' && (
        <WalletTransferPanel currentUser={currentUser} role="JOCKEY" />
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
        title={invitationDecision?.action === 'accept' ? tr('Chấp nhận lời mời?', 'Accept invitation?') : tr('Từ chối lời mời?', 'Decline invitation?')}
        message={invitationDecision?.action === 'accept'
          ? tr('Sau khi chấp nhận, Owner có thể tạo đơn đăng ký giải và thanh toán lệ phí cho ngựa này.', 'After acceptance, the Owner can register this horse and pay the entry fee.')
          : tr('Lời mời sẽ được đánh dấu đã từ chối và Owner phải chọn Jockey khác.', 'The invitation will be declined and the Owner must select another Jockey.')}
        confirmLabel={invitationDecision?.action === 'accept' ? tr('Chấp nhận', 'Accept') : tr('Từ chối', 'Decline')}
        cancelLabel={tr('Quay lại', 'Go back')}
        variant={invitationDecision?.action === 'accept' ? 'primary' : 'danger'}
        loading={Boolean(actionId)}
        onCancel={() => !actionId && setInvitationDecision(null)}
        onConfirm={confirmInvitationDecision}
      >
        <dl className="jockey-invitation-confirm-summary">
          <div><dt>{tr('Giải đấu', 'Tournament')}</dt><dd>{invitationDecision?.invitation?.tournamentName || tr('Chưa cập nhật', 'Not updated')}</dd></div>
          <div><dt>{tr('Ngựa', 'Horse')}</dt><dd>{invitationDecision?.invitation?.horseName || tr('Chưa cập nhật', 'Not updated')}</dd></div>
          <div><dt>Owner</dt><dd>{invitationDecision ? getOwnerName(invitationDecision.invitation) : ''}</dd></div>
          <div><dt>{tr('Hạn phản hồi', 'Response deadline')}</dt><dd>{formatDate(invitationDecision?.invitation?.expiredAt)}</dd></div>
        </dl>
      </ConfirmModal>
    </AppShell>
  );
}
