import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import defaultJockeyAvatar from '../../assets/default-jockey-avatar.svg';
import AppShell from '../common/AppShell';
import WalletTransferPanel from '../payment/WalletTransferPanel';
import {
  acceptJockeyInvitation,
  createJockeyProfile,
  deactivateJockeyProfile,
  getJockeyInvitations,
  getJockeyProfile,
  rejectJockeyInvitation,
  toJockeyProfilePayload,
  updateJockeyProfile
} from '../../services/jockeyService';

import { formatDate, formatDisplayLabel } from '../../lib';

const jockeyNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'profile', label: 'Hồ sơ', icon: '🧑‍✈️' },
  { key: 'invitations', label: 'Lời mời', icon: '✉️' },
  { key: 'wallet', label: 'Wallet', icon: Wallet }
];

const rankingOptions = ['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL', 'ELITE'];
const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];


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
    ranking: 'BEGINNER',
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
    ranking: String(profile.ranking || 'BEGINNER').toUpperCase(),
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

  if (!rankingOptions.includes(form.ranking)) {
    errors.ranking = 'Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL or ELITE.';
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
    breed: readHorseValue(invitation, horse, 'breed', 'horseBreed'),
    gender: readHorseValue(invitation, horse, 'gender', 'horseGender'),
    color: readHorseValue(invitation, horse, 'color', 'horseColor'),
    dayOfBirth: readHorseValue(invitation, horse, 'dayOfBirth', 'horseDayOfBirth'),
    weight: readHorseValue(invitation, horse, 'weight', 'horseWeight'),
    healthCertExpiry: readHorseValue(invitation, horse, 'healthCertExpiry', 'horseHealthCertExpiry'),
    status: readHorseValue(invitation, horse, 'status', 'horseStatus'),
    imgUrl: readHorseValue(invitation, horse, 'imgUrl', 'horseImgUrl')
  };
}

function hasHorseDetailData(details) {
  return Boolean(details.breed || details.gender || details.color || details.dayOfBirth || details.weight || details.healthCertExpiry || details.status || details.imgUrl);
}

function InvitationDetailModal({ invitation, tournamentById, onClose }) {
  if (!invitation) return null;

  const horse = getInvitationHorseDetails(invitation);
  const registrationDeadline = getInvitationRegistrationDeadline(invitation, tournamentById);
  const hasExtraHorseData = hasHorseDetailData(horse);

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-2xl rounded-lg bg-cream-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Chi tiết lời mời</p>
            <h2>{horse.horseName || `Horse ${horse.horseId || ''}`}</h2>
            <p>Xem thông tin ngựa và deadline đăng ký trước khi chấp nhận lời mời.</p>
          </div>
          <button className="outline-button compact-button" type="button" onClick={onClose}>Đóng</button>
        </div>

        <div className="detail-grid">
          <span>Giải đấu</span>
          <strong>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</strong>

          <span>Thời gian giải</span>
          <strong>{formatTournamentDateRange(invitation)}</strong>

          <span>Deadline đăng ký</span>
          <strong>{formatDate(registrationDeadline)}</strong>

          <span>Owner</span>
          <strong>{invitation.ownerName || invitation.ownerId || 'N/A'}</strong>

          <span>Horse ID</span>
          <strong>{horse.horseId || 'N/A'}</strong>

          <span>Tên ngựa</span>
          <strong>{horse.horseName || 'N/A'}</strong>

          <span>Giống ngựa</span>
          <strong>{horse.breed || 'Chưa có trong dữ liệu lời mời'}</strong>

          <span>Giới tính</span>
          <strong>{horse.gender ? formatDisplayLabel(horse.gender) : 'Chưa có trong dữ liệu lời mời'}</strong>

          <span>Màu lông</span>
          <strong>{horse.color || 'Chưa có trong dữ liệu lời mời'}</strong>

          <span>Ngày sinh</span>
          <strong>{formatDate(horse.dayOfBirth)}</strong>

          <span>Cân nặng</span>
          <strong>{horse.weight ? `${horse.weight} kg` : 'Chưa có trong dữ liệu lời mời'}</strong>

          <span>Hạn chứng nhận sức khỏe</span>
          <strong>{formatDate(horse.healthCertExpiry)}</strong>

          <span>Trạng thái ngựa</span>
          <strong>{horse.status ? formatDisplayLabel(horse.status) : 'Chưa có trong dữ liệu lời mời'}</strong>

          <span>Health Certificate URL</span>
          <strong className="break-anywhere">
            {horse.imgUrl ? <a href={horse.imgUrl} target="_blank" rel="noreferrer">{horse.imgUrl}</a> : 'Chưa có trong dữ liệu lời mời'}
          </strong>
        </div>

        {!hasExtraHorseData && (
          <div className="admin-alert warning soft-alert mt-4" role="note">
            API lời mời hiện chỉ gửi tên ngựa và mã ngựa. Giao diện đã sẵn sàng hiển thị breed, gender, color, weight, health certificate nếu backend trả các field đó trong response lời mời.
          </div>
        )}
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

  const status = String(profile.status || '').toUpperCase();

  if (status === 'UNDER_REVIEW') {
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

  return {
    ...profile,
    fullName: profile.fullName || currentUser?.fullName || '',
    email: profile.email || currentUser?.email || '',
    status: profile.status || currentUser?.status || currentUser?.accountStatus || ''
  };
}

export default function JockeyDashboard({ currentUser, onLogout }) {
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
  const profileStatus = String(profile?.status || currentUser?.status || currentUser?.accountStatus || '').toUpperCase();
  const verificationStatus = String(profile?.verificationStatus || '').toUpperCase();
  const isApprovedProfile = verificationStatus === 'APPROVED' || profileStatus === 'ACTIVE';
  const isProfileActive = Boolean(profile) && profileStatus === 'ACTIVE';
  const profileNotice = getProfileNotice(profile, isLoadingProfile);

  const tournamentById = useMemo(() => new Map(tournaments.map((tournament) => [String(tournament.tournamentId ?? tournament.tournamentID ?? tournament.id), tournament])), [tournaments]);

  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);

  const latestInvitations = useMemo(() => invitations.slice(0, 5), [invitations]);
  const pendingInvitationCount = countByStatus(invitations, 'PENDING');
  const acceptedInvitationCount = countByStatus(invitations, 'ACCEPTED');
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
      label: 'Races',
      value: profile?.totalRaces ?? 0,
      detail: 'Total starts'
    },
    {
      label: 'Wins',
      value: profile?.totalWins ?? 0,
      detail: `${getWinRate(profile)} win rate`
    },
    {
      label: 'Profile',
      value: profile ? formatDisplayLabel(profile.status) : 'Missing',
      detail: profile ? `Licence: ${profile.licenseNo || 'Not set'}` : 'Create profile'
    },
    {
      label: 'Pending',
      value: pendingInvitationCount,
      detail: `${acceptedInvitationCount} accepted`
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
      const nextProfile = mergeProfileWithUser({ ...data, status: data?.status || 'UNDER_REVIEW' }, currentUser);
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

  async function handleInvitationAction(invitation, action) {
    const invitationId = getInvitationId(invitation);

    if (!invitationId) {
      setPageError('Không tìm thấy mã lời mời.');
      return;
    }

    const confirmed = window.confirm(
      action === 'accept'
        ? 'Bạn có chắc muốn chấp nhận lời mời này?'
        : 'Bạn có chắc muốn từ chối lời mời này?'
    );

    if (!confirmed) return;

    setPageError('');
    setMessage('');
    setActionId(invitationId);

    try {
      const updatedInvitation = action === 'accept'
        ? await acceptJockeyInvitation(invitationId)
        : await rejectJockeyInvitation(invitationId);

      setInvitations((current) =>
        current.map((item) =>
          getInvitationId(item) === invitationId ? updatedInvitation : item
        )
      );

      setMessage(action === 'accept' ? 'Đã chấp nhận lời mời.' : 'Đã từ chối lời mời.');
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể xử lý lời mời.'));
    } finally {
      setActionId(null);
    }
    return;

    setInvitations((current) =>
      current.map((item) =>
        getInvitationId(item) === invitationId
          ? {
            ...item,
            status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
            registrationStatus: action === 'accept' ? 'ACCEPTED' : 'REJECTED'
          }
          : item
      )
    );

    setMessage(
      action === 'accept'
        ? 'Đã chấp nhận lời mời trên giao diện. Chưa gọi API backend.'
        : 'Đã từ chối lời mời trên giao diện. Chưa gọi API backend.'
    );
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
              <label className="field-label" htmlFor="ranking">
                Ranking <span className="required">*</span>
              </label>
              <select
                className={profileErrors.ranking ? 'input has-error' : 'input'}
                id="ranking"
                name="ranking"
                value={profileForm.ranking}
                onChange={handleProfileChange}
                disabled={isApprovedProfile || isSavingProfile}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ELITE">Elite</option>
              </select>
              {profileErrors.ranking && (
                <p className="field-error">{profileErrors.ranking}</p>
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
    const items = typeof limit === 'number' ? latestInvitations.slice(0, limit) : filteredInvitations;

    if (isLoadingInvitations) return <p className="table-empty">Đang tải lời mời...</p>;
    if (items.length === 0) return <p className="table-empty">Không có lời mời phù hợp với bộ lọc hiện tại.</p>;

    return (
      <div className="jockey-invitation-list">
        {items.map((invitation) => {
          const invitationId = getInvitationId(invitation);
          const isPending = String(invitation.status || '').toUpperCase() === 'PENDING';
          const acceptDisabled = !isPending || !isProfileActive || actionId === invitationId;

          return (
            <article className="jockey-invitation-card" key={invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
              <div className="jockey-invitation-main">
                <div className="jockey-invitation-title">
                  <span className="jockey-id-chip">#{invitationId || 'N/A'}</span>
                  <div>
                    <h3>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</h3>
                    {invitation.message && <p>{invitation.message}</p>}
                  </div>
                </div>

                <div className="jockey-invitation-meta">
                  <div>
                    <span>Thời gian</span>
                    <strong>{formatTournamentDateRange(invitation)}</strong>
                  </div>
                  <div>
                    <span>Deadline</span>
                    <strong>{formatDate(getInvitationRegistrationDeadline(invitation, tournamentById))}</strong>
                  </div>
                  <div>
                    <span>Owner</span>
                    <strong>{invitation.ownerName || invitation.ownerId || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Hết hạn</span>
                    <strong>{formatDate(invitation.expiredAt)}</strong>
                  </div>
                </div>
              </div>

              <aside className="jockey-invitation-side">
                <div className="jockey-horse-pill">
                  <span>Ngựa</span>
                  <strong>{invitation.horseName || invitation.horseId || 'N/A'}</strong>
                  <button className="table-button" type="button" onClick={() => setSelectedInvitation(invitation)}>
                    Xem thông tin
                  </button>
                </div>

                <div className="jockey-status-pair">
                  <span className={`status-badge ${statusClass(invitation.status)}`}>{formatDisplayLabel(invitation.status)}</span>
                  <span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>{formatDisplayLabel(invitation.registrationStatus)}</span>
                </div>

                {isPending ? (
                  <div className="jockey-invitation-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => handleInvitationAction(invitation, 'accept')}
                      disabled={acceptDisabled}
                      title={!isProfileActive ? 'Hồ sơ chưa ở trạng thái ACTIVE nên không thể chấp nhận lời mời này.' : 'Chấp nhận lời mời'}
                    >
                      Accept
                    </button>
                    <button type="button" className="outline-button danger-action" onClick={() => handleInvitationAction(invitation, 'reject')} disabled={actionId === invitationId}>
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="readonly-note">Đã xử lý</span>
                )}
              </aside>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <AppShell
      variant="jockey"
      title={`Hello, ${jockeyName}`}
      subtitle="Tạo hồ sơ jockey, theo dõi lời mời từ owner và phản hồi lời mời thi đấu."
      profileName={jockeyName}
      profileRole={String(currentUser?.role || currentUser?.roleName || 'JOCKEY')}
      activeSection={activeSection}
      navItems={jockeyNavItems}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerAction={(
        <button className="refresh-button" type="button" onClick={reloadData} disabled={isLoading}>
          {isLoading ? 'Đang tải...' : 'Làm mới'}
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
              <p className="eyebrow">Bảng điều khiển jockey</p>
              <h2>Quản lý hồ sơ và lời mời thi đấu</h2>
              <p>Hồ sơ cần ACTIVE trước khi nhận lời mời. Ưu tiên kiểm tra lời mời PENDING và cập nhật licence khi có thay đổi.</p>
              <div className="owner-shortcut-actions">
                <button className="primary-button owner-hero-action" type="button" onClick={() => setActiveSection('invitations')}>
                  Xem lời mời
                </button>
                <button className="outline-button owner-hero-action" type="button" onClick={() => setActiveSection('profile')}>
                  Mở hồ sơ
                </button>
              </div>
            </div>
            <div className="jockey-hero-card" aria-label="Jockey profile summary">
              <img src={profileForm.imgUrl || defaultJockeyAvatar} alt="" />
              <div>
                <span className={`status-badge ${statusClass(profileStatus || 'missing')}`}>
                  {profile ? formatDisplayLabel(profile.status) : 'Chưa có hồ sơ'}
                </span>
                <strong>{jockeyName}</strong>
                <small>{formatDisplayLabel(profile?.ranking || profileForm.ranking)} ranking</small>
              </div>
              <div className="jockey-readiness">
                <span>{profileCompletion}%</span>
                <small>profile complete</small>
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
                  <p className="eyebrow">Inbox</p>
                  <h2>Lời mời mới nhất</h2>
                  <p>Hiển thị tối đa năm lời mời gần nhất để phản hồi nhanh.</p>
                </div>
                <button className="outline-button compact-button" type="button" onClick={() => setActiveSection('invitations')}>
                  Xem tất cả
                </button>
              </div>
              <div className="jockey-invitation-preview-list">
                {latestInvitations.length === 0 ? (
                  <p className="table-empty">Chưa có lời mời.</p>
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
                  <p className="eyebrow">Next steps</p>
                  <h2>Việc cần ưu tiên</h2>
                </div>
              </div>
              <div className="jockey-checklist">
                <div>
                  <span>{profile ? '✓' : '1'}</span>
                  <p>Tạo hồ sơ jockey và bổ sung thông tin liên hệ.</p>
                </div>
                <div>
                  <span>{isProfileActive ? '✓' : '2'}</span>
                  <p>Chờ admin xác minh licence đến trạng thái ACTIVE.</p>
                </div>
                <div>
                  <span>{pendingInvitationCount > 0 ? '!' : '3'}</span>
                  <p>Phản hồi {pendingInvitationCount} lời mời đang chờ.</p>
                </div>
              </div>
            </div>
          </section>
        </section>
      )}

      {activeSection === 'profile' && (
        <section className="owner-stack jockey-section">
          <div className="owner-section-toolbar jockey-section-toolbar">
            <div>
              <p className="eyebrow">Hồ sơ</p>
              <h2>Hồ sơ jockey</h2>
            </div>
            <button
              className="outline-button compact-button"
              type="button"
              onClick={loadProfile}
              disabled={isLoadingProfile}
            >
              {isLoadingProfile ? 'Đang tải...' : 'Tải lại hồ sơ'}
            </button>
          </div>

          {isLoadingProfile ? (
            <div className="owner-panel jockey-loading-panel">
              <p className="table-empty">Đang tải hồ sơ...</p>
            </div>
          ) : (
            renderProfileForm()
          )}
        </section>
      )}

      {activeSection === 'invitations' && (
        <section className="owner-stack jockey-section">
          <section className="owner-panel jockey-invitations-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Lời mời</p>
                <h2>Lời mời đã nhận</h2>
                <p>Jockey có thể xem thông tin ngựa, deadline đăng ký, rồi chấp nhận hoặc từ chối lời mời PENDING.</p>
              </div>
              <div className="inline-filter-row">
                <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatDisplayLabel(status)}</option>)}
                </select>
                <span className="owner-count-pill">{filteredInvitations.length} invitations</span>
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
        onClose={() => setSelectedInvitation(null)}
      />
    </AppShell>
  );
}
