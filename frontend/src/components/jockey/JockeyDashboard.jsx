import { useEffect, useMemo, useState } from 'react';
import defaultJockeyAvatar from '../../assets/default-jockey-avatar.svg';
import AppShell from '../common/AppShell';
import StatCard from '../common/StatCard';

import { formatDate, formatDisplayLabel } from '../../lib';

const jockeyNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'profile', label: 'Hồ sơ', icon: '🧑‍✈️' },
  { key: 'invitations', label: 'Lời mời', icon: '✉️' }
];

const rankingOptions = ['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL', 'ELITE'];
const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

const issuingAuthorityOptions = [
  { value: '', label: 'Select authority' },
  { value: 'BHA', label: 'BHA - British Horseracing Authority' },
  { value: 'IHRB', label: 'IHRB - Irish Horseracing Regulatory Board' },
  { value: 'FRANCE_GALOP', label: 'FG - France Galop' },
  { value: 'OTHER', label: 'OTHER' }
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
    licenseNo: '',
    weight: '55',
    ranking: 'BEGINNER',
    imgUrl: ''
  };
}

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function isJockeySection(section) {
  return section === 'overview' || section === 'profile' || section === 'invitations';
}

function isMissingProfileError(error) {
  return error instanceof Error && /profile does not exist|not found/i.test(error.message);
}

function toProfileForm(profile, currentUser = {}) {
  const imgUrl = profile.imgUrl ? String(profile.imgUrl) : '';

  return {
    applicantFullName: String(profile.fullName || currentUser?.fullName || ''),
    applicantEmail: String(profile.email || currentUser?.email || ''),
    phoneNumber: String(profile.phoneNumber || ''),
    trainerName: String(profile.trainerName || ''),
    trainerEmail: String(profile.trainerEmail || ''),
    stableAddress: String(profile.stableAddress || ''),
    issuingAuthority: String(profile.issuingAuthority || ''),
    verificationLink: /^https?:\/\/.+/i.test(imgUrl) ? imgUrl : '',
    licenseFileName: '',
    licenseNo: String(profile.licenseNo || ''),
    weight: profile.weight == null ? '55' : String(profile.weight),
    ranking: String(profile.ranking || 'BEGINNER').toUpperCase(),
    imgUrl
  };
}

function validateProfileForm(form) {
  const errors = {};
  const weight = Number(form.weight || 55);
  const verificationLink = form.verificationLink.trim();

  if (!form.applicantFullName.trim()) {
    errors.applicantFullName = 'Full name is required.';
  }

  if (!form.applicantEmail.trim()) {
    errors.applicantEmail = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicantEmail.trim())) {
    errors.applicantEmail = 'Email is invalid.';
  }

  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required.';
  }

  if (!form.trainerName.trim()) {
    errors.trainerName = 'Trainer name is required.';
  }

  if (!form.trainerEmail.trim()) {
    errors.trainerEmail = 'Trainer email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.trainerEmail.trim())) {
    errors.trainerEmail = 'Trainer email is invalid.';
  }

  if (!form.stableAddress.trim()) {
    errors.stableAddress = 'Academy or stable address is required.';
  }

  if (!form.issuingAuthority.trim()) {
    errors.issuingAuthority = 'Issuing authority is required.';
  }

  if (verificationLink && !/^https?:\/\/.+/i.test(verificationLink)) {
    errors.verificationLink = 'Verification link must start with http:// or https://';
  }

  if (!form.licenseFileName.trim()) {
    errors.licenseFileName = 'Jockey licence file is required.';
  }

  if (!Number.isFinite(weight) || weight < 35 || weight > 90) {
    errors.weight = 'Jockey weight must be between 35 and 90 kg.';
  }

  if (!rankingOptions.includes(form.ranking)) {
    errors.ranking = 'Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL or ELITE.';
  }

  return errors;
}

function toPayload(form) {
  const filePlaceholderUrl = form.licenseFileName
    ? `https://example.com/jockey-licences/${encodeURIComponent(form.licenseFileName)}`
    : '';

  return {
    licenseNo: form.licenseNo.trim(),
    weight: Number(form.weight || 55),
    ranking: form.ranking || 'BEGINNER',
    imgUrl: form.verificationLink.trim() || form.imgUrl.trim() || filePlaceholderUrl
  };
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

export default function JockeyDashboard({ currentUser, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
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
  const profileStatus = String(profile?.status || '').toUpperCase();
  const isProfileActive = Boolean(profile) && profileStatus === 'ACTIVE';
  const profileNotice = getProfileNotice(profile, isLoadingProfile);

  const tournamentById = useMemo(() => new Map(tournaments.map((tournament) => [String(tournament.tournamentId ?? tournament.tournamentID ?? tournament.id), tournament])), [tournaments]);

  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);

  const latestInvitations = useMemo(() => invitations.slice(0, 5), [invitations]);

  function loadProfile() {
    setIsLoadingProfile(false);
    setPageError('');
  }

  function loadInvitations() {
    setIsLoadingInvitations(false);
    setPageError('');
  }

  function reloadData() {
    setMessage('');
    setProfileSubmitError('');
    setPageError('');
    setIsLoadingProfile(false);
    setIsLoadingInvitations(false);
  }

  useEffect(() => {
    // Frontend only: không gọi API khi mở dashboard.
    setIsLoadingProfile(false);
    setIsLoadingInvitations(false);
  }, []);

  function handleNavigate(section) {
    if (isJockeySection(section)) {
      setActiveSection(section);
      setPageError('');
      setProfileSubmitError('');
      setMessage('');
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

  function handleProfileSubmit(event) {
    event.preventDefault();

    const errors = validateProfileForm(profileForm);
    setProfileErrors(errors);
    setProfileSubmitError('');
    setPageError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    const mockSavedProfile = {
      profileId: profile?.profileId || 'LOCAL-PROFILE',
      fullName: profileForm.applicantFullName,
      email: profileForm.applicantEmail,
      phoneNumber: profileForm.phoneNumber,
      trainerName: profileForm.trainerName,
      trainerEmail: profileForm.trainerEmail,
      stableAddress: profileForm.stableAddress,
      issuingAuthority: profileForm.issuingAuthority,
      licenseNo: 'LOCAL-LICENCE',
      weight: Number(profileForm.weight || 55),
      ranking: profileForm.ranking || 'BEGINNER',
      imgUrl: profileForm.verificationLink || profileForm.licenseFileName,
      status: 'UNDER_REVIEW'
    };

    setProfile(mockSavedProfile);
    setProfileForm(toProfileForm(mockSavedProfile, currentUser));
    setMessage('Đã lưu hồ sơ tạm thời trên giao diện. Chưa gọi API backend.');
  }

  function handleDeactivateProfile() {
    const confirmed = window.confirm('Bạn có chắc muốn xóa hồ sơ tạm thời hiện tại?');
    if (!confirmed) return;

    setProfileSubmitError('');
    setPageError('');
    setMessage('');
    setProfile(null);
    setProfileForm(emptyProfileForm(currentUser));
    setMessage('Đã xóa hồ sơ tạm thời trên giao diện. Chưa gọi API backend.');
  }

  function handleInvitationAction(invitation, action) {
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
      <form className="owner-panel owner-form licence-application-form" onSubmit={handleProfileSubmit} noValidate>
        <div className="owner-panel-header">
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
                disabled={isSavingProfile}
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
                disabled={isSavingProfile}
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
                disabled={isSavingProfile}
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
                disabled={isSavingProfile}
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
                disabled={isSavingProfile}
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
              <select
                className={profileErrors.issuingAuthority ? 'input has-error' : 'input'}
                id="issuingAuthority"
                name="issuingAuthority"
                value={profileForm.issuingAuthority}
                onChange={handleProfileChange}
                disabled={isSavingProfile}
              >
                {issuingAuthorityOptions.map((authority) => (
                  <option key={authority.value || 'empty'} value={authority.value}>
                    {authority.label}
                  </option>
                ))}
              </select>
              {profileErrors.issuingAuthority && (
                <p className="field-error">{profileErrors.issuingAuthority}</p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="verificationLink">
                Verification Link
              </label>
              <input
                className={profileErrors.verificationLink ? 'input has-error' : 'input'}
                id="verificationLink"
                name="verificationLink"
                type="url"
                placeholder="https://authority.org/jockeys/your-id"
                value={profileForm.verificationLink}
                onChange={handleProfileChange}
                disabled={isSavingProfile}
              />
              <p className="field-help">Optional — public licence or profile page.</p>
              {profileErrors.verificationLink && (
                <p className="field-error">{profileErrors.verificationLink}</p>
              )}
            </div>

            <div className="jockey-hidden-backend-fields" aria-hidden="true">
              <input name="weight" type="hidden" value={profileForm.weight} readOnly />
              <input name="ranking" type="hidden" value={profileForm.ranking} readOnly />
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
              disabled={isSavingProfile}
            />

            <p className="field-help">JPG, PNG, or PDF (max 10MB).</p>

            {profileErrors.licenseFileName && (
              <p className="field-error">{profileErrors.licenseFileName}</p>
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
      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Giải đấu</th>
              <th>Thời gian</th>
              <th>Deadline đăng ký</th>
              <th>Ngựa</th>
              <th>Owner</th>
              <th>Ngày tạo</th>
              <th>Hết hạn</th>
              <th>Trạng thái</th>
              <th>Đăng ký</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((invitation) => {
              const invitationId = getInvitationId(invitation);
              const isPending = String(invitation.status || '').toUpperCase() === 'PENDING';
              const acceptDisabled = !isPending || !isProfileActive || actionId === invitationId;

              return (
                <tr key={invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
                  <td>{invitationId || 'N/A'}</td>
                  <td>
                    <strong>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</strong>
                    {invitation.message && <p className="table-subtext">{invitation.message}</p>}
                  </td>
                  <td>{formatTournamentDateRange(invitation)}</td>
                  <td>{formatDate(getInvitationRegistrationDeadline(invitation, tournamentById))}</td>
                  <td>
                    <strong>{invitation.horseName || invitation.horseId || 'N/A'}</strong>
                    <button className="table-button mt-2" type="button" onClick={() => setSelectedInvitation(invitation)}>
                      Xem thông tin ngựa
                    </button>
                  </td>
                  <td>{invitation.ownerName || invitation.ownerId || 'N/A'}</td>
                  <td>{formatDate(invitation.createdAt)}</td>
                  <td>{formatDate(invitation.expiredAt)}</td>
                  <td><span className={`status-badge ${statusClass(invitation.status)}`}>{formatDisplayLabel(invitation.status)}</span></td>
                  <td><span className={`status-badge ${statusClass(invitation.registrationStatus)}`}>{formatDisplayLabel(invitation.registrationStatus)}</span></td>
                  <td>
                    {isPending ? (
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => handleInvitationAction(invitation, 'accept')}
                          disabled={acceptDisabled}
                          title={!isProfileActive ? 'Hồ sơ chưa ở trạng thái ACTIVE nên không thể chấp nhận lời mời này.' : 'Chấp nhận lời mời'}
                        >
                          Accept
                        </button>
                        <button type="button" className="danger-action" onClick={() => handleInvitationAction(invitation, 'reject')} disabled={actionId === invitationId}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="readonly-note">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
        <section className="owner-stack">
          <section className="owner-stats-grid">
            <StatCard label="Trạng thái hồ sơ" value={profile ? formatDisplayLabel(profile.status) : 'Chưa có hồ sơ'} description={profile ? `Giấy phép: ${profile.licenseNo || 'Chưa cập nhật'}` : 'Tạo hồ sơ jockey'} highlight />
            <StatCard label="Xếp hạng" value={formatDisplayLabel(profile?.ranking)} description="Xếp hạng hiện tại trong hồ sơ" />
            <StatCard label="Lời mời đang chờ phản hồi" value={countByStatus(invitations, 'PENDING')} description="Lời mời đang chờ bạn phản hồi" />
            <StatCard label="Lời mời đã chấp nhận" value={countByStatus(invitations, 'ACCEPTED')} description="Lời mời bạn đã chấp nhận" />
          </section>

          <section className="owner-overview-grid">
            <div className="owner-panel hero-owner-panel">
              <div>
                <p className="eyebrow">Bảng điều khiển jockey</p>
                <h2>Quản lý hồ sơ và lời mời</h2>
                <p>Hồ sơ của bạn phải được admin xác minh trước khi có thể chấp nhận lời mời thi đấu.</p>
              </div>
              <div className="owner-shortcut-actions">
                <button className="primary-button owner-hero-action" type="button" onClick={() => setActiveSection('profile')}>Mở hồ sơ</button>
                <button className="outline-button owner-hero-action" type="button" onClick={() => setActiveSection('invitations')}>Xem lời mời</button>
              </div>
            </div>

            <div className="owner-panel compact-panel">
              <div className="owner-panel-header">
                <div>
                  <h2>Lời mời mới nhất</h2>
                  <p>Hiển thị tối đa năm lời mời mới nhất.</p>
                </div>
              </div>
              <div className="owner-mini-list">
                {latestInvitations.length === 0 ? (
                  <p className="table-empty">Chưa có lời mời.</p>
                ) : latestInvitations.map((invitation) => (
                  <div key={invitation.invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
                    <span>{invitation.tournamentName || `Tournament ${invitation.tournamentId || ''}`}</span>
                    <strong>{formatDisplayLabel(invitation.status)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      )}

      {activeSection === 'profile' && (
        <section className="owner-stack">
          <div className="owner-section-toolbar">
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
            <div className="owner-panel">
              <p className="table-empty">Đang tải hồ sơ...</p>
            </div>
          ) : (
            renderProfileForm()
          )}
        </section>
      )}

      {activeSection === 'invitations' && (
        <section className="owner-stack">
          <section className="owner-panel">
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

      <InvitationDetailModal
        invitation={selectedInvitation}
        tournamentById={tournamentById}
        onClose={() => setSelectedInvitation(null)}
      />
    </AppShell>
  );
}
