import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Eye,
  Filter,
  Flag,
  MapPin,
  MoreVertical,
  RefreshCw,
  Send,
  ShieldCheck,
  Trophy,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { getAllUsers } from '../../services/userService';
import {
  cancelOwnerInvitation,
  getOpenOwnerTournaments,
  getOwnerHorses,
  getOwnerInvitations,
  inviteJockey,
  submitOwnerTournamentRegistration
} from '../../services/ownerService';
import { confirmVnpayReturn } from '../../services/paymentService';
import { getTournaments } from '../../services/eventService';
import API_BASE_URL from '../../configs/apiConfig';
import { formatDate, formatDisplayLabel, getHorseId, getHorseName, getUserId, getUserRole } from '../../lib';
import ConfirmModal from '../common/ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';

const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'];
const OWNER_CANCELLED_INVITATION_STORAGE_KEY = 'owner_cancelled_jockey_invitations';
const OWNER_REGISTRATION_PAYMENT_PENDING_KEY = 'owner_registration_payment_pending';

function isRegistrationPaymentReturn(params) {
  if (!params.has('vnp_TxnRef') && !params.has('vnp_SecureHash')) return false;
  if (String(params.get('vnp_TxnRef') || '').toUpperCase().startsWith('REG-')) return true;

  try {
    return window.localStorage.getItem(OWNER_REGISTRATION_PAYMENT_PENDING_KEY) === 'true';
  } catch {
    return false;
  }
}

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0
});

function getInvitationId(invitation) {
  return invitation?.invitationId ?? invitation?.invitationID ?? invitation?.id ?? '';
}

function readOwnerCancelledInvitationIds() {
  if (typeof window === 'undefined') return new Set();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(OWNER_CANCELLED_INVITATION_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.map((value) => String(value)) : []);
  } catch {
    return new Set();
  }
}

function storeOwnerCancelledInvitationId(invitationId) {
  if (typeof window === 'undefined' || !invitationId) return;

  const ids = readOwnerCancelledInvitationIds();
  ids.add(String(invitationId));
  window.localStorage.setItem(OWNER_CANCELLED_INVITATION_STORAGE_KEY, JSON.stringify([...ids]));
}

function applyOwnerCancelledInvitationOverrides(invitations) {
  const cancelledIds = readOwnerCancelledInvitationIds();
  if (!cancelledIds.size) return invitations;

  return invitations.map((invitation) => {
    const invitationId = getInvitationId(invitation);
    if (!cancelledIds.has(String(invitationId))) return invitation;

    return {
      ...invitation,
      status: 'CANCELLED',
      registrationStatus: invitation.registrationStatus === 'PENDING' ? 'CANCELLED' : invitation.registrationStatus,
      respondedAt: invitation.respondedAt || new Date().toISOString()
    };
  });
}

function getTournamentId(tournament) {
  return tournament?.tournamentId ?? tournament?.tournamentID ?? tournament?.id;
}

function getTournamentName(tournament) {
  return String(tournament?.tournamentName ?? tournament?.name ?? '').trim();
}

function getTournamentVenue(tournament, t) {
  return tournament?.venue || tournament?.location || t?.('ownerRaceVenueNotUpdated') || 'Chưa cập nhật địa điểm';
}

function getRegistrationDeadline(tournament) {
  return tournament?.registrationDeadline ?? tournament?.registrationCloseAt ?? null;
}

function getRegistrationOpenAt(tournament) {
  return tournament?.registrationOpenAt ?? tournament?.registrationOpen ?? null;
}

function getTournamentImageUrl(tournament) {
  const value = String(tournament?.venueImageUrl || tournament?.venueImagePath || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function emptyInvitationForm() {
  return {
    tournamentId: '',
    horseId: '',
    jockeyId: '',
    expiredAt: '',
    message: ''
  };
}

function emptyRegistrationForm() {
  return {
    tournamentId: '',
    horseId: '',
    jockeyId: ''
  };
}

function getDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function toDateLocalValue(value) {
  const date = value instanceof Date ? value : getDateTime(value);
  if (!date) return '';

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function getDateLocalMinValue() {
  return toDateLocalValue(new Date());
}

function toInvitationExpiryDateTime(value) {
  if (!value) return null;
  return `${value}T23:58:00`;
}

function getInvitationExpiryDate(value) {
  return getDateTime(toInvitationExpiryDateTime(value));
}

function formatDateTime(value, t, language = 'vi') {
  const date = getDateTime(value);
  if (!date) return t?.('notUpdated') || 'Chưa cập nhật';

  return date.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(value) {
  const amount = Number(value);
  return `${vndFormatter.format(Number.isFinite(amount) ? amount : 0)} VND`;
}

function formatDateRange(startDate, endDate, t) {
  if (!startDate && !endDate) return t?.('notUpdated') || 'Chưa cập nhật';
  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  return formatDate(startDate || endDate);
}

function formatStatus(status, t) {
  const normalized = String(status || '').toUpperCase();
  if (!normalized) return t?.('notUpdated') || 'Chưa cập nhật';
  const translated = t?.(`status_${normalized}`);
  return translated && translated !== `status_${normalized}` ? translated : formatDisplayLabel(status);
}

function isActiveHorse(horse) {
  return String(horse.status || '').toUpperCase() === 'ACTIVE';
}

function hasParticipatedHorse(horse) {
  return horse?.participated === true || String(horse?.participated || '').toUpperCase() === 'TRUE';
}

function getHorseRegistrations(horse) {
  const registrations = firstDefined(horse?.registrations, horse?.raceRegistrations, horse?.tournamentRegistrations, []);
  return Array.isArray(registrations) ? registrations : [];
}

function hasRegisteredHorse(horse) {
  return Number(horse?.registrationCount || horse?.registrationsCount || 0) > 0
    || getHorseRegistrations(horse).some((registration) => {
      const status = firstDefined(
        registration.status,
        registration.approvalStatus,
        registration.registrationStatus,
        registration.paymentStatus
      );
      return isLockedRegistrationStatus(status);
    });
}

function isAvailableTournament(tournament) {
  const status = String(tournament.status || '').toUpperCase();
  const deadline = getDateTime(getRegistrationDeadline(tournament));
  const isCancelled = status.includes('CANCEL');
  const isOpen = status === 'OPEN' || status === 'OPEN_REGISTRATION' || status === 'OPEN_FOR_REGISTRATION' || status.includes('REGISTRATION');

  if (isCancelled) return false;
  if (deadline && deadline.getTime() < Date.now()) return false;
  return isOpen;
}

function getInvitationRegistrationDeadline(invitation, tournamentById) {
  return invitation.registrationDeadline
    ?? invitation.tournamentRegistrationDeadline
    ?? getRegistrationDeadline(tournamentById.get(String(invitation.tournamentId)))
    ?? null;
}

function getInvitationJockeyId(invitation) {
  return invitation.jockeyId ?? invitation.jockeyID ?? invitation.jockey?.jockeyId ?? invitation.jockey?.id;
}

function getInvitationHorseId(invitation) {
  return invitation.horseId ?? invitation.horseID ?? invitation.horse?.horseId ?? invitation.horse?.id;
}

function getInvitationTournamentId(invitation) {
  return invitation.tournamentId ?? invitation.tournamentID ?? invitation.tournament?.tournamentId ?? invitation.tournament?.id;
}

function getInvitationJockeyName(invitation) {
  return invitation.jockeyName || invitation.jockey?.fullName || invitation.jockey?.email || `Jockey ${getInvitationJockeyId(invitation) || ''}`;
}

function getInvitationPaymentStatus(invitation) {
  const explicitStatus = firstDefined(
    invitation?.paymentStatus,
    invitation?.registrationPaymentStatus,
    invitation?.payment?.status
  );
  if (explicitStatus) return String(explicitStatus).toUpperCase();

  // Older API versions exposed only registrationStatus. Use it only when it is
  // unmistakably a payment state; PENDING/APPROVED are approval states.
  const legacyStatus = String(invitation?.registrationStatus || '').toUpperCase();
  return ['PAID', 'UNPAID', 'FAILED', 'REFUNDED'].includes(legacyStatus) ? legacyStatus : '';
}

function getInvitationApprovalStatus(invitation) {
  const explicitStatus = firstDefined(
    invitation?.approvalStatus,
    invitation?.registrationApprovalStatus
  );
  if (explicitStatus) return String(explicitStatus).toUpperCase();

  const legacyStatus = String(invitation?.registrationStatus || '').toUpperCase();
  return ['PAID', 'UNPAID', 'FAILED', 'REFUNDED'].includes(legacyStatus) ? '' : legacyStatus;
}

function hasRegistrationStatus(invitation) {
  return Boolean(
    invitation?.registrationId
    || invitation?.registrationNo
    || getInvitationPaymentStatus(invitation)
    || getInvitationApprovalStatus(invitation)
  );
}

function isPaidStatus(status) {
  return String(status || '').toUpperCase() === 'PAID';
}

function isUnpaidStatus(status) {
  return ['UNPAID', 'FAILED'].includes(String(status || '').toUpperCase());
}

function canStartInvitationPayment(invitation) {
  if (!hasRegistrationStatus(invitation)) return true;

  const approvalStatus = getInvitationApprovalStatus(invitation);
  return ['PENDING', 'APPROVED'].includes(approvalStatus)
    && isUnpaidStatus(getInvitationPaymentStatus(invitation));
}

function isLockedInvitationStatus(status) {
  return ['PENDING', 'ACCEPTED', 'APPROVED'].includes(String(status || '').toUpperCase());
}

function isClosedInvitationStatus(status) {
  return ['CANCELLED', 'CANCELED', 'REJECTED', 'DECLINED', 'EXPIRED'].includes(String(status || '').toUpperCase());
}

function isLockedRegistrationStatus(status) {
  return ['PENDING', 'ACCEPTED', 'APPROVED', 'CONFIRMED', 'PAID', 'UNPAID'].includes(String(status || '').toUpperCase());
}

function isAcceptedInvitation(invitation) {
  return ['ACCEPTED', 'APPROVED'].includes(String(invitation?.status || '').toUpperCase());
}

function hasRegisteredInvitation(invitation) {
  return hasRegistrationStatus(invitation);
}

function isAlreadyPaidError(message) {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('already been paid')
    || normalized.includes('already paid')
    || normalized.includes('đã được thanh toán')
    || normalized.includes('đã thanh toán');
}

function isRegistrationSummaryRow(item) {
  return item?.rowType === 'registered-horse';
}

function isActiveHorseInvitation(invitation) {
  return !isClosedInvitationStatus(invitation?.status)
    && (
      isLockedInvitationStatus(invitation?.status)
      || isLockedRegistrationStatus(invitation?.registrationStatus)
    );
}

function hasActiveInvitationForHorse(horseId, invitations = []) {
  if (!horseId) return false;
  return invitations.some((invitation) => (
    String(getInvitationHorseId(invitation)) === String(horseId)
    && isActiveHorseInvitation(invitation)
  ));
}

function getHorseTournamentLockKey(horseId, tournamentId) {
  return `${tournamentId || ''}:${horseId || ''}`;
}

function isOverlappingHorseError(message) {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('ngựa này')
    && (
      normalized.includes('trùng thời gian')
      || normalized.includes('trung thoi gian')
      || normalized.includes('overlapping tournament')
    );
}

function getHorseTournamentLockReason(horse, tournamentId, invitations = [], manualLocks = {}, t) {
  if (!horse) return '';
  const manualReason = manualLocks[getHorseTournamentLockKey(getHorseId(horse), tournamentId)];
  if (manualReason) return manualReason;

  if (hasParticipatedHorse(horse)) return t?.('ownerRaceHorseParticipatedLock') || 'Ngựa đã tham gia giải';
  if (hasRegisteredHorse(horse)) return t?.('ownerRaceHorseRegisteredLock') || 'Ngựa đã đăng ký hoặc đang xử lý';

  const horseId = getHorseId(horse);
  if (hasActiveInvitationForHorse(horseId, invitations)) {
    return t?.('ownerRaceHorseActiveInvitationLock') || 'Ngựa đã có lời mời đang xử lý';
  }

  const horseRegistrations = firstDefined(horse.registrations, horse.raceRegistrations, horse.tournamentRegistrations, []);
  const matchedRegistration = Array.isArray(horseRegistrations)
    ? horseRegistrations.find((registration) => (
      String(firstDefined(registration.tournamentId, registration.tournamentID, registration.tournament?.tournamentId)) === String(tournamentId)
      && isLockedRegistrationStatus(registration.status)
    ))
    : null;

  if (matchedRegistration) return t?.('ownerRaceHorseTournamentRegistrationLock') || 'Ngựa đã có đơn trong giải này';

  const matchedInvitation = invitations.find((invitation) => (
    String(getInvitationHorseId(invitation)) === String(horseId)
    && String(getInvitationTournamentId(invitation)) === String(tournamentId)
    && isActiveHorseInvitation(invitation)
  ));

  if (matchedInvitation) {
    return isLockedInvitationStatus(matchedInvitation.status)
      ? t?.('ownerRaceHorseTournamentInvitationLock') || 'Ngựa đã có lời mời trong giải này'
      : t?.('ownerRaceHorseTournamentRegistrationLock') || 'Ngựa đã có đơn trong giải này';
  }

  return '';
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatPercent(value, t) {
  const number = Number(value);
  if (!Number.isFinite(number)) return t?.('ownerRaceNoData') || 'No data yet';
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function calculateRate(part, total) {
  const totalValue = toNumber(total);
  if (!totalValue) return null;
  return (toNumber(part) / totalValue) * 100;
}

function getPerformanceSource(item) {
  return item?.performance || item?.performanceSummary || item?.summary || item || {};
}

function getTop3Count(source) {
  return toNumber(firstDefined(source.top3Count, source.thirdPlaceCount))
    + toNumber(firstDefined(source.top2Count, source.secondPlaceCount))
    + toNumber(firstDefined(source.top1Count, source.winCount, source.totalWins));
}

function getHorseStats(horse) {
  const source = getPerformanceSource(horse);
  const totalRaces = toNumber(firstDefined(source.totalRaces, horse?.totalRaces, horse?.raceCount));
  const top1 = toNumber(firstDefined(source.top1Count, source.winCount, horse?.top1Count, horse?.totalWins));
  const top2 = toNumber(firstDefined(source.top2Count, horse?.top2Count));
  const top3 = toNumber(firstDefined(source.top3Count, horse?.top3Count));
  const top3Total = top1 + top2 + top3;

  return {
    totalRaces,
    top1,
    top2,
    top3,
    top3Rate: calculateRate(top3Total, totalRaces),
    violationCount: toNumber(firstDefined(source.violationCount, horse?.violationCount)),
    disqualifiedCount: toNumber(firstDefined(source.disqualifiedCount, horse?.disqualifiedCount)),
    recentRaces: firstDefined(horse?.recentRaces, horse?.raceHistory, source.recentRaces, [])
  };
}

function getJockeyName(jockey) {
  return jockey?.fullName || jockey?.name || jockey?.email || `Jockey ${getUserId(jockey) || ''}`;
}

function getJockeyDropdownLabel(jockey) {
  const label = jockey?.fullName || jockey?.name || jockey?.username;
  if (label && !String(label).includes('@')) return label;
  return `Jockey ${getUserId(jockey) || ''}`.trim();
}

function getJockeyStats(jockey, t) {
  const source = getPerformanceSource(jockey);
  const totalRaces = toNumber(firstDefined(source.totalRaces, jockey?.totalRaces, jockey?.raceCount));
  const wins = toNumber(firstDefined(source.top1Count, source.winCount, jockey?.top1Count, jockey?.totalWins));
  const top3Total = getTop3Count(source) || toNumber(firstDefined(jockey?.top3Count));

  return {
    license: firstDefined(jockey?.licenceType, jockey?.licenseType, jockey?.profile?.licenceType, jockey?.verificationStatus, t?.('notUpdated') || 'Not updated'),
    totalRaces,
    wins,
    winRate: firstDefined(source.winRate, jockey?.winRate, calculateRate(wins, totalRaces)),
    top3Rate: firstDefined(source.top3Rate, jockey?.top3Rate, calculateRate(top3Total, totalRaces)),
    violationCount: toNumber(firstDefined(source.violationCount, jockey?.violationCount)),
    disqualifiedCount: toNumber(firstDefined(source.disqualifiedCount, jockey?.disqualifiedCount)),
    recentRace: firstDefined(jockey?.recentRaceName, jockey?.lastRaceName, source.recentRaceName, t?.('ownerRaceNoData') || 'No data yet'),
    recentRaces: firstDefined(jockey?.recentRaces, jockey?.raceHistory, source.recentRaces, []),
    distanceStats: firstDefined(jockey?.distanceStats, source.distanceStats, []),
    trackStats: firstDefined(jockey?.trackStats, source.trackStats, [])
  };
}

function getTournamentRaces(tournament) {
  return Array.isArray(tournament?.races) ? tournament.races : [];
}

function getPrimaryRace(tournament) {
  return getTournamentRaces(tournament)[0] || null;
}

function getRaceName(race, tournament, t) {
  return race?.raceName || race?.name || getTournamentName(tournament) || t?.('ownerRaceNotSelected') || 'Chưa chọn race';
}

function getRaceDateTime(race, tournament) {
  return race?.raceStartTime || race?.startTime || tournament?.startDate || null;
}

function getRaceTrack(race, tournament, t) {
  return race?.trackName || race?.track || getTournamentVenue(tournament, t);
}

function getRaceDistance(race, t) {
  return race?.distance ? `${race.distance}m` : t?.('notUpdated') || 'Chưa cập nhật';
}

function getRaceCapacity(race, tournament) {
  const entries = firstDefined(race?.entryCount, race?.entries, tournament?.approvedRegistrationCount, tournament?.registrationCount, 0);
  const max = firstDefined(race?.maxRunners, tournament?.maxRegistrations, tournament?.maxRegistration);
  return max ? `${entries} / ${max}` : `${entries}`;
}

function validateInvitationForm(formValues, horses, tournaments, invitations = [], horseLockReasons = {}, t) {
  const errors = {};
  const selectedHorse = horses.find((horse) => String(getHorseId(horse)) === String(formValues.horseId));
  const selectedTournament = tournaments.find((tournament) => String(getTournamentId(tournament)) === String(formValues.tournamentId));
  const selectedTournamentId = selectedTournament ? getTournamentId(selectedTournament) : formValues.tournamentId;
  const expiredAt = formValues.expiredAt ? getInvitationExpiryDate(formValues.expiredAt) : null;

  if (!formValues.tournamentId) {
    errors.tournamentId = t?.('ownerRaceValidationTournamentRequired') || 'Vui lòng chọn giải đấu.';
  } else if (!selectedTournament) {
    errors.tournamentId = t?.('ownerRaceValidationTournamentUnavailable') || 'Giải đấu đã chọn không nằm trong danh sách đang mở đăng ký.';
  } else if (!isAvailableTournament(selectedTournament)) {
    errors.tournamentId = t?.('ownerRaceValidationTournamentClosed') || 'Giải đấu không còn mở đăng ký hoặc đã quá hạn đăng ký.';
  }

  if (!formValues.horseId) {
    errors.horseId = t?.('ownerRaceValidationHorseRequired') || 'Vui lòng chọn ngựa.';
  } else if (!selectedHorse) {
    errors.horseId = t?.('ownerRaceValidationHorseUnavailable') || 'Ngựa đã chọn không nằm trong danh sách ngựa ACTIVE của bạn.';
  } else if (!isActiveHorse(selectedHorse)) {
    errors.horseId = t?.('ownerRaceValidationHorseActive') || 'Chỉ có thể chọn ngựa ở trạng thái ACTIVE.';
  }

  if (selectedHorse && !errors.horseId) {
    const lockReason = getHorseTournamentLockReason(selectedHorse, selectedTournamentId, invitations, horseLockReasons, t);
    if (lockReason) errors.horseId = lockReason;
  }

  if (!formValues.jockeyId) {
    errors.jockeyId = t?.('ownerRaceValidationJockeyRequired') || 'Vui lòng chọn jockey.';
  }

  if (!formValues.expiredAt) {
    errors.expiredAt = t?.('ownerRaceValidationDeadlineRequired') || 'Vui lòng chọn hạn phản hồi lời mời.';
  } else if (!expiredAt) {
    errors.expiredAt = t?.('ownerRaceValidationDeadlineInvalid') || 'Hạn phản hồi không hợp lệ.';
  } else if (expiredAt) {
    const registrationDeadline = getDateTime(getRegistrationDeadline(selectedTournament));

    if (expiredAt.getTime() <= Date.now()) {
      errors.expiredAt = t?.('ownerRaceValidationDeadlineFuture') || 'Hạn phản hồi phải ở trong tương lai.';
    } else if (registrationDeadline && expiredAt.getTime() >= registrationDeadline.getTime()) {
      errors.expiredAt = t?.('ownerRaceValidationDeadlineBeforeRegistration') || 'Hạn phản hồi phải trước deadline đăng ký giải đấu.';
    }
  }

  return errors;
}

function StatusBadge({ status }) {
  const { t } = useLanguage();
  const className = String(status || 'not-registered')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return <span className={`status-badge ${className}`}>{formatStatus(status || '', t)}</span>;
}

function StepItem({ number, label, complete, active }) {
  return (
    <div className={`registration-step ${complete ? 'complete' : ''} ${active ? 'active' : ''}`}>
      <span>{complete ? <Check size={14} /> : number}</span>
      <strong>{label}</strong>
    </div>
  );
}

export default function OwnerRegisterRace({ horses, onBackToHorses }) {
  const { language, t } = useLanguage();
  const [wizardStep, setWizardStep] = useState(1);
  const [flowMode, setFlowMode] = useState(null);
  const [formValues, setFormValues] = useState(emptyInvitationForm());
  const [registrationValues, setRegistrationValues] = useState(emptyRegistrationForm());
  const [formErrors, setFormErrors] = useState({});
  const [registrationErrors, setRegistrationErrors] = useState({});
  const [tournaments, setTournaments] = useState([]);
  const [openTournaments, setOpenTournaments] = useState([]);
  const [ownerHorses, setOwnerHorses] = useState([]);
  const [jockeys, setJockeys] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [invitingJockeyId, setInvitingJockeyId] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [registrationSubmitError, setRegistrationSubmitError] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [message, setMessage] = useState('');
  const [detailJockey, setDetailJockey] = useState(null);
  const [detailHorse, setDetailHorse] = useState(null);
  const [cancelInvitationTarget, setCancelInvitationTarget] = useState(null);
  const [horseLockReasons, setHorseLockReasons] = useState({});
  const paymentReturnHandledRef = useRef(false);

  const activeHorses = useMemo(
    () => (ownerHorses.length > 0 ? ownerHorses : horses).filter((horse) => isActiveHorse(horse) || hasParticipatedHorse(horse) || hasRegisteredHorse(horse)),
    [horses, ownerHorses]
  );
  const displayTournaments = useMemo(() => {
    const byId = new Map();
    [...openTournaments, ...tournaments.filter(isAvailableTournament)].forEach((tournament) => {
      const tournamentId = getTournamentId(tournament);
      if (tournamentId) byId.set(String(tournamentId), tournament);
    });
    return [...byId.values()];
  }, [openTournaments, tournaments]);
  const availableTournaments = useMemo(() => {
    const source = openTournaments.length > 0 ? openTournaments : tournaments.filter(isAvailableTournament);
    return source.filter((tournament) => getTournamentId(tournament));
  }, [openTournaments, tournaments]);
  const tournamentById = useMemo(() => {
    return new Map(
      [...tournaments, ...openTournaments]
        .filter((tournament) => getTournamentId(tournament))
        .map((tournament) => [String(getTournamentId(tournament)), tournament])
    );
  }, [openTournaments, tournaments]);
  const selectedTournament = useMemo(
    () => tournamentById.get(String(formValues.tournamentId)) || null,
    [formValues.tournamentId, tournamentById]
  );
  const selectedHorse = useMemo(
    () => activeHorses.find((horse) => String(getHorseId(horse)) === String(formValues.horseId)) || null,
    [activeHorses, formValues.horseId]
  );
  const selectedRace = useMemo(() => getPrimaryRace(selectedTournament), [selectedTournament]);
  const selectedHorseStats = useMemo(() => getHorseStats(selectedHorse), [selectedHorse]);
  const invitationsForSelection = useMemo(() => {
    if (!formValues.tournamentId || !formValues.horseId) return [];
    return invitations.filter((invitation) => (
      String(getInvitationTournamentId(invitation)) === String(formValues.tournamentId)
      && String(getInvitationHorseId(invitation)) === String(formValues.horseId)
    ));
  }, [formValues.horseId, formValues.tournamentId, invitations]);
  const activeInvitationsForSelection = useMemo(
    () => invitationsForSelection.filter(isActiveHorseInvitation),
    [invitationsForSelection]
  );
  const invitationByJockeyId = useMemo(() => new Map(
    activeInvitationsForSelection
      .filter((invitation) => getInvitationJockeyId(invitation))
      .map((invitation) => [String(getInvitationJockeyId(invitation)), invitation])
  ), [activeInvitationsForSelection]);
  const enrichedJockeys = useMemo(() => jockeys.map((jockey) => {
    const jockeyId = String(getUserId(jockey));
    const invitation = invitationByJockeyId.get(jockeyId) || null;
    return {
      jockey,
      jockeyId,
      stats: getJockeyStats(jockey, t),
      invitation,
      invitationStatus: invitation ? String(invitation.status || '').toUpperCase() : ''
    };
  }), [invitationByJockeyId, jockeys, t]);
  const selectedInviteJockey = useMemo(
    () => enrichedJockeys.find((item) => String(item.jockeyId) === String(formValues.jockeyId)) || null,
    [enrichedJockeys, formValues.jockeyId]
  );
  const acceptedJockeyInvitations = useMemo(() => {
    if (!registrationValues.tournamentId || !registrationValues.horseId) return [];

    return invitations.filter((invitation) => (
      isAcceptedInvitation(invitation)
      && String(getInvitationTournamentId(invitation)) === String(registrationValues.tournamentId)
      && String(getInvitationHorseId(invitation)) === String(registrationValues.horseId)
    ));
  }, [invitations, registrationValues.horseId, registrationValues.tournamentId]);
  const selectedAcceptedInvitation = useMemo(
    () => acceptedJockeyInvitations.find((invitation) => String(getInvitationJockeyId(invitation)) === String(registrationValues.jockeyId)) || null,
    [acceptedJockeyInvitations, registrationValues.jockeyId]
  );
  const currentPendingInvitation = useMemo(() => {
    if (!formValues.tournamentId || !formValues.horseId) return null;
    return invitations.find((invitation) => (
      String(invitation.status || '').toUpperCase() === 'PENDING'
      && String(getInvitationTournamentId(invitation)) === String(formValues.tournamentId)
      && String(getInvitationHorseId(invitation)) === String(formValues.horseId)
    )) || null;
  }, [formValues.horseId, formValues.tournamentId, invitations]);
  const responseDeadlineMin = useMemo(() => getDateLocalMinValue(), []);
  const responseDeadlineMax = useMemo(
    () => getRegistrationDeadline(selectedTournament) ? toDateLocalValue(getRegistrationDeadline(selectedTournament)) : '',
    [selectedTournament]
  );
  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);
  const registeredHorseSummaryRows = useMemo(() => {
    if (statusFilter !== 'ALL') return [];

    const invitationHorseIds = new Set(
      invitations
        .map((invitation) => getInvitationHorseId(invitation))
        .filter((horseId) => horseId !== undefined && horseId !== null && horseId !== '')
        .map((horseId) => String(horseId))
    );

    return activeHorses
      .filter((horse) => hasRegisteredHorse(horse) && !invitationHorseIds.has(String(getHorseId(horse))))
      .map((horse) => ({
        rowType: 'registered-horse',
        horseId: getHorseId(horse),
        horseName: getHorseName(horse),
        jockeyName: t('ownerRaceMissingInviteData'),
        tournamentName: t('ownerRaceAlreadyRegistered'),
        status: 'REGISTERED',
        registrationStatus: 'REGISTERED',
        createdAt: horse.updatedAt || horse.createdAt
      }));
  }, [activeHorses, invitations, statusFilter, t]);
  const displayedInvitationRows = useMemo(
    () => [...filteredInvitations, ...registeredHorseSummaryRows],
    [filteredInvitations, registeredHorseSummaryRows]
  );
  const payableInvitations = useMemo(() => invitations
    .filter((invitation) => isAcceptedInvitation(invitation) || hasRegisteredInvitation(invitation))
    .sort((left, right) => {
      const paidDifference = Number(isPaidStatus(getInvitationPaymentStatus(left)))
        - Number(isPaidStatus(getInvitationPaymentStatus(right)));
      if (paidDifference !== 0) return paidDifference;
      return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    }), [invitations]);
  const paidInvitationCount = useMemo(
    () => payableInvitations.filter((invitation) => isPaidStatus(getInvitationPaymentStatus(invitation))).length,
    [payableInvitations]
  );
  const pendingPaymentCount = useMemo(
    () => payableInvitations.filter(canStartInvitationPayment).length,
    [payableInvitations]
  );
  const inviteReady = Boolean(formValues.tournamentId && formValues.horseId);
  const isInviteFlowActive = flowMode === 'invite';
  const isPaymentFlowActive = flowMode === 'payment';
  const hasAcceptedInvitation = acceptedJockeyInvitations.length > 0;
  const selectedPaymentStatus = paymentResult?.registrationPaymentStatus
    || (paymentResult?.success ? 'PAID' : '')
    || registrationResult?.paymentStatus
    || getInvitationPaymentStatus(selectedAcceptedInvitation)
    || '';
  const selectedApprovalStatus = paymentResult?.registrationApprovalStatus
    || registrationResult?.approvalStatus
    || getInvitationApprovalStatus(selectedAcceptedInvitation)
    || '';
  const isRegistrationPaid = isPaidStatus(selectedPaymentStatus);
  const isRegistrationUnpaid = isUnpaidStatus(selectedPaymentStatus);
  const canSubmitRegistration = Boolean(registrationValues.tournamentId && registrationValues.horseId && registrationValues.jockeyId);
  const activeStep = wizardStep;
  const nextStepLabel = wizardStep === 2
    ? (isSaving ? t('ownerRaceSending') : t('ownerRaceWaitForJockey'))
    : t('next');

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (!currentPendingInvitation || formValues.jockeyId) return;
    const pendingJockeyId = getInvitationJockeyId(currentPendingInvitation);
    if (!pendingJockeyId) return;
    setFormValues((current) => ({ ...current, jockeyId: String(pendingJockeyId) }));
  }, [currentPendingInvitation, formValues.jockeyId]);

  useEffect(() => {
    if (!acceptedJockeyInvitations.length) return;
    if (registrationValues.jockeyId) return;
    const invitation = acceptedJockeyInvitations[0];
    const acceptedJockeyId = getInvitationJockeyId(invitation);
    if (!acceptedJockeyId) return;
    setRegistrationValues((current) => ({ ...current, jockeyId: String(acceptedJockeyId) }));
  }, [acceptedJockeyInvitations, registrationValues.jockeyId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!isRegistrationPaymentReturn(params) || paymentReturnHandledRef.current) return;
    paymentReturnHandledRef.current = true;

    async function confirmRegistrationPayment() {
      let confirmationCompleted = false;
      try {
        const result = await confirmVnpayReturn(window.location.search);
        confirmationCompleted = true;
        setPaymentResult(result);
        setRegistrationResult((current) => ({
          ...(current || {}),
          registrationId: result?.registrationId,
          paymentStatus: result?.registrationPaymentStatus || (result?.success ? 'PAID' : 'FAILED')
        }));
        setFlowMode('payment');
        setWizardStep(4);
        setMessage(result?.success ? t('ownerRacePaymentConfirmSuccess') : t('ownerRacePaymentConfirmFailed'));
        await loadPageData();
      } catch (err) {
        paymentReturnHandledRef.current = false;
        setRegistrationSubmitError(getErrorText(err, t('ownerRacePaymentConfirmError')));
      } finally {
        if (confirmationCompleted) {
          try {
            window.localStorage.removeItem(OWNER_REGISTRATION_PAYMENT_PENDING_KEY);
          } catch {
            // Ignore storage cleanup failures.
          }
          const cleanUrl = `${window.location.pathname}?section=register${window.location.hash || ''}`;
          window.history.replaceState(null, '', cleanUrl);
        }
      }
    }

    confirmRegistrationPayment();
  }, []);

  async function loadPageData() {
    setIsLoading(true);
    setLoadError('');

    try {
      const [tournamentData, userData, invitationData] = await Promise.all([
        getTournaments(),
        getAllUsers(),
        getOwnerInvitations()
      ]);
      const [openTournamentData, ownerHorseData] = await Promise.all([
        getOpenOwnerTournaments(),
        getOwnerHorses()
      ]);

      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setOpenTournaments(Array.isArray(openTournamentData) ? openTournamentData : []);
      setOwnerHorses(Array.isArray(ownerHorseData) ? ownerHorseData : []);
      setJockeys((Array.isArray(userData) ? userData : []).filter((user) => getUserRole(user) === 'JOCKEY' && String(user.status || '').toUpperCase() === 'ACTIVE'));
      setInvitations(applyOwnerCancelledInvitationOverrides(Array.isArray(invitationData) ? invitationData : []));
    } catch (err) {
      setLoadError(getErrorText(err, t('ownerRaceLoadError')));
    } finally {
      setIsLoading(false);
    }
  }

  function resetFeedback() {
    setSubmitError('');
    setRegistrationSubmitError('');
    setRegistrationResult(null);
    setPaymentResult(null);
    setMessage('');
  }

  function goPreviousStep() {
    setWizardStep((current) => Math.max(1, current - 1));
    resetFeedback();
  }

  async function goNextStep() {
    resetFeedback();

    if (wizardStep === 1) {
      if (!formValues.tournamentId || !selectedTournament) {
        setFormErrors((current) => ({ ...current, tournamentId: t('ownerRaceValidationTournamentRequired') }));
        return;
      }
      setWizardStep(2);
      return;
    }

    if (wizardStep === 2) {
      if (!formValues.horseId || !selectedHorse) {
        setFormErrors((current) => ({ ...current, horseId: t('ownerRaceValidationHorseRequired') }));
        return;
      }
      const lockReason = getHorseTournamentLockReason(selectedHorse, formValues.tournamentId, invitations, horseLockReasons, t);
      if (lockReason && !currentPendingInvitation && !hasAcceptedInvitation) {
        setFormErrors((current) => ({ ...current, horseId: lockReason }));
        return;
      }
      if (!currentPendingInvitation && !hasAcceptedInvitation) {
        const createdInvitation = await submitInvitation(formValues.jockeyId);
        if (!createdInvitation) return;
        setWizardStep(3);
        return;
      }
      setWizardStep(3);
      return;
    }

    if (wizardStep === 3) {
      setSubmitError(t('ownerRacePaymentReadyDesc'));
    }
  }

  function selectTournament(tournament) {
    const tournamentId = String(getTournamentId(tournament));
    setFlowMode('invite');
    setFormValues((current) => ({ ...current, tournamentId, horseId: '', jockeyId: '' }));
    setRegistrationValues((current) => ({ ...current, tournamentId, horseId: '', jockeyId: '' }));
    setFormErrors((current) => ({ ...current, tournamentId: '', horseId: '' }));
    setRegistrationErrors((current) => ({ ...current, tournamentId: '', horseId: '' }));
    resetFeedback();
  }

  function selectHorse(horse) {
    const horseId = String(getHorseId(horse));
    const lockReason = getHorseTournamentLockReason(horse, formValues.tournamentId, invitations, horseLockReasons, t);
    if (lockReason) {
      setFormErrors((current) => ({ ...current, horseId: lockReason }));
      setRegistrationErrors((current) => ({ ...current, horseId: lockReason }));
      return;
    }
    setFormValues((current) => ({ ...current, horseId }));
    setRegistrationValues((current) => ({ ...current, horseId, jockeyId: '' }));
    setFormErrors((current) => ({ ...current, horseId: '' }));
    setRegistrationErrors((current) => ({ ...current, horseId: '' }));
    resetFeedback();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
    resetFeedback();
  }

  function clearTournamentSelection() {
    setFlowMode(null);
    setFormValues(emptyInvitationForm());
    setRegistrationValues(emptyRegistrationForm());
    setFormErrors({});
    setRegistrationErrors({});
    setDetailJockey(null);
    setDetailHorse(null);
    setWizardStep(1);
    resetFeedback();
  }

  function fillRegistrationFromInvitation(invitation) {
    setFlowMode('payment');
    setFormValues((current) => ({
      ...current,
      tournamentId: String(getInvitationTournamentId(invitation)),
      horseId: String(getInvitationHorseId(invitation))
    }));
    setRegistrationValues({
      tournamentId: String(getInvitationTournamentId(invitation)),
      horseId: String(getInvitationHorseId(invitation)),
      jockeyId: String(getInvitationJockeyId(invitation))
    });
    setWizardStep(4);
    setRegistrationErrors({});
    resetFeedback();
  }

  function validateRegistrationForm() {
    const errors = {};
    const selectedRegistrationTournament = availableTournaments.find((tournament) => String(getTournamentId(tournament)) === String(registrationValues.tournamentId));
    const selectedRegistrationHorse = activeHorses.find((horse) => String(getHorseId(horse)) === String(registrationValues.horseId));

    if (!registrationValues.tournamentId) {
      errors.tournamentId = t('ownerRaceValidationTournamentRequired');
    } else if (!selectedRegistrationTournament) {
      errors.tournamentId = t('ownerRaceRegistrationTournamentClosed');
    }

    if (!registrationValues.horseId) {
      errors.horseId = t('ownerRaceValidationHorseRequired');
    } else if (!selectedRegistrationHorse) {
      errors.horseId = t('ownerRaceRegistrationHorseInactive');
    }

    if (!registrationValues.jockeyId) {
      errors.jockeyId = t('ownerRaceAcceptedInviteRequired');
    } else if (!selectedAcceptedInvitation) {
      errors.jockeyId = t('ownerRaceAcceptedInviteMismatch');
    }

    return errors;
  }

  async function submitInvitation(jockeyId) {
    if (isSaving) return null;

    const nextValues = { ...formValues, jockeyId };
    const errors = validateInvitationForm(nextValues, activeHorses, availableTournaments, invitations, horseLockReasons, t);
    setFormErrors(errors);
    setSubmitError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return null;

    setIsSaving(true);
    setInvitingJockeyId(String(nextValues.jockeyId));
    try {
      const createdInvitation = await inviteJockey({
        tournamentId: Number(nextValues.tournamentId),
        horseId: Number(nextValues.horseId),
        jockeyId: Number(nextValues.jockeyId),
        expiredAt: toInvitationExpiryDateTime(nextValues.expiredAt),
        message: nextValues.message.trim() || null
      });
      const normalizedInvitation = {
        ...createdInvitation,
        tournamentId: getInvitationTournamentId(createdInvitation) ?? Number(nextValues.tournamentId),
        horseId: getInvitationHorseId(createdInvitation) ?? Number(nextValues.horseId),
        jockeyId: getInvitationJockeyId(createdInvitation) ?? Number(nextValues.jockeyId),
        status: createdInvitation?.status || 'PENDING',
        registrationStatus: createdInvitation?.registrationStatus || null
      };
      setMessage(t('ownerRaceInviteSuccess'));
      setInvitations((current) => {
        const createdInvitationId = getInvitationId(normalizedInvitation);
        if (!createdInvitationId) return [normalizedInvitation, ...current];
        return [
          normalizedInvitation,
          ...current.filter((invitation) => getInvitationId(invitation) !== createdInvitationId)
        ];
      });
      setFormValues((current) => ({ ...current, jockeyId: String(nextValues.jockeyId), expiredAt: '', message: '' }));
      setFormErrors({});
      await loadPageData();
      return normalizedInvitation;
    } catch (err) {
      const errorText = getErrorText(err, t('ownerRaceInviteError'));
      if (isOverlappingHorseError(errorText) && nextValues.horseId && nextValues.tournamentId) {
        const lockKey = getHorseTournamentLockKey(nextValues.horseId, nextValues.tournamentId);
        setHorseLockReasons((current) => ({ ...current, [lockKey]: errorText }));
        setFormErrors((current) => ({ ...current, horseId: errorText }));
        setRegistrationErrors((current) => ({ ...current, horseId: errorText }));
      }
      setSubmitError(errorText);
      return null;
    } finally {
      setIsSaving(false);
      setInvitingJockeyId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitInvitation(formValues.jockeyId);
  }

  async function handleInviteJockey(jockeyId) {
    setFormValues((current) => ({ ...current, jockeyId }));
    await submitInvitation(jockeyId);
  }

  async function handleRegistrationSubmit(event) {
    event.preventDefault();
    if (isPaidStatus(getInvitationPaymentStatus(selectedAcceptedInvitation))) {
      setRegistrationSubmitError('');
      setMessage(t('ownerRaceAlreadyPaidNotice'));
      return;
    }
    if (!canStartInvitationPayment(selectedAcceptedInvitation)) {
      setRegistrationSubmitError(t('ownerRacePaymentUnavailable'));
      return;
    }
    const errors = validateRegistrationForm();
    setRegistrationErrors(errors);
    setRegistrationSubmitError('');
    setRegistrationResult(null);
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    setIsRegistering(true);
    try {
      const response = await submitOwnerTournamentRegistration({
        tournamentId: Number(registrationValues.tournamentId),
        horseId: Number(registrationValues.horseId),
        jockeyId: Number(registrationValues.jockeyId)
      });
      const registration = response?.registration || response;
      setRegistrationResult(registration);

      if (response?.paymentUrl) {
        try {
          window.localStorage.setItem(OWNER_REGISTRATION_PAYMENT_PENDING_KEY, 'true');
        } catch {
          // Payment can still continue if localStorage is unavailable.
        }
        setMessage(t('ownerRaceRegistrationRedirectPayment'));
        window.location.assign(response.paymentUrl);
        return;
      }
      setMessage(t('ownerRaceRegistrationSubmitted'));
      await loadPageData();
    } catch (err) {
      const errorText = getErrorText(err, t('ownerRaceRegistrationSubmitError'));
      if (isAlreadyPaidError(errorText)) {
        await loadPageData();
        setRegistrationSubmitError('');
        setMessage(t('ownerRaceAlreadyPaidNotice'));
        return;
      }
      setRegistrationSubmitError(errorText);
    } finally {
      setIsRegistering(false);
    }
  }

  function handleCancel(invitation) {
    setCancelInvitationTarget(invitation);
  }

  async function confirmCancelInvitation() {
    const invitation = cancelInvitationTarget;
    const invitationId = getInvitationId(invitation);
    if (!invitationId) return;

    setActingId(invitationId);
    setLoadError('');
    setSubmitError('');
    setMessage('');

    try {
      await cancelOwnerInvitation(invitationId);
      storeOwnerCancelledInvitationId(invitationId);
      setInvitations((current) => current.map((item) => (
        String(getInvitationId(item)) === String(invitationId)
          ? {
            ...item,
            status: 'CANCELLED',
            registrationStatus: item.registrationStatus === 'PENDING' ? 'CANCELLED' : item.registrationStatus,
            respondedAt: item.respondedAt || new Date().toISOString()
          }
          : item
      )));
      setMessage(t('ownerRaceCancelInviteSuccess'));
      await loadPageData();
      setCancelInvitationTarget(null);
    } catch (err) {
      setLoadError(getErrorText(err, t('ownerRaceCancelInviteError')));
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className={`owner-stack owner-registration-page owner-application-style ${isInviteFlowActive ? 'invite-flow-active' : isPaymentFlowActive ? 'registration-payment-active' : 'invite-overview-active'}`}>
      {loadError && <div className="admin-alert error" role="alert">{loadError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="owner-panel owner-registration-hero">
        <div>
          <p className="eyebrow">{t('ownerRaceHeroEyebrow')}</p>
          <h2>{t('ownerRaceHeroTitle')}</h2>
          <p>{t('ownerRaceHeroDesc')}</p>
        </div>
        <button className="outline-button compact-button" type="button" onClick={loadPageData} disabled={isLoading || isSaving || isRegistering}>
          <RefreshCw size={16} /> {isLoading ? `${t('loading')}...` : t('refresh')}
        </button>
      </section>

      <section className="owner-panel owner-application-step-strip">
        <StepItem number={1} label={t('ownerRaceStepTournament')} complete={Boolean(formValues.tournamentId)} active={activeStep === 1} />
        <StepItem number={2} label={t('ownerRaceStepHorseJockey')} complete={Boolean(formValues.horseId && (currentPendingInvitation || hasAcceptedInvitation))} active={activeStep === 2} />
        <StepItem number={3} label={t('ownerRaceStepJockeyAccepted')} complete={hasAcceptedInvitation} active={activeStep === 3} />
      </section>

      <div className="owner-registration-layout">
        <main className="owner-registration-main">
          {selectedTournament && (
            <section className={`owner-panel flow-only wizard-context-panel ${wizardStep <= 2 ? 'wizard-step-hidden' : ''}`}>
              <div className="owner-panel-header">
                <div>
                  <p className="eyebrow">{t('ownerRaceSelectedTournament')}</p>
                  <h2>{getTournamentName(selectedTournament)}</h2>
                  <p>{getTournamentVenue(selectedTournament, t)} · {formatDateRange(selectedTournament.startDate, selectedTournament.endDate, t)}</p>
                </div>
                <button className="outline-button" type="button" onClick={clearTournamentSelection} disabled={isRegistering}>
                  {t('close')}
                </button>
              </div>
              <div className="selected-tournament-detail">
                <div className="selected-tournament-header">
                  <div>
                    <p className="eyebrow">{t('ownerRaceInfoTitle')}</p>
                    <h3>{getRaceName(selectedRace, selectedTournament, t)}</h3>
                  </div>
                  <StatusBadge status={selectedTournament.status || 'OPEN_FOR_REGISTRATION'} />
                </div>
                <div className="selected-tournament-grid">
                  <span><MapPin size={15} /> {t('ownerRaceLocation')} <strong>{getRaceTrack(selectedRace, selectedTournament, t)}</strong></span>
                  <span><CalendarDays size={15} /> {t('ownerRaceDateTime')} <strong>{formatDateTime(getRaceDateTime(selectedRace, selectedTournament), t, language)}</strong></span>
                  <span><Flag size={15} /> {t('ownerRaceDistance')} <strong>{getRaceDistance(selectedRace, t)}</strong></span>
                  <span><Users size={15} /> {t('ownerRaceHorseCount')} <strong>{getRaceCapacity(selectedRace, selectedTournament)}</strong></span>
                  <span><Clock size={15} /> {t('ownerRaceRegistrationClose')} <strong>{formatDateTime(getRegistrationDeadline(selectedTournament), t, language)}</strong></span>
                  <span><CircleDollarSign size={15} /> {t('ownerRaceEntryFee')} <strong>{formatCurrency(selectedTournament.entryFee)}</strong></span>
                </div>
              </div>
            </section>
          )}

          <section className={`owner-panel overview-only registration-step-overview ${wizardStep === 1 ? '' : 'wizard-step-hidden'}`}>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">{t('ownerRaceStepOneEyebrow')}</p>
                <h2>{t('ownerRaceAllTournamentsTitle')}</h2>
                <p>{t('ownerRaceAllTournamentsDesc')}</p>
              </div>
            </div>

            {registrationErrors.tournamentId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.tournamentId}</div>}
            {formErrors.tournamentId && <div className="admin-alert error modal-alert" role="alert">{formErrors.tournamentId}</div>}

            {!selectedTournament && (isLoading ? (
              <p className="table-empty">{t('ownerRaceLoadingTournaments')}</p>
            ) : displayTournaments.length === 0 ? (
              <div className="owner-empty-state compact-empty">
                <div><Flag size={34} /></div>
                <h3>{t('ownerRaceNoTournamentTitle')}</h3>
                <p>{t('ownerRaceNoTournamentDesc')}</p>
              </div>
            ) : (
              <div className="tournament-card-grid">
                {displayTournaments.map((tournament) => {
                  const tournamentId = String(getTournamentId(tournament));
                  const selected = String(formValues.tournamentId) === tournamentId;
                  const imageUrl = getTournamentImageUrl(tournament);
                  const maxRegistrations = Number(tournament.maxRegistrations || tournament.maxRegistration || 0);
                  const approvedCount = Number(tournament.approvedRegistrationCount || tournament.registrationCount || 0);
                  const canSelectTournament = isAvailableTournament(tournament);

                  return (
                    <article className={`tournament-choice-card ${selected ? 'selected' : ''}`} key={tournamentId}>
                      <div className="tournament-choice-media">
                        {imageUrl ? <img src={imageUrl} alt={getTournamentName(tournament)} /> : <Flag size={36} />}
                        <span><Clock size={13} /> {formatStatus(tournament.status || (canSelectTournament ? 'OPEN_FOR_REGISTRATION' : 'REGISTRATION_CLOSED'), t)}</span>
                      </div>
                      <div className="tournament-choice-body">
                        <h3>{getTournamentName(tournament) || `${t('ownerRaceTournamentLabel')} ${tournamentId}`}</h3>
                        <p><MapPin size={14} /> {getTournamentVenue(tournament, t)}</p>
                        <div className="tournament-choice-stats">
                          <span>{t('ownerRaceDateRange')} <strong>{formatDateRange(tournament.startDate, tournament.endDate, t)}</strong></span>
                          <span>{t('ownerRaceDeadline')} <strong>{formatDateTime(getRegistrationDeadline(tournament), t, language)}</strong></span>
                          <span>{t('ownerRaceEntryFee')} <strong>{formatCurrency(tournament.entryFee)}</strong></span>
                          <span>{t('ownerRaceCapacity')} <strong>{maxRegistrations ? `${approvedCount} / ${t('ownerRaceSlots', { count: maxRegistrations })}` : t('ownerRaceApplications', { count: approvedCount })}</strong></span>
                        </div>
                        <div className="tournament-choice-actions">
                          <button type="button" className="outline-button" onClick={() => selectTournament(tournament)}>
                            <Eye size={15} /> {t('ownerRaceViewDetails')}
                          </button>
                          <button type="button" className="primary-button compact-primary" onClick={() => selectTournament(tournament)} disabled={!canSelectTournament}>
                            {selected ? t('ownerRaceSelected') : canSelectTournament ? t('ownerRaceSelectTournament') : t('ownerRaceNotOpen')}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}

            {selectedTournament && (
              <div className="selected-tournament-detail">
                <div className="selected-tournament-header">
                  <div>
                    <p className="eyebrow">{t('ownerRaceSelectedTournament')}</p>
                    <h3>{getTournamentName(selectedTournament)}</h3>
                  </div>
                  <StatusBadge status={selectedTournament.status || 'OPEN_FOR_REGISTRATION'} />
                </div>
                <div className="selected-tournament-grid">
                  <span><MapPin size={15} /> {t('ownerRaceLocation')} <strong>{getTournamentVenue(selectedTournament, t)}</strong></span>
                  <span><CalendarDays size={15} /> {t('ownerRaceTournamentTime')} <strong>{formatDateRange(selectedTournament.startDate, selectedTournament.endDate, t)}</strong></span>
                  <span><Clock size={15} /> {t('ownerRaceRegistrationOpen')} <strong>{formatDateTime(getRegistrationOpenAt(selectedTournament), t, language)}</strong></span>
                  <span><Clock size={15} /> {t('ownerRaceRegistrationClose')} <strong>{formatDateTime(getRegistrationDeadline(selectedTournament), t, language)}</strong></span>
                  <span><CircleDollarSign size={15} /> {t('ownerRaceEntryFee')} <strong>{formatCurrency(selectedTournament.entryFee)}</strong></span>
                  <span><Users size={15} /> {t('ownerRaceMaxCapacity')} <strong>{selectedTournament.maxRegistrations || selectedTournament.maxRegistration || t('ownerRaceUnlimited')}</strong></span>
                  <span><Flag size={15} /> {t('ownerRaceRaceCount')} <strong>{selectedTournament.raceCount ?? t('notUpdated')}</strong></span>
                  <span><CheckCircle2 size={15} /> {t('ownerRaceApprovedRegistrations')} <strong>{selectedTournament.approvedRegistrationCount ?? selectedTournament.registrationCount ?? 0}</strong></span>
                </div>
                {selectedTournament.description && <p className="selected-tournament-description">{selectedTournament.description}</p>}
              </div>
            )}
          </section>

          <section className={`owner-panel flow-only ${wizardStep === 2 ? '' : 'wizard-step-hidden'}`}>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">{t('ownerRaceStepTwoEyebrow')}</p>
                <h2>{t('ownerRaceChooseActiveHorseTitle')}</h2>
                <p>{t('ownerRaceChooseActiveHorseDesc')}</p>
              </div>
              <button className="outline-button" type="button" onClick={onBackToHorses}>{t('ownerRaceBackToHorseList')}</button>
            </div>

            {formErrors.horseId && <div className="admin-alert error modal-alert" role="alert">{formErrors.horseId}</div>}
            {registrationErrors.horseId && registrationErrors.horseId !== formErrors.horseId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.horseId}</div>}

            {activeHorses.length === 0 ? (
              <div className="owner-empty-state compact-empty">
                <div><Flag size={34} /></div>
                <h3>{t('ownerRaceNoActiveHorseTitle')}</h3>
                <p>{t('ownerRaceNoActiveHorseDesc')}</p>
              </div>
            ) : (
              <div className="registration-horse-grid">
                <div className="registration-horse-header" aria-hidden="true">
                  <span>{t('ownerRaceHorseName')}</span>
                  <span>{t('ownerRaceBreeding')}</span>
                  <span>{t('status')}</span>
                  <span>{t('actions')}</span>
                </div>
                {activeHorses.map((horse) => {
                  const horseId = String(getHorseId(horse));
                  const selected = String(formValues.horseId) === horseId;
                  const hasParticipated = hasParticipatedHorse(horse);
                  const lockReason = selectedTournament ? getHorseTournamentLockReason(horse, getTournamentId(selectedTournament), invitations, horseLockReasons, t) : '';
                  const hasActiveInvite = hasActiveInvitationForHorse(horseId, invitations);
                  const disabled = !selectedTournament || Boolean(lockReason) || hasActiveInvite || hasParticipated;
                  const statusText = formatStatus(horse.status || 'ACTIVE', t);

                  return (
                    <article className={`registration-horse-card ${selected ? 'selected' : ''} ${lockReason && !hasActiveInvite && !hasParticipated ? 'unavailable' : ''} ${hasActiveInvite ? 'has-active-invite' : ''} ${hasParticipated ? 'participated' : ''}`} key={horseId}>
                      <span className="registration-horse-avatar">{selected ? <CheckCircle2 size={22} /> : '🐎'}</span>
                      <strong>{getHorseName(horse) || `Horse ${horseId}`}</strong>
                      <small>{horse.breeding || t('notUpdated')}</small>
                      <span className="registration-horse-status">{statusText}</span>
                      <div className="registration-horse-actions">
                        {selected && <span className="registration-horse-selected-badge"><CheckCircle2 size={15} /> {t('ownerRaceSelectedHorse')}</span>}
                        {!selected && (
                        <button className="primary-button compact-primary" type="button" onClick={() => selectHorse(horse)} disabled={disabled}>
                          {t('ownerRaceSelectHorse')}
                        </button>
                        )}
                        {selected && (
                          <button className="outline-button" type="button" onClick={() => setDetailHorse(horse)}>
                            <Eye size={15} /> {t('ownerRaceViewProfile')}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <form className={`owner-panel owner-form flow-only ${wizardStep === 2 ? '' : 'wizard-step-hidden'}`} onSubmit={handleSubmit} noValidate>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">{t('ownerRaceStepThreeEyebrow')}</p>
                <h2>{t('ownerRaceInviteJockeyTitle')}</h2>
                <p>{t('ownerRaceInviteJockeyDesc')}</p>
              </div>
            </div>

            {submitError && submitError !== formErrors.horseId && submitError !== registrationErrors.horseId && (
              <div className="admin-alert error modal-alert" role="alert">{submitError}</div>
            )}

            <div className="owner-invite-context-grid wizard-step-hidden">
              <article className="owner-invite-context-card">
                <p className="eyebrow">Race</p>
                <h3>{selectedTournament ? getRaceName(selectedRace, selectedTournament, t) : t('ownerRaceNotSelected')}</h3>
                <div className="owner-invite-context-list">
                  <span><CalendarDays size={14} /> {t('ownerRaceDateTime')} <strong>{formatDateTime(getRaceDateTime(selectedRace, selectedTournament), t, language)}</strong></span>
                  <span><MapPin size={14} /> {t('ownerRaceLocation')} <strong>{selectedTournament ? getRaceTrack(selectedRace, selectedTournament, t) : t('notUpdated')}</strong></span>
                  <span><Flag size={14} /> {t('ownerRaceDistance')} <strong>{getRaceDistance(selectedRace, t)}</strong></span>
                  <span><Users size={14} /> {t('ownerRaceHorseCount')} <strong>{selectedTournament ? getRaceCapacity(selectedRace, selectedTournament) : t('notUpdated')}</strong></span>
                  <span><CircleDollarSign size={14} /> {t('ownerRaceEntryFee')} <strong>{selectedTournament ? formatCurrency(selectedTournament.entryFee) : t('notUpdated')}</strong></span>
                  <span><Clock size={14} /> {t('status')} <strong>{selectedTournament ? formatStatus(selectedTournament.status || 'OPEN_FOR_REGISTRATION', t) : t('ownerRaceNoSelection')}</strong></span>
                </div>
              </article>

              <article className="owner-invite-context-card">
                <p className="eyebrow">{t('ownerRaceHorseLabel')}</p>
                <h3>{selectedHorse ? getHorseName(selectedHorse) : t('ownerRaceNoSelection')}</h3>
                <div className="owner-invite-context-list">
                  <span><ShieldCheck size={14} /> Eligibility <strong>{selectedHorse ? formatStatus(selectedHorse.status || 'ACTIVE', t) : t('ownerRaceNoSelection')}</strong></span>
                  <span><BarChart3 size={14} /> {t('ownerRaceTotalRace')} <strong>{selectedHorse ? selectedHorseStats.totalRaces : t('ownerRaceNoData')}</strong></span>
                  <span><Trophy size={14} /> Top 1/2/3 <strong>{selectedHorse ? `${selectedHorseStats.top1}/${selectedHorseStats.top2}/${selectedHorseStats.top3}` : t('ownerRaceNoData')}</strong></span>
                  <span><CheckCircle2 size={14} /> {t('ownerRaceTop3Rate')} <strong>{selectedHorse ? formatPercent(selectedHorseStats.top3Rate, t) : t('ownerRaceNoData')}</strong></span>
                  <span><XCircle size={14} /> {t('ownerRaceViolation')} <strong>{selectedHorse ? `${selectedHorseStats.violationCount} / DQ ${selectedHorseStats.disqualifiedCount}` : t('ownerRaceNoData')}</strong></span>
                  <span><Flag size={14} /> {t('ownerHorseAge')}/{t('ownerHorseBreeding')} <strong>{selectedHorse ? firstDefined(selectedHorse.age, selectedHorse.breeding, selectedHorse.sex, t('notUpdated')) : t('ownerRaceNoSelection')}</strong></span>
                </div>
              </article>
            </div>
            {currentPendingInvitation && !message && !submitError && (
              <div className="admin-alert warning modal-alert" role="status">
                {t('ownerRacePendingInviteNotice')}
              </div>
            )}

            <div className="owner-invite-toolbar">
              <label className="owner-invite-select-field" htmlFor="ownerJockeyDropdown">
                <span className="field-label">{t('ownerRaceActiveJockeyLabel')} <span className="required">*</span></span>
                <select
                  className={formErrors.jockeyId ? 'input has-error' : 'input'}
                  id="ownerJockeyDropdown"
                  name="jockeyId"
                  value={formValues.jockeyId}
                  onChange={handleChange}
                  disabled={isSaving || isLoading || !inviteReady || Boolean(currentPendingInvitation) || hasAcceptedInvitation}
                >
                  <option value="">{t('ownerRaceChooseJockey')}</option>
                  {enrichedJockeys.map(({ jockey, jockeyId, invitationStatus }) => (
                    <option key={jockeyId} value={jockeyId} disabled={['PENDING', 'ACCEPTED', 'APPROVED'].includes(invitationStatus)}>
                      {getJockeyDropdownLabel(jockey)}{invitationStatus ? ` - ${formatStatus(invitationStatus, t)}` : ''}
                    </option>
                  ))}
                </select>
                {formErrors.jockeyId && <p className="field-error">{formErrors.jockeyId}</p>}
                {!isLoading && jockeys.length === 0 && <p className="field-hint warning-text">{t('ownerRaceNoActiveJockey')}</p>}
              </label>

              <div className="selected-jockey-actions">
                {selectedInviteJockey && (
                  <button type="button" className="outline-button" onClick={() => setDetailJockey(selectedInviteJockey.jockey)}>
                    <Eye size={15} /> {t('ownerRaceViewDetails')}
                  </button>
                )}
                {selectedInviteJockey?.invitationStatus === 'PENDING' && selectedInviteJockey.invitation ? (
                  <button type="button" className="table-button danger-action" onClick={() => handleCancel(selectedInviteJockey.invitation)} disabled={actingId === getInvitationId(selectedInviteJockey.invitation)}>
                    {t('ownerRaceCancelInvite')}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="owner-form-row legacy-jockey-select">
              <div>
                <label className="field-label" htmlFor="ownerJockeyId">{t('ownerRaceActiveJockeyLabel')} <span className="required">*</span></label>
                <select className={formErrors.jockeyId ? 'input has-error' : 'input'} id="ownerJockeyId" name="jockeyId" value={formValues.jockeyId} onChange={handleChange} disabled={isSaving || isLoading || !inviteReady}>
                  <option value="">{t('ownerRaceChooseJockey')}</option>
                  {jockeys.map((jockey) => {
                    const jockeyId = getUserId(jockey);
                    return <option key={jockeyId} value={jockeyId}>{jockey.fullName || jockey.email || `Jockey ${jockeyId}`}</option>;
                  })}
                </select>
                {!isLoading && jockeys.length === 0 && <p className="field-hint warning-text">{t('ownerRaceNoActiveJockey')}</p>}
              </div>

              <div>
                <label className="field-label" htmlFor="ownerExpiredAt">{t('ownerRaceInviteDeadline')}</label>
                <input
                  className={formErrors.expiredAt ? 'input has-error' : 'input'}
                  id="ownerExpiredAt"
                  name="expiredAt"
                  type="date"
                  value={formValues.expiredAt}
                  onChange={handleChange}
                  min={responseDeadlineMin}
                  max={responseDeadlineMax || undefined}
                  disabled={isSaving || !inviteReady}
                />
                {selectedTournament && (
                  <p className="field-hint">
                    {t('ownerRaceDeadlineHint')} <strong>{formatDateTime(getRegistrationDeadline(selectedTournament), t, language)}</strong>.
                  </p>
                )}
                {formErrors.expiredAt && <p className="field-error">{formErrors.expiredAt}</p>}
              </div>
            </div>

            <label className="field-label legacy-invite-message" htmlFor="ownerInviteMessage">{t('ownerRaceMessage')}</label>
            <textarea className="input textarea-input legacy-invite-message-input" id="ownerInviteMessage" name="message" rows={3} value={formValues.message} onChange={handleChange} disabled={isSaving || !inviteReady} placeholder={t('ownerRaceMessagePlaceholder')} />

            <div className="owner-form-row">
              <div>
                <label className="field-label" htmlFor="ownerInviteDeadline">{t('ownerRaceInviteDeadline')} <span className="required">*</span></label>
                <input
                  className={formErrors.expiredAt ? 'input has-error' : 'input'}
                  id="ownerInviteDeadline"
                  name="expiredAt"
                  type="date"
                  value={formValues.expiredAt}
                  onChange={handleChange}
                  min={responseDeadlineMin}
                  max={responseDeadlineMax || undefined}
                  disabled={isSaving || !inviteReady}
                />
                {selectedTournament && (
                  <p className="field-hint">
                    {t('ownerRaceDeadlineHint')} <strong>{formatDateTime(getRegistrationDeadline(selectedTournament), t, language)}</strong>.
                  </p>
                )}
                {formErrors.expiredAt && <p className="field-error">{formErrors.expiredAt}</p>}
              </div>

              <div>
                <label className="field-label" htmlFor="ownerInviteMessageInline">{t('ownerRaceMessage')}</label>
                <textarea className="input textarea-input compact-message" id="ownerInviteMessageInline" name="message" rows={3} value={formValues.message} onChange={handleChange} disabled={isSaving || !inviteReady} placeholder={t('ownerRaceMessagePlaceholder')} />
              </div>
            </div>

            {!inviteReady ? (
              <p className="table-empty">{t('ownerRacePickFirst')}</p>
            ) : isLoading ? (
              <p className="table-empty">{t('ownerRaceLoadingJockeys')}</p>
            ) : enrichedJockeys.length === 0 ? (
              <p className="table-empty">{t('ownerRaceNoActiveJockey')}</p>
            ) : (
              <div className="owner-jockey-picker">
                {enrichedJockeys.map(({ jockey, jockeyId, stats, invitation, invitationStatus }) => {
                  const isSendingInvite = invitingJockeyId === jockeyId;
                  const isPending = invitationStatus === 'PENDING';
                  const isAccepted = ['ACCEPTED', 'APPROVED'].includes(invitationStatus);
                  const canCancel = isPending && invitation;
                  const hasActiveInvitationForHorse = Boolean(currentPendingInvitation || hasAcceptedInvitation);
                  const isBlockedByAnotherInvitation = hasActiveInvitationForHorse && !isPending && !isAccepted;

                  return (
                    <article className={`owner-jockey-card ${isPending ? 'pending-invite' : ''} ${isAccepted ? 'accepted-invite' : ''} ${isSendingInvite ? 'sending' : ''}`} key={jockeyId}>
                      <div className="owner-jockey-card-head">
                        <div>
                          <p className="eyebrow">{stats.license}</p>
                          <h3>{getJockeyName(jockey)}</h3>
                          <span><ShieldCheck size={14} /> {stats.license}</span>
                        </div>
                        <StatusBadge status={isSendingInvite ? 'SENDING' : invitationStatus || 'AVAILABLE'} />
                      </div>

                      <div className="owner-jockey-metrics">
                        <span>{t('ownerRaceTotalRace')} <strong>{stats.totalRaces}</strong></span>
                        <span>{t('ownerRaceWinRate')} <strong>{formatPercent(stats.winRate, t)}</strong></span>
                        <span>{t('ownerRaceTop3Rate')} <strong>{formatPercent(stats.top3Rate, t)}</strong></span>
                        <span>{t('ownerRaceViolation')} <strong>{stats.violationCount}</strong></span>
                        <span>{t('ownerRaceRecentRace')} <strong>{stats.recentRace}</strong></span>
                        <span>{t('ownerRaceAvailability')} <strong>{isSendingInvite ? formatStatus('SENDING', t) : invitation ? formatStatus(invitationStatus, t) : formatStatus('AVAILABLE', t)}</strong></span>
                      </div>

                      <div className="owner-jockey-actions">
                        <button type="button" className="outline-button" onClick={() => setDetailJockey(jockey)}>
                          <Eye size={15} /> {t('ownerRaceViewDetails')}
                        </button>
                        {canCancel ? (
                          <button type="button" className="table-button danger-action" onClick={() => handleCancel(invitation)} disabled={actingId === getInvitationId(invitation)}>
                            {t('ownerRaceCancelInvite')}
                          </button>
                        ) : (
                          <button type="button" className="primary-button compact-primary" onClick={() => handleInviteJockey(jockeyId)} disabled={isSaving || isSendingInvite || isAccepted || Boolean(invitation) || isBlockedByAnotherInvitation}>
                            {invitation ? <CheckCircle2 size={15} /> : <Send size={15} />}
                            {isSendingInvite ? t('ownerRaceSending') : invitation ? t('ownerRaceInvited') : t('ownerRaceInvite')}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="admin-form-actions tournament-modal-actions legacy-invite-actions">
              <button className="primary-button" type="submit" disabled={isSaving || isLoading || !inviteReady || Boolean(currentPendingInvitation)}>
                <Send size={16} /> {isSaving ? t('ownerRaceSending') : t('ownerRaceSendInvite')}
              </button>
            </div>
          </form>

          {isPaymentFlowActive && (paymentResult || isRegistrationPaid) ? (
          <section className="owner-panel owner-payment-result" role="status">
            <div className={`owner-payment-result-icon ${isRegistrationPaid ? 'success' : 'failed'}`}>
              {isRegistrationPaid ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            </div>
            <div className="owner-payment-result-copy">
              <p className="eyebrow">{paymentResult ? t('ownerRacePaymentResultEyebrow') : t('ownerRacePaymentDetailsEyebrow')}</p>
              <h2>{isRegistrationPaid ? t('ownerRacePaymentCompletedTitle') : t('ownerRacePaymentFailedTitle')}</h2>
              <p>{isRegistrationPaid
                ? t('ownerRacePaymentCompletedDesc')
                : paymentResult.message || t('ownerRacePaymentFailedDesc')}</p>
            </div>
            <dl className="owner-payment-result-details">
              <div><dt>{t('ownerRaceTournamentLabel')}</dt><dd>{selectedTournament ? getTournamentName(selectedTournament) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceHorseLabel')} / Jockey</dt><dd>{selectedHorse ? getHorseName(selectedHorse) : 'N/A'} / {selectedAcceptedInvitation ? getInvitationJockeyName(selectedAcceptedInvitation) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceRegistrationCode')}</dt><dd>{registrationResult?.registrationNo || selectedAcceptedInvitation?.registrationNo || (paymentResult?.registrationId ? `#${paymentResult.registrationId}` : 'N/A')}</dd></div>
              <div><dt>{t('ownerRaceAmount')}</dt><dd>{formatCurrency(paymentResult?.amount ?? selectedTournament?.entryFee)}</dd></div>
              <div><dt>{t('ownerRacePayment')}</dt><dd><StatusBadge status={selectedPaymentStatus || 'FAILED'} /></dd></div>
              <div><dt>{t('ownerRaceApproval')}</dt><dd><StatusBadge status={selectedApprovalStatus || 'PENDING'} /></dd></div>
              {paymentResult?.txnRef && <div><dt>{t('ownerRaceTransactionCode')}</dt><dd>{paymentResult.txnRef}</dd></div>}
            </dl>
            <div className="owner-payment-result-actions">
              <button className="primary-button" type="button" onClick={clearTournamentSelection}>
                {t('ownerRaceFinish')}
              </button>
            </div>
          </section>
          ) : isPaymentFlowActive && hasAcceptedInvitation && canStartInvitationPayment(selectedAcceptedInvitation) ? (
          <form className={`owner-panel owner-form flow-only ${wizardStep === 4 ? '' : 'wizard-step-hidden'}`} onSubmit={handleRegistrationSubmit} noValidate>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">{t('ownerRacePaymentTitle')}</p>
                <h2>{t('ownerRacePaymentReviewTitle')}</h2>
                <p>{t('ownerRacePaymentReviewDesc')}</p>
              </div>
            </div>

            {registrationSubmitError && <div className="admin-alert error modal-alert" role="alert">{registrationSubmitError}</div>}
            {registrationErrors.jockeyId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.jockeyId}</div>}

            <div className="owner-payment-order-summary">
              <div><span>{t('ownerRaceTournamentLabel')}</span><strong>{selectedTournament ? getTournamentName(selectedTournament) : t('notUpdated')}</strong></div>
              <div><span>{t('ownerRaceHorseLabel')}</span><strong>{selectedHorse ? getHorseName(selectedHorse) : t('notUpdated')}</strong></div>
              <div><span>Jockey</span><strong>{selectedAcceptedInvitation ? getInvitationJockeyName(selectedAcceptedInvitation) : t('notUpdated')}</strong></div>
              <div><span>{t('ownerRaceEntryFee')}</span><strong>{selectedTournament ? formatCurrency(selectedTournament.entryFee) : '0 VND'}</strong></div>
            </div>

            <div className="registration-default-status owner-payment-status-row">
              <span>{t('ownerRacePayment')} <strong>{isRegistrationPaid ? formatStatus('PAID', t) : isRegistrationUnpaid ? formatStatus(selectedPaymentStatus, t) : t('ownerRaceNoTransaction')}</strong></span>
              <span>{t('ownerRaceApproval')} <strong>{selectedApprovalStatus ? formatStatus(selectedApprovalStatus, t) : t('ownerRaceAfterPayment')}</strong></span>
            </div>

            {selectedAcceptedInvitation && (
              <div className={`admin-alert ${isRegistrationPaid ? 'success' : 'warning'} modal-alert`} role="status">
                {isRegistrationPaid
                  ? t('ownerRaceInvitePaidNotice')
                  : t('ownerRaceInviteNeedPaymentNotice')}
              </div>
            )}

            {registrationResult && (
              <div className="admin-alert success modal-alert" role="status">
                {t('ownerRaceRegistrationCreated', {
                  code: registrationResult.registrationNo || `#${registrationResult.registrationId || ''}`,
                  paymentStatus: formatStatus(registrationResult.paymentStatus || 'UNPAID', t),
                  approvalStatus: formatStatus(registrationResult.approvalStatus || 'PENDING', t)
                })}
              </div>
            )}

            <div className="admin-form-actions tournament-modal-actions">
              <button className="primary-button" type="submit" disabled={isRegistrationPaid || isRegistering || isLoading || !canSubmitRegistration}>
                <ArrowRight size={16} /> {isRegistrationPaid ? t('ownerRacePaid') : isRegistering ? `${t('saving')}...` : t('ownerRacePayViaVnpay', { amount: selectedTournament ? formatCurrency(selectedTournament.entryFee) : '' })}
              </button>
            </div>
          </form>
          ) : isInviteFlowActive ? (
          <section className={`owner-panel owner-form flow-only owner-payment-waiting ${wizardStep === 3 ? '' : 'wizard-step-hidden'}`}>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">{t('ownerRaceStepThreeEyebrow')}</p>
                <h2>{hasAcceptedInvitation ? t('ownerRaceWaitingAcceptedTitle') : t('ownerRaceWaitingPendingTitle')}</h2>
                <p>{hasAcceptedInvitation ? t('ownerRaceWaitingAcceptedDesc') : t('ownerRaceWaitingPendingDesc')}</p>
              </div>
            </div>
            <div className={`admin-alert ${hasAcceptedInvitation ? 'success' : 'warning'} modal-alert`} role="status">
              {hasAcceptedInvitation ? t('ownerRaceAcceptedInviteNotice') : t('ownerRaceNoAcceptedInviteNotice')}
            </div>
          </section>
          ) : null}

          <section className="owner-panel overview-only">
            <div className="owner-panel-header">
              <div>
                <h2>{t('ownerRacePaymentReadyTitle')}</h2>
                <p>{t('ownerRacePaymentReadyDesc')}</p>
              </div>
              <div className="owner-payment-summary" aria-label={t('ownerRacePaymentSummary')}>
                <span className="owner-count-pill payment-pending-count">{t('ownerRacePendingPaymentCount', { count: pendingPaymentCount })}</span>
                <span className="owner-count-pill payment-paid-count">{t('ownerRacePaidPaymentCount', { count: paidInvitationCount })}</span>
              </div>
            </div>

            {isLoading ? (
              <p className="table-empty">{t('ownerRaceLoadingAcceptedInvites')}</p>
            ) : payableInvitations.length === 0 ? (
              <p className="table-empty">{t('ownerRaceNoPayableInvite')}</p>
            ) : (
              <div className="table-wrapper">
                <table className="user-table owner-invitation-table">
                  <thead>
                    <tr>
                      <th>Jockey</th>
                      <th>{t('ownerRaceHorseLabel')}</th>
                      <th>{t('ownerRaceTournamentColumn')}</th>
                      <th>{t('ownerRaceRegistrationColumn')}</th>
                      <th>{t('ownerRacePaymentColumn')}</th>
                      <th>{t('ownerRaceActionColumn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payableInvitations.map((invitation) => {
                      const invitationId = getInvitationId(invitation);
                      const paymentStatus = getInvitationPaymentStatus(invitation);
                      const approvalStatus = getInvitationApprovalStatus(invitation);
                      const hasRegistration = hasRegistrationStatus(invitation);
                      const isInvitationPaid = isPaidStatus(paymentStatus);
                      const canStartPayment = canStartInvitationPayment(invitation);

                      return (
                        <tr className={isInvitationPaid ? 'payment-row-paid' : canStartPayment ? 'payment-row-pending' : ''} key={invitationId || `${invitation.tournamentId}-${invitation.jockeyId}`}>
                          <td><strong>{getInvitationJockeyName(invitation)}</strong></td>
                          <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                          <td>
                            <strong>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</strong>
                            <small className="table-subtext">{formatDateRange(invitation.tournamentStartDate, invitation.tournamentEndDate, t)}</small>
                          </td>
                          <td>
                            {hasRegistration ? (
                              <>
                                <strong>{invitation.registrationNo || `#${invitation.registrationId}`}</strong>
                                <small className="table-subtext">{t('ownerRaceApproval')}: {approvalStatus ? formatStatus(approvalStatus, t) : t('notUpdated')}</small>
                              </>
                            ) : <span className="readonly-note">{t('ownerRaceRegistrationNotCreated')}</span>}
                          </td>
                          <td>
                            <StatusBadge status={paymentStatus || 'NOT_CREATED'} />
                            <small className="table-subtext">{isInvitationPaid
                              ? t('ownerRacePaymentCompletedHint')
                              : canStartPayment ? t('ownerRacePaymentActionRequired') : t('ownerRacePaymentUnavailable')}</small>
                          </td>
                          <td>
                            {isInvitationPaid ? (
                              <button type="button" className="table-button payment-detail-button" onClick={() => fillRegistrationFromInvitation(invitation)}>
                                <Eye size={15} /> {t('ownerRaceViewPaymentDetails')}
                              </button>
                            ) : canStartPayment ? (
                              <button type="button" className="primary-button compact-primary payment-action-button" onClick={() => fillRegistrationFromInvitation(invitation)}>
                                <ArrowRight size={15} /> {hasRegistration ? t('ownerRacePay') : t('ownerRaceCreateAndPay')}
                              </button>
                            ) : <span className="readonly-note">{t('ownerRacePaymentUnavailable')}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="owner-panel overview-only">
            <div className="owner-panel-header">
              <div>
                <h2>{t('ownerRaceMyInvitesTitle')}</h2>
                <p>{t('ownerRaceMyInvitesDesc')}</p>
              </div>
              <div className="inline-filter-row">
                <Filter size={16} />
                <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === 'ALL' ? t('allStatuses') : formatStatus(status, t)}</option>)}
                </select>
                <span className="owner-count-pill">{t('ownerRaceRows', { count: `${displayedInvitationRows.length} / ${invitations.length + registeredHorseSummaryRows.length}` })}</span>
              </div>
            </div>

            {isLoading ? (
              <p className="table-empty">{t('ownerRaceLoadingInvites')}</p>
            ) : displayedInvitationRows.length === 0 ? (
              <p className="table-empty">{invitations.length === 0 && registeredHorseSummaryRows.length === 0 ? t('ownerRaceNoInvites') : t('ownerRaceNoInviteMatch')}</p>
            ) : (
              <div className="table-wrapper">
                <table className="user-table owner-invitation-table">
                  <thead>
                    <tr>
                      <th>Jockey</th>
                      <th>{t('ownerRaceHorseLabel')}</th>
                      <th>{t('ownerRaceTournamentColumn')}</th>
                      <th>Deadline</th>
                      <th>{t('ownerRaceInviteColumn')}</th>
                      <th>{t('ownerRaceRegistrationColumn')}</th>
                      <th>{t('ownerRaceActionColumn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInvitationRows.map((invitation) => {
                      const invitationId = getInvitationId(invitation);
                      const isSummaryRow = isRegistrationSummaryRow(invitation);
                      const status = String(invitation.status || '').toUpperCase();
                      const registrationStatus = getInvitationApprovalStatus(invitation);
                      const canCancel = status === 'PENDING';
                      const canOpenPayment = !isSummaryRow && (isAcceptedInvitation(invitation) || hasRegisteredInvitation(invitation));

                      return (
                        <tr key={invitationId || `${invitation.rowType || 'invitation'}-${invitation.tournamentId || 'registered'}-${invitation.horseId}-${invitation.jockeyId || 'none'}`}>
                          <td>
                            <strong>{getInvitationJockeyName(invitation)}</strong>
                            <small className="table-subtext">{t('ownerRaceCreatedAt')}: {formatDate(invitation.createdAt)}</small>
                          </td>
                          <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                          <td>
                            <strong>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</strong>
                            <small className="table-subtext">{formatDateRange(invitation.tournamentStartDate, invitation.tournamentEndDate, t)}</small>
                          </td>
                          <td>{formatDateTime(getInvitationRegistrationDeadline(invitation, tournamentById), t, language)}</td>
                          <td><StatusBadge status={invitation.status} /></td>
                          <td><StatusBadge status={invitation.registrationStatus || t('ownerRaceNone')} /></td>
                          <td>
                            <div className="invitation-action-group">
                              {canCancel ? (
                                <button type="button" className="table-button danger-action" onClick={() => handleCancel(invitation)} disabled={actingId === invitationId}>
                                  {t('cancel')}
                                </button>
                              ) : !canOpenPayment ? (
                                <span className="readonly-note"><MoreVertical size={14} /> {isSummaryRow ? t('ownerRaceRecorded') : t('ownerRaceNone')}</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {isInviteFlowActive && (
            <div className="owner-panel wizard-navigation">
              <button className="outline-button wizard-nav-button" type="button" onClick={clearTournamentSelection} disabled={isSaving || isRegistering}>
                {t('cancel')}
              </button>
              <div className="wizard-navigation-actions">
                <button className="outline-button wizard-nav-button" type="button" onClick={goPreviousStep} disabled={wizardStep <= 1 || isSaving || isRegistering}>
                  {t('previous')}
                </button>
                {wizardStep < 3 && (
                  <button className="primary-button compact-primary wizard-nav-button" type="button" onClick={goNextStep} disabled={isSaving || isRegistering}>
                    {nextStepLabel}
                    {wizardStep === 2 ? <Send size={16} /> : <ArrowRight size={16} />}
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="owner-registration-sidebar">
          <section className="owner-panel registration-progress-panel">
            <p className="eyebrow">{t('ownerRaceProgress')}</p>
            <div className="registration-steps">
              <StepItem number={1} label={t('ownerRaceStepTournament')} complete={Boolean(formValues.tournamentId)} active={activeStep === 1} />
              <StepItem number={2} label={t('ownerRaceStepHorseJockey')} complete={Boolean(formValues.horseId && (currentPendingInvitation || hasAcceptedInvitation))} active={activeStep === 2} />
              <StepItem number={3} label={t('ownerRaceStepJockeyAccepted')} complete={hasAcceptedInvitation} active={activeStep === 3} />
            </div>
          </section>

          <section className="owner-panel registration-selection-panel flow-only">
            <p className="eyebrow">{t('ownerRaceSelecting')}</p>
            <div className="registration-selection-block">
              <span>{t('ownerRaceTournamentLabel')}</span>
              <strong>{selectedTournament ? getTournamentName(selectedTournament) : t('ownerRaceNoSelection')}</strong>
              {selectedTournament && <small>{getTournamentVenue(selectedTournament, t)}</small>}
            </div>
            <div className="registration-selection-block">
              <span>{t('ownerRaceHorseLabel')}</span>
              <strong>{selectedHorse ? getHorseName(selectedHorse) : t('ownerRaceNoSelection')}</strong>
              {selectedHorse && <small>{selectedHorse.breeding || selectedHorse.sex || 'ACTIVE'}</small>}
            </div>
            <div className="registration-selection-block">
              <span>{t('ownerRaceAcceptedJockey')}</span>
              <strong>{selectedAcceptedInvitation ? getInvitationJockeyName(selectedAcceptedInvitation) : t('ownerRaceNoneYet')}</strong>
              {selectedAcceptedInvitation && <small>{t('ownerRaceReadyToRegister')}</small>}
            </div>
          </section>

          <section className="owner-panel registration-help-panel">
            <p className="eyebrow">{t('ownerRaceConditions')}</p>
            <ul>
              <li><CheckCircle2 size={15} /> {t('ownerRaceConditionTournamentOpen')}</li>
              <li><CheckCircle2 size={15} /> {t('ownerRaceConditionHorseActive')}</li>
              <li><CheckCircle2 size={15} /> {t('ownerRaceConditionJockeyAccepted')}</li>
              <li><XCircle size={15} /> {t('ownerRaceConditionNoConflict')}</li>
            </ul>
          </section>
        </aside>
      </div>

      {detailHorse && (() => {
        const stats = getHorseStats(detailHorse);
        return (
          <div className="jockey-detail-drawer-backdrop" role="presentation" onClick={() => setDetailHorse(null)}>
            <aside className="jockey-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="horse-detail-title" onClick={(event) => event.stopPropagation()}>
              <div className="jockey-detail-header">
                <div>
                  <p className="eyebrow">{t('ownerRaceHorseProfile')}</p>
                  <h3 id="horse-detail-title">{getHorseName(detailHorse) || `Horse ${getHorseId(detailHorse) || ''}`}</h3>
                  <span><ShieldCheck size={14} /> {formatDisplayLabel(detailHorse.status || 'ACTIVE')}</span>
                </div>
                <button type="button" className="drawer-close-button" onClick={() => setDetailHorse(null)} aria-label={t('ownerRaceCloseHorseDetail')}>
                  <X size={18} />
                </button>
              </div>

              <div className="jockey-detail-metric-grid">
                <span>{t('ownerRaceTotalRace')} <strong>{stats.totalRaces}</strong></span>
                <span>Top 1 <strong>{stats.top1}</strong></span>
                <span>Top 2 <strong>{stats.top2}</strong></span>
                <span>Top 3 <strong>{stats.top3}</strong></span>
                <span>{t('ownerRaceTop3Rate')} <strong>{formatPercent(stats.top3Rate, t)}</strong></span>
                <span>{t('ownerRaceViolation')} <strong>{stats.violationCount} / DQ {stats.disqualifiedCount}</strong></span>
              </div>

              <section className="jockey-detail-section">
                <h4>{t('ownerRaceProfileInfo')}</h4>
                <div className="jockey-detail-list">
                  <div><strong>{t('ownerRaceBreeding')}</strong><span>{detailHorse.breeding || t('notUpdated')}</span></div>
                  <div><strong>{t('ownerHorseSex')}</strong><span>{formatDisplayLabel(detailHorse.sex, t('notUpdated'))}</span></div>
                  <div><strong>{t('ownerRaceColour')}</strong><span>{detailHorse.colour || detailHorse.color || t('notUpdated')}</span></div>
                  <div><strong>{t('ownerRaceWeight')}</strong><span>{detailHorse.weight ? `${detailHorse.weight} kg` : t('notUpdated')}</span></div>
                  <div><strong>{t('ownerRaceTrainer')}</strong><span>{detailHorse.trainer || t('notUpdated')}</span></div>
                  <div><strong>{t('ownerRaceHealthCertificate')}</strong><span>{formatDate(detailHorse.healthCertificateExpiryDate || detailHorse.healthCertExpiry)}</span></div>
                </div>
              </section>

              <section className="jockey-detail-section">
                <h4>{t('ownerRaceRecentPerformance')}</h4>
                {Array.isArray(stats.recentRaces) && stats.recentRaces.length > 0 ? (
                  <div className="jockey-detail-list">
                    {stats.recentRaces.slice(0, 5).map((race, index) => (
                      <div key={`${race.raceId || race.name || index}`}>
                        <strong>{race.raceName || race.name || `Race ${index + 1}`}</strong>
                        <span>{formatDateTime(race.raceStartTime || race.date, t, language)} - {t('ownerRaceRank')} {firstDefined(race.finishPosition, race.position, 'N/A')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="drawer-empty-note">{t('ownerRaceNoRecentRaceData')}</p>
                )}
              </section>
            </aside>
          </div>
        );
      })()}

      {detailJockey && (() => {
        const stats = getJockeyStats(detailJockey, t);
        return (
          <div className="jockey-detail-drawer-backdrop" role="presentation" onClick={() => setDetailJockey(null)}>
            <aside className="jockey-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="jockey-detail-title" onClick={(event) => event.stopPropagation()}>
              <div className="jockey-detail-header">
                <div>
                  <p className="eyebrow">{t('ownerRaceJockeyDetail')}</p>
                  <h3 id="jockey-detail-title">{getJockeyName(detailJockey)}</h3>
                  <span><ShieldCheck size={14} /> {stats.license}</span>
                </div>
                <button type="button" className="drawer-close-button" onClick={() => setDetailJockey(null)} aria-label={t('ownerRaceCloseJockeyDetail')}>
                  <X size={18} />
                </button>
              </div>

              <div className="jockey-detail-metric-grid">
                <span>{t('ownerRaceTotalRace')} <strong>{stats.totalRaces}</strong></span>
                <span>{t('ownerRaceWins')} <strong>{stats.wins}</strong></span>
                <span>{t('ownerRaceWinRate')} <strong>{formatPercent(stats.winRate, t)}</strong></span>
                <span>{t('ownerRaceTop3Rate')} <strong>{formatPercent(stats.top3Rate, t)}</strong></span>
                <span>{t('ownerRaceLicense')} <strong>{stats.license}</strong></span>
                <span>{t('ownerRaceViolation')} <strong>{stats.violationCount} / DQ {stats.disqualifiedCount}</strong></span>
              </div>

              <section className="jockey-detail-section">
                <h4>{t('ownerRaceRecentHistory')}</h4>
                {Array.isArray(stats.recentRaces) && stats.recentRaces.length > 0 ? (
                  <div className="jockey-detail-list">
                    {stats.recentRaces.slice(0, 5).map((race, index) => (
                      <div key={`${race.raceId || race.name || index}`}>
                        <strong>{race.raceName || race.name || `Race ${index + 1}`}</strong>
                        <span>{formatDateTime(race.raceStartTime || race.date, t, language)} · {t('ownerRaceRank')} {firstDefined(race.finishPosition, race.position, 'N/A')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="drawer-empty-note">{t('ownerRaceNoRecentRaceData')}</p>
                )}
              </section>

              <section className="jockey-detail-section">
                <h4>{t('ownerRacePerformanceByDistanceTrack')}</h4>
                <div className="jockey-detail-split">
                  <div>
                    <strong>{t('ownerRaceDistance')}</strong>
                    {Array.isArray(stats.distanceStats) && stats.distanceStats.length > 0 ? stats.distanceStats.slice(0, 4).map((item, index) => (
                      <span key={`${item.distance || index}`}>{item.distance || 'N/A'} · {formatPercent(item.winRate, t)}</span>
                    )) : <span>{t('ownerRaceNoData')}</span>}
                  </div>
                  <div>
                    <strong>{t('ownerRaceTrack')}</strong>
                    {Array.isArray(stats.trackStats) && stats.trackStats.length > 0 ? stats.trackStats.slice(0, 4).map((item, index) => (
                      <span key={`${item.trackName || index}`}>{item.trackName || item.track || 'N/A'} · {formatPercent(item.winRate, t)}</span>
                    )) : <span>{t('ownerRaceNoData')}</span>}
                  </div>
                </div>
              </section>

              <section className="jockey-detail-section">
                <h4>{t('ownerRaceViolationAvailability')}</h4>
                <div className="jockey-detail-list">
                  <div><strong>{t('ownerRaceViolationCount')}</strong><span>{stats.violationCount}</span></div>
                  <div><strong>{t('ownerRaceDisqualifiedCount')}</strong><span>{stats.disqualifiedCount}</span></div>
                  <div><strong>{t('ownerRaceRecentRace')}</strong><span>{stats.recentRace}</span></div>
                </div>
              </section>
            </aside>
          </div>
        );
      })()}

      <ConfirmModal
        open={Boolean(cancelInvitationTarget)}
        title={t('ownerRaceCancelInviteTitle')}
        message={t('ownerRaceCancelInviteMessage', { name: cancelInvitationTarget ? getInvitationJockeyName(cancelInvitationTarget) : 'Jockey' })}
        confirmLabel={t('ownerRaceCancelInvite')}
        cancelLabel={t('ownerRaceBackToInvitation')}
        variant="danger"
        loading={Boolean(actingId)}
        onCancel={() => setCancelInvitationTarget(null)}
        onConfirm={confirmCancelInvitation}
      />
    </section>
  );
}
