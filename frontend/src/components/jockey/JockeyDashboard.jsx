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
  getJockeyInvitationDetail,
  getJockeyProfile,
  getHorsePerformance as fetchHorsePerformance,
  rejectJockeyInvitation,
  toJockeyProfilePayload,
  updateJockeyProfile
} from '../../services/jockeyService';
import { updateState } from '../../services/mockStore';

import { formatDate, formatDisplayLabel } from '../../lib';

const jockeyNavItems = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'profile', label: 'Hồ sơ', icon: '🧑‍✈️' },
  { key: 'invitations', label: 'Lời mời', icon: '✉️' },
  { key: 'wallet', labelKey: 'wallet', icon: Wallet }
];

const rankingOptions = ['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL', 'ELITE'];
const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'APPROVED', 'REJECTED', 'EXPIRED'];
const INVITATION_TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Declined' },
  { key: 'EXPIRED', label: 'Expired' }
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
    breed: firstDefined(readHorseValue(invitation, horse, 'breed', 'horseBreed'), horse.breeding),
    gender: firstDefined(readHorseValue(invitation, horse, 'gender', 'horseGender'), horse.sex),
    color: firstDefined(readHorseValue(invitation, horse, 'color', 'horseColor'), horse.colour),
    dayOfBirth: readHorseValue(invitation, horse, 'dayOfBirth', 'horseDayOfBirth'),
    weight: readHorseValue(invitation, horse, 'weight', 'horseWeight'),
    healthCertExpiry: readHorseValue(invitation, horse, 'healthCertExpiry', 'horseHealthCertExpiry'),
    status: readHorseValue(invitation, horse, 'status', 'horseStatus'),
    imgUrl: readHorseValue(invitation, horse, 'imgUrl', 'horseImgUrl'),
    totalRaces: readHorseValue(invitation, horse, 'totalRaces', 'horseTotalRaces'),
    totalWins: readHorseValue(invitation, horse, 'totalWins', 'horseTotalWins'),
    top1Count: readHorseValue(invitation, horse, 'top1Count', 'horseTop1Count'),
    top2Count: readHorseValue(invitation, horse, 'top2Count', 'horseTop2Count'),
    top3Count: readHorseValue(invitation, horse, 'top3Count', 'horseTop3Count'),
    violationCount: readHorseValue(invitation, horse, 'violationCount', 'horseViolationCount'),
    disqualifiedCount: readHorseValue(invitation, horse, 'disqualifiedCount', 'horseDisqualifiedCount'),
    recentRaces: invitation.horseRecentRaces || horse.recentRaces || horse.raceHistory || []
  };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Chưa có dữ liệu';
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
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

function calculateRate(part, total) {
  const totalValue = toNumber(total);
  if (!totalValue) return null;
  return (toNumber(part) / totalValue) * 100;
}

function getHorsePerformance(horse) {
  const totalRaces = toNumber(horse.totalRaces);
  const wins = toNumber(firstDefined(horse.totalWins, horse.top1Count));
  const top1 = toNumber(firstDefined(horse.top1Count, horse.totalWins));
  const top2 = toNumber(horse.top2Count);
  const top3 = toNumber(horse.top3Count);
  const top3Total = top1 + top2 + top3;

  return {
    totalRaces,
    wins,
    winRate: calculateRate(wins, totalRaces),
    top3Rate: calculateRate(top3Total, totalRaces),
    violationCount: toNumber(horse.violationCount),
    disqualifiedCount: toNumber(horse.disqualifiedCount),
    recentRaces: Array.isArray(horse.recentRaces) ? horse.recentRaces : []
  };
}

function getInvitationRaceDetails(invitation, tournamentById) {
  const tournament = invitation.tournament || tournamentById.get(String(invitation.tournamentId)) || {};
  const race = invitation.race || invitation.raceInfo || invitation.assignedRace || (Array.isArray(tournament.races) ? tournament.races[0] : {}) || {};
  return {
    name: firstDefined(invitation.raceName, invitation.assignedRaceName, race.raceName, race.name, invitation.tournamentName, tournament.tournamentName, invitation.tournamentId),
    startTime: firstDefined(invitation.raceStartTime, race.raceStartTime, race.startTime, race.scheduledAt, invitation.tournamentStartDate, tournament.startDate),
    endTime: firstDefined(invitation.raceEndTime, race.raceEndTime, race.endTime, invitation.tournamentEndDate, tournament.endDate),
    track: firstDefined(invitation.trackName, invitation.raceTrackName, race.trackName, race.track, race.venue, tournament.venue, invitation.venue),
    distance: firstDefined(invitation.distance, invitation.raceDistance, race.distance),
    prize: firstDefined(invitation.prize, invitation.prizePool, race.prize, race.prizePool, tournament.prizePool),
    fee: firstDefined(invitation.entryFee, invitation.tournamentEntryFee, tournament.entryFee),
    requirement: firstDefined(invitation.requirement, invitation.conditions, tournament.conditions, 'Chưa có dữ liệu'),
    deadline: getInvitationRegistrationDeadline(invitation, tournamentById)
  };
}

function getOwnerTeamDetails(invitation) {
  return {
    name: firstDefined(invitation.ownerName, invitation.teamName, invitation.owner?.fullName, invitation.ownerEmail, invitation.ownerId, 'N/A'),
    experience: firstDefined(invitation.ownerExperience, invitation.ownerTotalRaces, invitation.teamExperience, 'Chưa có dữ liệu'),
    reputation: firstDefined(invitation.ownerReputation, invitation.teamReputation, invitation.ownerRating, 'Chưa có dữ liệu')
  };
}

function createOwnerInvitationNotification(invitation, status, reason = '') {
  const ownerId = Number(firstDefined(
    invitation.ownerId,
    invitation.ownerID,
    invitation.ownerUserId,
    invitation.ownerUserID,
    invitation.owner?.userID,
    invitation.owner?.userId,
    invitation.owner?.id
  ));
  if (!ownerId) return;

  const horseName = firstDefined(invitation.horseName, invitation.horse?.horseName, invitation.horseId, 'ngựa của bạn');
  const tournamentName = firstDefined(invitation.tournamentName, invitation.raceName, invitation.tournamentId, 'giải đấu');
  const jockeyName = firstDefined(invitation.jockeyName, invitation.jockey?.fullName, invitation.jockey?.email, 'Jockey');
  const isAccepted = status === 'ACCEPTED';

  updateState((state) => {
    const notifications = Array.isArray(state.notifications) ? state.notifications : [];
    const nextId = notifications.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;

    notifications.push({
      id: nextId,
      userID: ownerId,
      title: isAccepted ? 'Jockey đã chấp nhận lời mời' : 'Jockey đã từ chối lời mời',
      message: isAccepted
        ? `${jockeyName} đã chấp nhận lời mời tham gia ${tournamentName} với ${horseName}.`
        : `${jockeyName} đã từ chối lời mời tham gia ${tournamentName} với ${horseName}.${reason ? ` Lý do: ${reason}` : ''}`,
      createdAt: new Date().toLocaleString('vi-VN'),
      read: false
    });

    state.notifications = notifications;
    return state;
  });
}

function hasHorseDetailData(details) {
  return Boolean(details.breed || details.gender || details.color || details.dayOfBirth || details.weight || details.healthCertExpiry || details.status || details.imgUrl);
}

function InvitationDetailModal({ invitation, tournamentById, isLoading, error, onClose }) {
  if (!invitation) return null;

  const horse = getInvitationHorseDetails(invitation);
  const race = getInvitationRaceDetails(invitation, tournamentById);
  const ownerTeam = getOwnerTeamDetails(invitation);
  const performance = getHorsePerformance(horse);
  const registrationDeadline = getInvitationRegistrationDeadline(invitation, tournamentById);
  const hasExtraHorseData = hasHorseDetailData(horse);

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="jockey-invitation-detail-modal w-full max-w-5xl rounded-lg bg-cream-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Chi tiết lời mời</p>
            <h2>{horse.horseName || `Horse ${horse.horseId || ''}`}</h2>
            <p>Xem thông tin ngựa và deadline đăng ký trước khi chấp nhận lời mời.</p>
          </div>
          <button className="outline-button compact-button" type="button" onClick={onClose}>Đóng</button>
        </div>

        {isLoading && <div className="admin-alert info" role="status">Đang tải thông tin đầy đủ từ backend...</div>}
        {error && <div className="admin-alert error" role="alert">{error}</div>}

        <div className="jockey-invitation-detail-sections">
          <section className="jockey-invitation-detail-section">
            <h3>Race</h3>
            <div className="detail-grid">
              <span>Tournament/race</span>
              <strong>{race.name || 'N/A'}</strong>
              <span>Thời gian</span>
              <strong>{formatDate(race.startTime)}{race.endTime ? ` - ${formatDate(race.endTime)}` : ''}</strong>
              <span>Track</span>
              <strong>{race.track || 'Chưa có dữ liệu'}</strong>
              <span>Distance</span>
              <strong>{race.distance ? `${race.distance}m` : 'Chưa có dữ liệu'}</strong>
              <span>Prize/Fee</span>
              <strong>{firstDefined(race.prize, race.fee, 'Chưa có dữ liệu')}</strong>
              <span>Requirement</span>
              <strong>{formatRequirement(race.requirement)}</strong>
              <span>Deadline phản hồi</span>
              <strong>{formatDate(firstDefined(invitation.expiredAt, registrationDeadline))}</strong>
            </div>
          </section>

          <section className="jockey-invitation-detail-section">
            <h3>Horse performance</h3>
            <div className="detail-grid">
              <span>Total races</span>
              <strong>{performance.totalRaces}</strong>
              <span>Win rate</span>
              <strong>{formatPercent(performance.winRate)}</strong>
              <span>Top 3 rate</span>
              <strong>{formatPercent(performance.top3Rate)}</strong>
              <span>Vi phạm</span>
              <strong>{performance.violationCount} / DQ {performance.disqualifiedCount}</strong>
              <span>Eligibility</span>
              <strong>{horse.status ? formatDisplayLabel(horse.status) : 'Chưa có dữ liệu'}</strong>
            </div>
          </section>

          <section className="jockey-invitation-detail-section">
            <h3>Phong độ 3-5 race gần nhất</h3>
            {performance.recentRaces.length > 0 ? (
              <div className="jockey-recent-race-list">
                {performance.recentRaces.slice(0, 5).map((raceItem, index) => (
                  <div key={`${raceItem.raceId || raceItem.name || index}`}>
                    <strong>{raceItem.raceName || raceItem.name || `Race ${index + 1}`}</strong>
                    <span>{formatDate(raceItem.raceStartTime || raceItem.date)} · Hạng {firstDefined(raceItem.finishPosition, raceItem.position, 'N/A')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="drawer-empty-note">Chưa có dữ liệu race gần đây.</p>
            )}
          </section>

          <section className="jockey-invitation-detail-section">
            <h3>Owner/team</h3>
            <div className="detail-grid">
              <span>Tên</span>
              <strong>{ownerTeam.name}</strong>
              <span>Kinh nghiệm</span>
              <strong>{ownerTeam.experience}</strong>
              <span>Độ uy tín</span>
              <strong>{ownerTeam.reputation}</strong>
            </div>
          </section>
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
  const [isLoadingInvitationDetail, setIsLoadingInvitationDetail] = useState(false);
  const [invitationDetailError, setInvitationDetailError] = useState('');
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
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
      const horseId = firstDefined(detailHorse.horseId, detailInvitation.horseId, invitation.horseId);
      const horsePerformance = horseId
        ? await fetchHorsePerformance(horseId).catch(() => null)
        : null;

      setSelectedInvitation((current) => {
        if (!current || getInvitationId(current) !== invitationId) return current;

        return {
          ...current,
          ...detailInvitation,
          tournament: detail?.tournament || current.tournament,
          horse: {
            ...detailHorse,
            ...(horsePerformance || {})
          },
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
      const nextInvitation = { ...invitation, ...updatedInvitation };

      setInvitations((current) =>
        current.map((item) =>
          getInvitationId(item) === invitationId ? { ...item, ...updatedInvitation } : item
        )
      );

      createOwnerInvitationNotification(nextInvitation, action === 'accept' ? 'ACCEPTED' : 'REJECTED');
      setMessage(action === 'accept' ? 'Đã chấp nhận lời mời và gửi thông báo cho owner.' : 'Đã từ chối lời mời và gửi thông báo cho owner.');
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể xử lý lời mời.'));
    } finally {
      setActionId(null);
    }
  }

  async function submitDeclineInvitation(event) {
    event.preventDefault();
    if (!declineTarget) return;

    const invitationId = getInvitationId(declineTarget);
    if (!invitationId) {
      setPageError('Không tìm thấy mã lời mời.');
      return;
    }

    setPageError('');
    setMessage('');
    setActionId(invitationId);

    try {
      const updatedInvitation = await rejectJockeyInvitation(invitationId);
      const trimmedReason = declineReason.trim();
      const nextInvitation = { ...declineTarget, ...updatedInvitation, declineReason: trimmedReason || null };
      setInvitations((current) =>
        current.map((item) =>
          getInvitationId(item) === invitationId
            ? { ...item, ...updatedInvitation, declineReason: trimmedReason || null }
            : item
        )
      );
      createOwnerInvitationNotification(nextInvitation, 'REJECTED', trimmedReason);
      setMessage('Đã từ chối lời mời và gửi thông báo cho owner.');
      setDeclineTarget(null);
      setDeclineReason('');
    } catch (error) {
      setPageError(getErrorText(error, 'Không thể từ chối lời mời.'));
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
          const race = getInvitationRaceDetails(invitation, tournamentById);
          const ownerTeam = getOwnerTeamDetails(invitation);
          const horse = getInvitationHorseDetails(invitation);

          return (
            <article className="jockey-invitation-card" key={invitationId || `${invitation.tournamentId}-${invitation.horseId}`}>
              <div className="jockey-invitation-main">
                <div className="jockey-invitation-title">
                  <span className="jockey-id-chip">#{invitationId || 'N/A'}</span>
                  <div>
                    <h3>{race.name || invitation.tournamentName || invitation.tournamentId || 'N/A'}</h3>
                    {invitation.message && <p>{invitation.message}</p>}
                  </div>
                </div>

                <div className="jockey-invitation-meta">
                  <div>
                    <span>Race time</span>
                    <strong>{formatDate(race.startTime)}</strong>
                  </div>
                  <div>
                    <span>Track</span>
                    <strong>{race.track || 'Chưa có dữ liệu'}</strong>
                  </div>
                  <div>
                    <span>Distance</span>
                    <strong>{race.distance ? `${race.distance}m` : 'Chưa có dữ liệu'}</strong>
                  </div>
                  <div>
                    <span>Owner/team</span>
                    <strong>{ownerTeam.name}</strong>
                  </div>
                  <div>
                    <span>Horse</span>
                    <strong>{horse.horseName || horse.horseId || 'N/A'}</strong>
                  </div>
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
                  <strong>{horse.horseName || horse.horseId || 'N/A'}</strong>
                  <button className="table-button" type="button" onClick={() => openInvitationDetail(invitation)}>
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
                    <button type="button" className="outline-button danger-action" onClick={() => { setDeclineTarget(invitation); setDeclineReason(''); }} disabled={actionId === invitationId}>
                      Decline
                    </button>
                    <button type="button" className="outline-button" onClick={() => openInvitationDetail(invitation)}>
                      Message Owner
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
              <div className="jockey-invitation-tabs" role="tablist" aria-label="Invitation status">
                {INVITATION_TABS.map((tab) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === tab.key}
                    className={statusFilter === tab.key ? 'active' : ''}
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    {tab.label}
                    <span>{countByStatus(invitations, tab.key)}</span>
                  </button>
                ))}
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === 'ALL'}
                  className={statusFilter === 'ALL' ? 'active' : ''}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All
                  <span>{invitations.length}</span>
                </button>
              </div>
            </div>
            {renderInvitationList()}
          </section>
        </section>
      )}

      {activeSection === 'wallet' && (
        <WalletTransferPanel currentUser={currentUser} role="JOCKEY" />
      )}

      {declineTarget && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={() => setDeclineTarget(null)}>
          <form className="jockey-decline-modal" onSubmit={submitDeclineInvitation} onClick={(event) => event.stopPropagation()}>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Decline invitation</p>
                <h2>Từ chối lời mời</h2>
                <p>{declineTarget.tournamentName || declineTarget.tournamentId || 'Invitation'}</p>
              </div>
              <button className="outline-button compact-button" type="button" onClick={() => setDeclineTarget(null)}>
                Đóng
              </button>
            </div>
            <label className="field-label" htmlFor="declineReason">Lý do từ chối</label>
            <textarea
              className="input textarea-input"
              id="declineReason"
              rows={4}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              placeholder="Ví dụ: lịch thi đấu bị trùng, cần thêm thông tin về ngựa..."
            />
            <p className="field-help">Lý do này hiện được lưu ở giao diện sau khi từ chối; backend hiện tại chưa nhận thêm trường lý do.</p>
            <div className="admin-form-actions">
              <button className="outline-button" type="button" onClick={() => setDeclineTarget(null)}>Hủy</button>
              <button className="primary-button danger-action" type="submit" disabled={actionId === getInvitationId(declineTarget)}>
                {actionId === getInvitationId(declineTarget) ? 'Đang xử lý...' : 'Decline'}
              </button>
            </div>
          </form>
        </div>
      )}

      <InvitationDetailModal
        invitation={selectedInvitation}
        tournamentById={tournamentById}
        isLoading={isLoadingInvitationDetail}
        error={invitationDetailError}
        onClose={() => setSelectedInvitation(null)}
      />
    </AppShell>
  );
}
