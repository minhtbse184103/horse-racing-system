import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Eye,
  Flag,
  MapPin,
  RefreshCw,
  Search,
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
  getOwnerTournamentDetail,
  inviteJockey,
  startOwnerRegistrationPayment
} from '../../services/ownerService';
import { confirmVnpayReturn } from '../../services/paymentService';
import { getTournaments } from '../../services/eventService';
import API_BASE_URL from '../../configs/apiConfig';
import { formatDate, formatDisplayLabel, getHorseId, getHorseName, getUserId, getUserRole } from '../../lib';
import ConfirmModal from '../common/ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import { formatVndCurrency } from '../../lib/eventFormatters';

const LEGACY_OWNER_CANCELLED_INVITATION_STORAGE_KEY = 'owner_cancelled_jockey_invitations';
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

function getInvitationId(invitation) {
  return invitation?.invitationId ?? invitation?.invitationID ?? invitation?.id ?? '';
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
  const value = String(tournament?.venueImageSrc || tournament?.venueImageUrl || tournament?.venueImagePath || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

function getRaceImageUrl(race) {
  const value = String(race?.trackImageSrc || race?.trackImageUrl || race?.trackImagePath || '').trim();
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
  return formatVndCurrency(value);
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

function getHorseRegistrations(horse) {
  const registrations = firstDefined(horse?.registrations, horse?.raceRegistrations, horse?.tournamentRegistrations, []);
  return Array.isArray(registrations) ? registrations : [];
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

function findInvitationByRegistrationId(invitations, registrationId) {
  const targetId = String(registrationId || '');
  if (!targetId) return null;
  return invitations.find((invitation) => String(invitation?.registrationId || '') === targetId) || null;
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

function getEffectiveInvitationStatus(invitation) {
  const aliases = {
    APPROVED: 'ACCEPTED',
    CANCELED: 'CANCELLED',
    DECLINED: 'REJECTED'
  };
  const rawStatus = String(invitation?.status || '').toUpperCase();
  const status = aliases[rawStatus] || rawStatus;
  const expiry = getDateTime(invitation?.expiredAt);

  if (status === 'PENDING' && expiry && expiry.getTime() <= Date.now()) return 'EXPIRED';
  return status;
}

const TOURNAMENT_WORKFLOW_CONFIG = {
  NO_INVITATION: {
    statusKey: 'ownerRaceWorkflowNoInvitation',
    descriptionKey: 'ownerRaceWorkflowNoInvitationDesc',
    tone: 'neutral'
  },
  INVITATION_PENDING: {
    statusKey: 'ownerRaceWorkflowInvitationPending',
    descriptionKey: 'ownerRaceWorkflowInvitationPendingDesc',
    actionKey: 'ownerRaceWorkflowViewInvitation',
    actionType: 'view-invitation',
    tone: 'waiting'
  },
  INVITATION_REJECTED: {
    statusKey: 'ownerRaceWorkflowInvitationRejected',
    descriptionKey: 'ownerRaceWorkflowInvitationRejectedDesc',
    actionKey: 'ownerRaceWorkflowInviteAnotherJockey',
    actionType: 'restart-invitation',
    tone: 'danger'
  },
  INVITATION_EXPIRED: {
    statusKey: 'ownerRaceWorkflowInvitationExpired',
    descriptionKey: 'ownerRaceWorkflowInvitationExpiredDesc',
    actionKey: 'ownerRaceWorkflowResendInvitation',
    actionType: 'restart-invitation',
    tone: 'neutral'
  },
  INVITATION_CANCELLED: {
    statusKey: 'ownerRaceWorkflowInvitationCancelled',
    descriptionKey: 'ownerRaceWorkflowInvitationCancelledDesc',
    actionKey: 'ownerRaceWorkflowInviteJockey',
    actionType: 'restart-invitation',
    tone: 'neutral'
  },
  INVITATION_ACCEPTED: {
    statusKey: 'ownerRaceWorkflowInvitationAccepted',
    descriptionKey: 'ownerRaceWorkflowInvitationAcceptedDesc',
    actionKey: 'ownerRaceWorkflowCreateAndPay',
    actionType: 'payment',
    tone: 'info'
  },
  PAYMENT_UNPAID: {
    statusKey: 'ownerRaceWorkflowPaymentUnpaid',
    descriptionKey: 'ownerRaceWorkflowPaymentUnpaidDesc',
    actionKey: 'ownerRaceWorkflowPayNow',
    actionType: 'payment',
    tone: 'waiting'
  },
  PAYMENT_FAILED: {
    statusKey: 'ownerRaceWorkflowPaymentFailed',
    descriptionKey: 'ownerRaceWorkflowPaymentFailedDesc',
    actionKey: 'ownerRaceWorkflowRetryPayment',
    actionType: 'payment',
    tone: 'danger'
  },
  PAYMENT_FAILED_CANCELLED: {
    statusKey: 'ownerRaceWorkflowPaymentFailedCancelled',
    descriptionKey: 'ownerRaceWorkflowPaymentFailedCancelledDesc',
    actionKey: 'ownerRaceWorkflowViewDetails',
    actionType: 'registration-details',
    tone: 'danger'
  },
  PAID_PENDING_APPROVAL: {
    statusKey: 'ownerRaceWorkflowPaidPendingApproval',
    descriptionKey: 'ownerRaceWorkflowPaidPendingApprovalDesc',
    actionKey: 'ownerRaceWorkflowViewRegistration',
    actionType: 'registration-details',
    tone: 'waiting'
  },
  REGISTRATION_APPROVED: {
    statusKey: 'ownerRaceWorkflowRegistrationApproved',
    descriptionKey: 'ownerRaceWorkflowRegistrationApprovedDesc',
    actionKey: 'ownerRaceWorkflowViewRegistration',
    actionType: 'registration-details',
    tone: 'success'
  },
  REGISTRATION_REJECTED: {
    statusKey: 'ownerRaceWorkflowRegistrationRejected',
    descriptionKey: 'ownerRaceWorkflowRegistrationRejectedDesc',
    actionKey: 'ownerRaceWorkflowViewRejectionReason',
    actionType: 'registration-details',
    tone: 'danger'
  },
  REGISTRATION_CANCELLED: {
    statusKey: 'ownerRaceWorkflowRegistrationCancelled',
    descriptionKey: 'ownerRaceWorkflowRegistrationCancelledDesc',
    actionKey: 'ownerRaceWorkflowViewDetails',
    actionType: 'registration-details',
    tone: 'danger'
  },
  PAYMENT_REFUNDED: {
    statusKey: 'ownerRaceWorkflowPaymentRefunded',
    descriptionKey: 'ownerRaceWorkflowPaymentRefundedDesc',
    actionKey: 'ownerRaceWorkflowViewTransaction',
    actionType: 'transactions',
    tone: 'info'
  },
  UNKNOWN: {
    statusKey: 'ownerRaceWorkflowUnknown',
    descriptionKey: 'ownerRaceWorkflowUnknownDesc',
    actionKey: 'ownerRaceWorkflowViewDetails',
    actionType: 'workflow-details',
    tone: 'neutral'
  }
};

function getTournamentWorkflowKind(invitation) {
  if (!invitation) return 'NO_INVITATION';

  const invitationStatus = getEffectiveInvitationStatus(invitation);
  const approvalStatus = getInvitationApprovalStatus(invitation);
  const paymentStatus = getInvitationPaymentStatus(invitation);
  const hasLinkedRegistration = Boolean(invitation?.registrationId || invitation?.registrationNo);

  if (!hasLinkedRegistration) {
    if (invitationStatus === 'REJECTED') return 'INVITATION_REJECTED';
    if (invitationStatus === 'EXPIRED') return 'INVITATION_EXPIRED';
    if (invitationStatus === 'CANCELLED') return 'INVITATION_CANCELLED';
  }

  if (hasRegistrationStatus(invitation)) {
    if (approvalStatus === 'REJECTED') return 'REGISTRATION_REJECTED';
    if (paymentStatus === 'REFUNDED') return 'PAYMENT_REFUNDED';
    if (paymentStatus === 'FAILED' && approvalStatus === 'CANCELLED') return 'PAYMENT_FAILED_CANCELLED';
    if (approvalStatus === 'CANCELLED') return 'REGISTRATION_CANCELLED';
    if (paymentStatus === 'PAID' && approvalStatus === 'APPROVED') return 'REGISTRATION_APPROVED';
    if (paymentStatus === 'PAID') return 'PAID_PENDING_APPROVAL';
    if (paymentStatus === 'FAILED') return 'PAYMENT_FAILED';
    if (paymentStatus === 'UNPAID') return 'PAYMENT_UNPAID';
  }

  if (invitationStatus === 'ACCEPTED') return 'INVITATION_ACCEPTED';
  if (invitationStatus === 'PENDING') return 'INVITATION_PENDING';
  if (invitationStatus === 'REJECTED') return 'INVITATION_REJECTED';
  if (invitationStatus === 'EXPIRED') return 'INVITATION_EXPIRED';
  if (invitationStatus === 'CANCELLED') return 'INVITATION_CANCELLED';
  return 'UNKNOWN';
}

function getTournamentWorkflowState(invitation, t) {
  const kind = getTournamentWorkflowKind(invitation);
  const config = TOURNAMENT_WORKFLOW_CONFIG[kind] || TOURNAMENT_WORKFLOW_CONFIG.UNKNOWN;
  return {
    ...config,
    kind,
    label: t(config.statusKey),
    description: t(config.descriptionKey),
    actionLabel: config.actionKey ? t(config.actionKey) : ''
  };
}

function getTournamentWorkflowRank(invitation) {
  const invitationStatus = getEffectiveInvitationStatus(invitation);
  const approvalStatus = getInvitationApprovalStatus(invitation);
  const paymentStatus = getInvitationPaymentStatus(invitation);
  const hasRegistration = hasRegistrationStatus(invitation);

  if (['REJECTED', 'CANCELLED', 'EXPIRED'].includes(invitationStatus)) return 100;
  if (['REJECTED', 'CANCELLED'].includes(approvalStatus) || paymentStatus === 'REFUNDED') return 100;
  if (hasRegistration && ['PENDING', 'APPROVED'].includes(approvalStatus)) return 400;
  if (hasRegistration && paymentStatus === 'PAID' && !approvalStatus) return 350;
  if (hasRegistration && ['UNPAID', 'FAILED'].includes(paymentStatus) && !approvalStatus) return 340;
  if (!hasRegistration && invitationStatus === 'ACCEPTED') return 300;
  if (!hasRegistration && invitationStatus === 'PENDING') return 250;
  return 100;
}

function isNewerTournamentWorkflow(candidate, current) {
  const candidateRank = getTournamentWorkflowRank(candidate);
  const currentRank = getTournamentWorkflowRank(current);
  if (candidateRank !== currentRank) return candidateRank > currentRank;

  const candidateCreatedAt = getDateTime(candidate?.createdAt)?.getTime() || 0;
  const currentCreatedAt = getDateTime(current?.createdAt)?.getTime() || 0;
  if (candidateCreatedAt !== currentCreatedAt) return candidateCreatedAt > currentCreatedAt;

  return Number(getInvitationId(candidate) || 0) > Number(getInvitationId(current) || 0);
}

function isAlreadyPaidError(message) {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('already been paid')
    || normalized.includes('already paid')
    || normalized.includes('đã được thanh toán')
    || normalized.includes('đã thanh toán');
}

function isActiveHorseInvitation(invitation) {
  const invitationStatus = String(invitation?.status || '').toUpperCase();
  if (isClosedInvitationStatus(invitationStatus)) return false;

  const expiry = getDateTime(invitation?.expiredAt);
  if (invitationStatus === 'PENDING' && expiry && expiry.getTime() <= Date.now()) return false;

  const approvalStatus = getInvitationApprovalStatus(invitation);
  if (approvalStatus) return ['PENDING', 'APPROVED'].includes(approvalStatus);

  return isLockedInvitationStatus(invitationStatus)
    || isLockedRegistrationStatus(invitation?.registrationStatus);
}

function tournamentDateRangesOverlap(leftTournament, rightTournament) {
  const leftStart = getDateTime(leftTournament?.startDate ?? leftTournament?.tournamentStartDate);
  const leftEnd = getDateTime(leftTournament?.endDate ?? leftTournament?.tournamentEndDate);
  const rightStart = getDateTime(rightTournament?.startDate ?? rightTournament?.tournamentStartDate);
  const rightEnd = getDateTime(rightTournament?.endDate ?? rightTournament?.tournamentEndDate);

  if (!leftStart || !leftEnd || !rightStart || !rightEnd) return false;
  return leftStart.getTime() <= rightEnd.getTime() && leftEnd.getTime() >= rightStart.getTime();
}

function getHorseTournamentLockKey(horseId, tournamentId) {
  return `${tournamentId || ''}:${horseId || ''}`;
}

function isOverlappingHorseError(message) {
  const normalized = String(message || '').toLowerCase();
  if (
    normalized.includes('jockey')
    || normalized.includes('nài ngựa')
  ) return false;

  return normalized.includes('ngựa này')
    && (
      normalized.includes('trùng thời gian')
      || normalized.includes('trung thoi gian')
      || normalized.includes('overlapping tournament')
    );
}

function isJockeyAvailabilityError(message) {
  const normalized = String(message || '').toLowerCase();
  const mentionsJockey = normalized.includes('jockey')
    || normalized.includes('nài ngựa');
  const mentionsConflict = normalized.includes('lời mời')
    || normalized.includes('đơn đăng ký')
    || normalized.includes('overlapping tournament')
    || normalized.includes('active registration');
  return mentionsJockey && mentionsConflict;
}

function getHorseTournamentLockReason(horse, tournament, invitations = [], manualLocks = {}, t) {
  if (!horse || !tournament) return '';
  const tournamentId = getTournamentId(tournament);
  const manualReason = manualLocks[getHorseTournamentLockKey(getHorseId(horse), tournamentId)];
  if (manualReason) return manualReason;

  const horseId = getHorseId(horse);
  const matchedRegistration = getHorseRegistrations(horse)
    .find((registration) => (
      String(firstDefined(registration.tournamentId, registration.tournamentID, registration.tournament?.tournamentId)) === String(tournamentId)
      && isLockedRegistrationStatus(firstDefined(
        registration.status,
        registration.approvalStatus,
        registration.registrationStatus,
        registration.paymentStatus
      ))
    ));

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

  const overlappingInvitation = invitations.find((invitation) => (
    String(getInvitationHorseId(invitation)) === String(horseId)
    && String(getInvitationTournamentId(invitation)) !== String(tournamentId)
    && isActiveHorseInvitation(invitation)
    && tournamentDateRangesOverlap(tournament, {
      startDate: invitation.tournamentStartDate ?? invitation.tournament?.startDate,
      endDate: invitation.tournamentEndDate ?? invitation.tournament?.endDate
    })
  ));

  if (overlappingInvitation) {
    return t?.('ownerRaceHorseOverlappingTournamentLock') || 'Ngựa này đã có đơn đăng ký hoặc lời mời ở giải đấu trùng thời gian.';
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
  const profile = jockey?.profile || jockey?.jockeyProfile || {};
  const totalRaces = toNumber(firstDefined(source.totalRaces, jockey?.totalRaces, jockey?.raceCount));
  const wins = toNumber(firstDefined(source.top1Count, source.winCount, jockey?.top1Count, jockey?.totalWins));
  const top3Total = getTop3Count(source) || toNumber(firstDefined(jockey?.top3Count));

  return {
    license: firstDefined(jockey?.licenseNo, jockey?.licenceNo, jockey?.licenseNumber, profile.licenseNo, profile.licenceNo, jockey?.licenceType, jockey?.licenseType, profile.licenceType, t?.('notUpdated') || 'Not updated'),
    ranking: firstDefined(jockey?.ranking, profile.ranking, t?.('notUpdated') || 'Not updated'),
    status: firstDefined(jockey?.status, profile.status, jockey?.verificationStatus, t?.('notUpdated') || 'Not updated'),
    email: firstDefined(jockey?.email, profile.email, t?.('notUpdated') || 'Not updated'),
    phone: firstDefined(jockey?.phone, jockey?.phoneNumber, profile.phone, profile.phoneNumber, t?.('notUpdated') || 'Not updated'),
    weight: firstDefined(jockey?.weight, profile.weight),
    biography: firstDefined(jockey?.biography, profile.biography, t?.('notUpdated') || 'Not updated'),
    totalRaces,
    wins,
    winRate: firstDefined(source.winRate, jockey?.winRate, calculateRate(wins, totalRaces)),
    top3Rate: firstDefined(source.top3Rate, jockey?.top3Rate, calculateRate(top3Total, totalRaces)),
    violationCount: toNumber(firstDefined(source.violationCount, jockey?.violationCount)),
    disqualifiedCount: toNumber(firstDefined(source.disqualifiedCount, jockey?.disqualifiedCount)),
    recentRace: firstDefined(jockey?.recentRaceName, jockey?.lastRaceName, source.recentRaceName, t?.('ownerRaceNoData') || 'No data yet'),
    recentRaces: firstDefined(jockey?.recentRaces, jockey?.raceHistory, source.recentRaces, [])
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

function getTournamentConditions(tournament) {
  return Array.isArray(tournament?.conditions) ? tournament.conditions : null;
}

function getConditionType(condition) {
  return String(condition?.conditionType ?? condition?.type ?? '').trim().toUpperCase();
}

function getConditionOperator(condition) {
  return String(condition?.operator || '').trim().toUpperCase();
}

function toStrictNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatConditionNumber(value) {
  const number = toStrictNumber(value);
  if (number === null) return '';
  return number.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function formatTournamentCondition(condition, t) {
  const type = getConditionType(condition);
  const operator = getConditionOperator(condition);
  const rawValue = condition?.value;
  const unit = type === 'AGE' ? t('ownerRaceYears') : type === 'WEIGHT' ? 'kg' : '';
  const typeLabel = type === 'AGE'
    ? t('ownerRaceConditionAge')
    : type === 'WEIGHT'
      ? t('ownerRaceConditionWeight')
      : type === 'GENDER'
        ? t('ownerRaceConditionGender')
        : t('ownerRaceConditionUnknown');

  if (type === 'GENDER' && String(rawValue || '').trim().toUpperCase() === 'ANY') {
    return `${typeLabel}: ${t('ownerRaceConditionAnyGender')}`;
  }
  if (type === 'GENDER') {
    return `${typeLabel}: ${formatDisplayLabel(rawValue || t('notUpdated'))}`;
  }
  if (operator === 'BETWEEN') {
    const min = formatConditionNumber(condition?.minValue);
    const max = formatConditionNumber(condition?.maxValue);
    return min && max
      ? `${typeLabel}: ${min} - ${max} ${unit}`
      : `${typeLabel}: ${t('ownerRaceConditionInvalidConfiguration')}`;
  }

  const operatorLabels = { EQ: '=', GT: '>', GTE: '≥', LT: '<', LTE: '≤' };
  const value = formatConditionNumber(rawValue);
  return operatorLabels[operator] && value
    ? `${typeLabel}: ${operatorLabels[operator]} ${value} ${unit}`
    : `${typeLabel}: ${t('ownerRaceConditionInvalidConfiguration')}`;
}

function evaluateNumericCondition(actualValue, condition) {
  const actual = toStrictNumber(actualValue);
  const operator = getConditionOperator(condition);
  if (actual === null) return { configured: true, valid: false };

  if (operator === 'BETWEEN') {
    const min = toStrictNumber(condition?.minValue);
    const max = toStrictNumber(condition?.maxValue);
    if (min === null || max === null || min > max) {
      return { configured: false, valid: false };
    }
    return { configured: true, valid: actual >= min && actual <= max };
  }

  const expected = toStrictNumber(condition?.value);
  if (expected === null) return { configured: false, valid: false };
  switch (operator) {
    case 'EQ': return { configured: true, valid: actual === expected };
    case 'GT': return { configured: true, valid: actual > expected };
    case 'GTE': return { configured: true, valid: actual >= expected };
    case 'LT': return { configured: true, valid: actual < expected };
    case 'LTE': return { configured: true, valid: actual <= expected };
    default: return { configured: false, valid: false };
  }
}

function getHorseTournamentEligibility(horse, tournament, t, detailReady = true) {
  const reasons = [];
  const checks = [];

  const addCheck = ({ key, label, status, detail, reason = '' }) => {
    checks.push({ key, label, status, detail });
    if (status !== 'passed' && reason && !reasons.includes(reason)) reasons.push(reason);
  };

  if (!horse || !tournament || !detailReady) {
    const reason = t('ownerRaceEligibilityDetailRequired');
    addCheck({
      key: 'tournament-details',
      label: t('ownerRaceEligibilityCheckData'),
      status: 'unknown',
      detail: reason,
      reason
    });
    return { eligible: false, reasons, checks };
  }

  const active = isActiveHorse(horse);
  const activeReason = active ? '' : t('ownerRaceValidationHorseActive');
  addCheck({
    key: 'horse-status',
    label: t('ownerRaceConditionHorseActiveTitle'),
    status: active ? 'passed' : 'failed',
    detail: active
      ? t('ownerRaceEligibilityCheckStatusPassed', { status: formatDisplayLabel(horse.status || 'ACTIVE') })
      : activeReason,
    reason: activeReason
  });

  const tournamentStart = getDateTime(tournament.startDate);
  const healthExpiry = getDateTime(
    horse.healthCertificateExpiryDate
      ?? horse.healthCertExpiry
      ?? horse.healthCertificateExpiry
  );
  if (!tournamentStart) {
    const reason = t('ownerRaceEligibilityTournamentStartMissing');
    addCheck({
      key: 'health-certificate',
      label: t('ownerRaceConditionHealthTitle'),
      status: 'unknown',
      detail: reason,
      reason
    });
  } else if (!healthExpiry) {
    const reason = t('ownerRaceEligibilityHealthMissing');
    addCheck({
      key: 'health-certificate',
      label: t('ownerRaceConditionHealthTitle'),
      status: 'failed',
      detail: reason,
      reason
    });
  } else if (healthExpiry.getTime() < tournamentStart.getTime()) {
    const reason = t('ownerRaceEligibilityHealthExpired', {
      expiry: formatDate(healthExpiry),
      start: formatDate(tournamentStart)
    });
    addCheck({
      key: 'health-certificate',
      label: t('ownerRaceConditionHealthTitle'),
      status: 'failed',
      detail: reason,
      reason
    });
  } else {
    addCheck({
      key: 'health-certificate',
      label: t('ownerRaceConditionHealthTitle'),
      status: 'passed',
      detail: t('ownerRaceEligibilityCheckHealthPassed', {
        expiry: formatDate(healthExpiry),
        start: formatDate(tournamentStart)
      })
    });
  }

  const horseAge = toStrictNumber(horse.age);
  const horseWeight = toStrictNumber(horse.weight);

  const conditions = getTournamentConditions(tournament);
  if (!conditions) {
    const ageReason = horseAge === null || horseAge < 0 ? t('ownerRaceEligibilityAgeMissing') : '';
    addCheck({
      key: 'horse-age',
      label: t('ownerRaceConditionAge'),
      status: ageReason ? 'failed' : 'passed',
      detail: ageReason || t('ownerRaceEligibilityCheckProfileValue', {
        actual: `${formatConditionNumber(horseAge)} ${t('ownerRaceYears')}`
      }),
      reason: ageReason
    });

    const weightReason = horseWeight === null ? t('ownerRaceEligibilityWeightMissing') : '';
    addCheck({
      key: 'horse-weight',
      label: t('ownerRaceConditionWeight'),
      status: weightReason ? 'failed' : 'passed',
      detail: weightReason || t('ownerRaceEligibilityCheckProfileValue', {
        actual: `${formatConditionNumber(horseWeight)} kg`
      }),
      reason: weightReason
    });

    const reason = t('ownerRaceEligibilityConditionsMissing');
    addCheck({
      key: 'tournament-conditions',
      label: t('ownerRaceEligibilityCheckData'),
      status: 'unknown',
      detail: reason,
      reason
    });
    return { eligible: false, reasons, checks };
  }

  const conditionTypes = new Set(conditions.map(getConditionType));
  if (!conditionTypes.has('AGE')) {
    const reason = horseAge === null || horseAge < 0 ? t('ownerRaceEligibilityAgeMissing') : '';
    addCheck({
      key: 'horse-age',
      label: t('ownerRaceConditionAge'),
      status: reason ? 'failed' : 'passed',
      detail: reason || t('ownerRaceEligibilityCheckProfileValue', {
        actual: `${formatConditionNumber(horseAge)} ${t('ownerRaceYears')}`
      }),
      reason
    });
  }

  if (!conditionTypes.has('WEIGHT')) {
    const reason = horseWeight === null ? t('ownerRaceEligibilityWeightMissing') : '';
    addCheck({
      key: 'horse-weight',
      label: t('ownerRaceConditionWeight'),
      status: reason ? 'failed' : 'passed',
      detail: reason || t('ownerRaceEligibilityCheckProfileValue', {
        actual: `${formatConditionNumber(horseWeight)} kg`
      }),
      reason
    });
  }

  conditions.forEach((condition, index) => {
    const type = getConditionType(condition);
    const requirement = formatTournamentCondition(condition, t);
    const conditionKey = condition.conditionId ?? condition.id ?? `${type || 'unknown'}-${index}`;
    if (type === 'AGE' || type === 'WEIGHT') {
      const actual = type === 'AGE' ? horseAge : horseWeight;
      const missing = actual === null || (type === 'AGE' && actual < 0);
      const result = evaluateNumericCondition(actual, condition);
      let status = 'passed';
      let reason = '';
      if (missing) {
        status = 'failed';
        reason = t(type === 'AGE' ? 'ownerRaceEligibilityAgeMissing' : 'ownerRaceEligibilityWeightMissing');
      } else if (!result.configured) {
        status = 'unknown';
        reason = t('ownerRaceEligibilityConditionInvalid', { condition: requirement });
      } else if (!result.valid) {
        status = 'failed';
        reason = t(
          type === 'AGE' ? 'ownerRaceEligibilityAgeMismatch' : 'ownerRaceEligibilityWeightMismatch',
          { actual: formatConditionNumber(actual), condition: requirement }
        );
      }

      addCheck({
        key: `condition-${conditionKey}`,
        label: type === 'AGE' ? t('ownerRaceConditionAge') : t('ownerRaceConditionWeight'),
        status,
        detail: reason || t('ownerRaceEligibilityCheckComparison', {
          actual: `${formatConditionNumber(actual)} ${type === 'AGE' ? t('ownerRaceYears') : 'kg'}`,
          requirement
        }),
        reason
      });
      return;
    }

    if (type === 'GENDER') {
      const operator = getConditionOperator(condition);
      const expected = String(condition?.value || '').trim().toUpperCase();
      const actual = String(horse.sex || '').trim().toUpperCase();
      let status = 'passed';
      let reason = '';
      if (operator !== 'EQ' || !expected) {
        status = 'unknown';
        reason = t('ownerRaceEligibilityConditionInvalid', { condition: requirement });
      } else if (expected !== 'ANY' && !actual) {
        status = 'failed';
        reason = t('ownerRaceEligibilityGenderMissing');
      } else if (expected !== 'ANY' && actual !== expected) {
        status = 'failed';
        reason = t('ownerRaceEligibilityGenderMismatch', {
          actual: formatDisplayLabel(horse.sex),
          expected: formatDisplayLabel(condition.value)
        });
      }

      addCheck({
        key: `condition-${conditionKey}`,
        label: t('ownerRaceConditionGender'),
        status,
        detail: reason || t('ownerRaceEligibilityCheckComparison', {
          actual: formatDisplayLabel(horse.sex, t('notUpdated')),
          requirement
        }),
        reason
      });
      return;
    }

    const reason = t('ownerRaceEligibilityUnsupportedCondition', { type: type || t('notUpdated') });
    addCheck({
      key: `condition-${conditionKey}`,
      label: t('ownerRaceConditionUnknown'),
      status: 'unknown',
      detail: reason,
      reason
    });
  });

  return {
    eligible: checks.every((check) => check.status === 'passed'),
    reasons,
    checks
  };
}

function validateInvitationForm(formValues, horses, selectedTournament, detailReady, invitations = [], horseLockReasons = {}, t) {
  const errors = {};
  const selectedHorse = horses.find((horse) => String(getHorseId(horse)) === String(formValues.horseId));
  const expiredAt = formValues.expiredAt ? getInvitationExpiryDate(formValues.expiredAt) : null;

  if (!formValues.tournamentId) {
    errors.tournamentId = t?.('ownerRaceValidationTournamentRequired') || 'Vui lòng chọn giải đấu.';
  } else if (!selectedTournament || String(getTournamentId(selectedTournament)) !== String(formValues.tournamentId)) {
    errors.tournamentId = t?.('ownerRaceValidationTournamentUnavailable') || 'Giải đấu đã chọn không nằm trong danh sách đang mở đăng ký.';
  } else if (!isAvailableTournament(selectedTournament)) {
    errors.tournamentId = t?.('ownerRaceValidationTournamentClosed') || 'Giải đấu không còn mở đăng ký hoặc đã quá hạn đăng ký.';
  }

  if (!errors.tournamentId && !detailReady) {
    errors.tournamentId = t?.('ownerRaceEligibilityDetailRequired');
  }

  if (!formValues.horseId) {
    errors.horseId = t?.('ownerRaceValidationHorseRequired') || 'Vui lòng chọn ngựa.';
  } else if (!selectedHorse) {
    errors.horseId = t?.('ownerRaceValidationHorseUnavailable') || 'Ngựa đã chọn không nằm trong danh sách ngựa ACTIVE của bạn.';
  } else if (!isActiveHorse(selectedHorse)) {
    errors.horseId = t?.('ownerRaceValidationHorseActive') || 'Chỉ có thể chọn ngựa ở trạng thái ACTIVE.';
  }

  if (selectedHorse && !errors.horseId) {
    const eligibility = getHorseTournamentEligibility(selectedHorse, selectedTournament, t, detailReady);
    if (!eligibility.eligible) errors.horseId = eligibility.reasons.join(' ');
  }

  if (selectedHorse && !errors.horseId) {
    const lockReason = getHorseTournamentLockReason(selectedHorse, selectedTournament, invitations, horseLockReasons, t);
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

export default function OwnerRegisterRace({ horses, onBackToHorses, onViewTransactions }) {
  const { language, t } = useLanguage();
  const [wizardStep, setWizardStep] = useState(1);
  const [flowMode, setFlowMode] = useState(null);
  const [formValues, setFormValues] = useState(emptyInvitationForm());
  const [registrationValues, setRegistrationValues] = useState(emptyRegistrationForm());
  const [formErrors, setFormErrors] = useState({});
  const [registrationErrors, setRegistrationErrors] = useState({});
  const [tournaments, setTournaments] = useState([]);
  const [openTournaments, setOpenTournaments] = useState([]);
  const [tournamentDetailsById, setTournamentDetailsById] = useState({});
  const [tournamentDetailLoadingById, setTournamentDetailLoadingById] = useState({});
  const [tournamentDetailErrorsById, setTournamentDetailErrorsById] = useState({});
  const [ownerHorses, setOwnerHorses] = useState([]);
  const [jockeys, setJockeys] = useState([]);
  const [invitations, setInvitations] = useState([]);
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
  const [detailRace, setDetailRace] = useState(null);
  const [previewTournamentImage, setPreviewTournamentImage] = useState(null);
  const [detailInvitation, setDetailInvitation] = useState(null);
  const [cancelInvitationTarget, setCancelInvitationTarget] = useState(null);
  const [horseLockReasons, setHorseLockReasons] = useState({});
  const [tournamentSearch, setTournamentSearch] = useState('');
  const [expandedTournamentId, setExpandedTournamentId] = useState('');
  const [expandedEligibilityHorseId, setExpandedEligibilityHorseId] = useState('');
  const [selectedWorkflowInvitationId, setSelectedWorkflowInvitationId] = useState('');
  const [workflowClock, setWorkflowClock] = useState(() => Date.now());
  const paymentReturnHandledRef = useRef(false);
  const tournamentDetailsRef = useRef({});
  const tournamentDetailRequestsRef = useRef(new Map());

  const ownerHorseList = useMemo(
    () => (ownerHorses.length > 0 ? ownerHorses : horses),
    [horses, ownerHorses]
  );
  const activeHorses = useMemo(() => ownerHorseList.filter(isActiveHorse), [ownerHorseList]);
  const displayTournaments = useMemo(() => {
    const byId = new Map();
    [...openTournaments, ...tournaments.filter(isAvailableTournament)].forEach((tournament) => {
      const tournamentId = getTournamentId(tournament);
      if (tournamentId) byId.set(String(tournamentId), tournament);
    });
    return [...byId.values()];
  }, [openTournaments, tournaments]);
  const filteredDisplayTournaments = useMemo(() => {
    const keyword = tournamentSearch.trim().toLowerCase();
    if (!keyword) return displayTournaments;

    return displayTournaments.filter((tournament) => [
      getTournamentName(tournament),
      getTournamentVenue(tournament, t),
      tournament.description,
      tournament.status
    ].filter(Boolean).join(' ').toLowerCase().includes(keyword));
  }, [displayTournaments, t, tournamentSearch]);
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
  const selectedTournament = useMemo(() => {
    const tournamentId = String(formValues.tournamentId);
    const summary = tournamentById.get(tournamentId) || null;
    const detail = tournamentDetailsById[tournamentId] || null;
    if (!summary) return detail;
    return detail ? { ...summary, ...detail } : summary;
  }, [formValues.tournamentId, tournamentById, tournamentDetailsById]);
  const selectedTournamentId = String(formValues.tournamentId || '');
  const selectedTournamentDetailError = tournamentDetailErrorsById[selectedTournamentId] || '';
  const isSelectedTournamentDetailLoading = Boolean(tournamentDetailLoadingById[selectedTournamentId]);
  const isSelectedTournamentDetailReady = Boolean(
    selectedTournamentId
      && tournamentDetailsById[selectedTournamentId]
      && !selectedTournamentDetailError
      && !isSelectedTournamentDetailLoading
  );
  const selectedHorse = useMemo(
    () => ownerHorseList.find((horse) => String(getHorseId(horse)) === String(formValues.horseId)) || null,
    [formValues.horseId, ownerHorseList]
  );
  const selectedHorseEligibility = useMemo(
    () => getHorseTournamentEligibility(
      selectedHorse,
      selectedTournament,
      t,
      isSelectedTournamentDetailReady
    ),
    [isSelectedTournamentDetailReady, selectedHorse, selectedTournament, t]
  );
  const selectedHorseInlineReasons = (() => {
    if (!selectedHorse) return [];

    const lockReason = selectedTournament
      ? getHorseTournamentLockReason(selectedHorse, selectedTournament, invitations, horseLockReasons, t)
      : '';

    return [...new Set([
      ...selectedHorseEligibility.reasons,
      ...(lockReason ? [lockReason] : [])
    ].map((reason) => String(reason).trim()).filter(Boolean))];
  })();
  const horseStepError = formErrors.horseId
    || registrationErrors.horseId
    || selectedHorseInlineReasons.join(' ');
  const selectedRace = useMemo(() => getPrimaryRace(selectedTournament), [selectedTournament]);
  const selectedHorseStats = useMemo(() => getHorseStats(selectedHorse), [selectedHorse]);
  const invitationsForSelection = useMemo(() => {
    if (!formValues.tournamentId || !formValues.horseId) return [];
    return invitations.filter((invitation) => (
      String(getInvitationTournamentId(invitation)) === String(formValues.tournamentId)
      && String(getInvitationHorseId(invitation)) === String(formValues.horseId)
    ));
  }, [formValues.horseId, formValues.tournamentId, invitations, workflowClock]);
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
    () => acceptedJockeyInvitations.find((invitation) => (
      selectedWorkflowInvitationId
      && String(getInvitationId(invitation)) === String(selectedWorkflowInvitationId)
    )) || acceptedJockeyInvitations.find((invitation) => String(getInvitationJockeyId(invitation)) === String(registrationValues.jockeyId)) || null,
    [acceptedJockeyInvitations, registrationValues.jockeyId, selectedWorkflowInvitationId]
  );
  const currentPendingInvitation = useMemo(() => {
    if (!formValues.tournamentId || !formValues.horseId) return null;
    return invitations.find((invitation) => (
      getEffectiveInvitationStatus(invitation) === 'PENDING'
      && String(getInvitationTournamentId(invitation)) === String(formValues.tournamentId)
      && String(getInvitationHorseId(invitation)) === String(formValues.horseId)
    )) || null;
  }, [formValues.horseId, formValues.tournamentId, invitations]);
  const responseDeadlineMin = useMemo(() => getDateLocalMinValue(), []);
  const responseDeadlineMax = useMemo(
    () => getRegistrationDeadline(selectedTournament) ? toDateLocalValue(getRegistrationDeadline(selectedTournament)) : '',
    [selectedTournament]
  );
  const workflowByTournamentId = useMemo(() => {
    const byTournament = new Map();
    invitations.forEach((invitation) => {
      const tournamentId = String(getInvitationTournamentId(invitation) || '');
      if (!tournamentId) return;
      const current = byTournament.get(tournamentId);
      if (!current || isNewerTournamentWorkflow(invitation, current)) {
        byTournament.set(tournamentId, invitation);
      }
    });
    return byTournament;
  }, [invitations, workflowClock]);
  const inviteReady = Boolean(
    formValues.tournamentId
      && formValues.horseId
      && isSelectedTournamentDetailReady
      && selectedHorseEligibility.eligible
  );
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
  const selectedRegistrationWorkflow = getTournamentWorkflowState(selectedAcceptedInvitation ? {
    ...selectedAcceptedInvitation,
    paymentStatus: selectedPaymentStatus || getInvitationPaymentStatus(selectedAcceptedInvitation),
    approvalStatus: selectedApprovalStatus || getInvitationApprovalStatus(selectedAcceptedInvitation)
  } : null, t);
  const isReadOnlyRegistrationState = [
    'PAYMENT_FAILED_CANCELLED',
    'REGISTRATION_REJECTED',
    'REGISTRATION_CANCELLED',
    'PAYMENT_REFUNDED',
    'UNKNOWN'
  ].includes(selectedRegistrationWorkflow.kind);
  const showPaymentResult = isPaymentFlowActive && Boolean(
    paymentResult || (isRegistrationPaid && !isReadOnlyRegistrationState)
  );
  const showReadOnlyRegistration = isPaymentFlowActive
    && !showPaymentResult
    && Boolean(selectedAcceptedInvitation && hasRegistrationStatus(selectedAcceptedInvitation))
    && !canStartInvitationPayment(selectedAcceptedInvitation);
  const selectedRegistrationCode = firstDefined(
    registrationResult?.registrationNo,
    selectedAcceptedInvitation?.registrationNo,
    paymentResult?.registrationId ? `#${paymentResult.registrationId}` : '',
    selectedAcceptedInvitation?.registrationId ? `#${selectedAcceptedInvitation.registrationId}` : ''
  );
  const selectedInvitationStatus = selectedAcceptedInvitation?.status || '';
  const selectedRegistrationState = {
    title: selectedRegistrationWorkflow.label,
    description: selectedRegistrationWorkflow.description
  };
  const canSubmitRegistration = Boolean(
    registrationValues.tournamentId
      && registrationValues.horseId
      && registrationValues.jockeyId
      && isSelectedTournamentDetailReady
      && selectedHorseEligibility.eligible
  );
  const activeStep = wizardStep;
  const nextStepLabel = wizardStep === 2
    ? (isSaving ? t('ownerRaceSending') : t('ownerRaceWaitForJockey'))
    : t('next');

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => setWorkflowClock(Date.now()), 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (isLoading || isInviteFlowActive || isPaymentFlowActive) return;
    displayTournaments
      .map((tournament) => String(getTournamentId(tournament) || ''))
      .filter(Boolean)
      .forEach((tournamentId) => {
        loadTournamentDetail(tournamentId);
      });
  }, [displayTournaments, isInviteFlowActive, isLoading, isPaymentFlowActive]);

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
        const pageData = await loadPageData();
        const paidInvitation = findInvitationByRegistrationId(pageData?.invitations || [], result?.registrationId);
        if (paidInvitation) {
          await restoreRegistrationSelectionFromInvitation(paidInvitation, { preserveFeedback: true });
          setRegistrationResult((current) => ({
            ...(current || {}),
            registrationId: result?.registrationId,
            registrationNo: paidInvitation.registrationNo || current?.registrationNo,
            paymentStatus: getInvitationPaymentStatus(paidInvitation) || result?.registrationPaymentStatus || current?.paymentStatus,
            approvalStatus: getInvitationApprovalStatus(paidInvitation) || result?.registrationApprovalStatus || current?.approvalStatus
          }));
        }
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

  async function loadTournamentDetail(tournamentId, { force = false } = {}) {
    const key = String(tournamentId || '');
    if (!key) return null;
    if (!force && tournamentDetailsRef.current[key]) return tournamentDetailsRef.current[key];
    if (tournamentDetailRequestsRef.current.has(key)) {
      return tournamentDetailRequestsRef.current.get(key);
    }

    setTournamentDetailLoadingById((current) => ({ ...current, [key]: true }));
    setTournamentDetailErrorsById((current) => ({ ...current, [key]: '' }));

    const request = getOwnerTournamentDetail(key)
      .then((detail) => {
        if (!detail || String(getTournamentId(detail)) !== key) {
          throw new Error(t('ownerRaceTournamentDetailInvalid'));
        }
        tournamentDetailsRef.current = { ...tournamentDetailsRef.current, [key]: detail };
        setTournamentDetailsById((current) => ({ ...current, [key]: detail }));
        return detail;
      })
      .catch((error) => {
        const errorText = getErrorText(error, t('ownerRaceTournamentDetailLoadError'));
        setTournamentDetailErrorsById((current) => ({ ...current, [key]: errorText }));
        return null;
      })
      .finally(() => {
        tournamentDetailRequestsRef.current.delete(key);
        setTournamentDetailLoadingById((current) => ({ ...current, [key]: false }));
      });

    tournamentDetailRequestsRef.current.set(key, request);
    return request;
  }

  async function loadPageData() {
    setIsLoading(true);
    setLoadError('');

    try {
      try {
        window.localStorage.removeItem(LEGACY_OWNER_CANCELLED_INVITATION_STORAGE_KEY);
      } catch {
        // Server invitation status is authoritative even when storage is unavailable.
      }

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
      const normalizedInvitations = Array.isArray(invitationData) ? invitationData : [];
      setInvitations(normalizedInvitations);
      return {
        tournaments: Array.isArray(tournamentData) ? tournamentData : [],
        openTournaments: Array.isArray(openTournamentData) ? openTournamentData : [],
        ownerHorses: Array.isArray(ownerHorseData) ? ownerHorseData : [],
        jockeys: (Array.isArray(userData) ? userData : []).filter((user) => getUserRole(user) === 'JOCKEY' && String(user.status || '').toUpperCase() === 'ACTIVE'),
        invitations: normalizedInvitations
      };
    } catch (err) {
      setLoadError(getErrorText(err, t('ownerRaceLoadError')));
      return null;
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

  function toggleTournamentExpansion(event, tournamentId, expanded) {
    event.preventDefault();
    event.stopPropagation();
    setExpandedTournamentId(expanded ? '' : tournamentId);
  }

  function openTournamentImagePreview(event, tournament, imageUrl) {
    event.preventDefault();
    event.stopPropagation();
    if (!imageUrl) {
      toggleTournamentExpansion(event, String(getTournamentId(tournament)), expandedTournamentId === String(getTournamentId(tournament)));
      return;
    }
    setPreviewTournamentImage({
      src: imageUrl,
      title: getTournamentName(tournament) || t('ownerRaceTournamentLabel'),
      venue: getTournamentVenue(tournament, t)
    });
  }

  function openRaceImagePreview(event, race, tournament, imageUrl) {
    event.preventDefault();
    event.stopPropagation();
    if (!imageUrl) return;
    setPreviewTournamentImage({
      src: imageUrl,
      title: getRaceName(race, tournament, t),
      venue: getRaceTrack(race, tournament, t)
    });
  }

  function openRaceDetail(event, race, tournament, raceOrder) {
    event.preventDefault();
    event.stopPropagation();
    setDetailRace({ race, tournament, raceOrder });
  }

  async function goNextStep() {
    resetFeedback();

    if (wizardStep === 1) {
      if (!formValues.tournamentId || !selectedTournament) {
        setFormErrors((current) => ({ ...current, tournamentId: t('ownerRaceValidationTournamentRequired') }));
        return;
      }
      const detail = await loadTournamentDetail(formValues.tournamentId);
      if (!detail) {
        setFormErrors((current) => ({ ...current, tournamentId: t('ownerRaceEligibilityDetailRequired') }));
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
      const eligibility = getHorseTournamentEligibility(
        selectedHorse,
        selectedTournament,
        t,
        isSelectedTournamentDetailReady
      );
      if (!eligibility.eligible) {
        setFormErrors((current) => ({ ...current, horseId: eligibility.reasons.join(' ') }));
        return;
      }
      const lockReason = getHorseTournamentLockReason(selectedHorse, selectedTournament, invitations, horseLockReasons, t);
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

  async function selectTournament(tournament) {
    const tournamentId = String(getTournamentId(tournament));
    setSelectedWorkflowInvitationId('');
    setFlowMode('invite');
    setWizardStep(2);
    setExpandedEligibilityHorseId('');
    setFormValues((current) => ({ ...current, tournamentId, horseId: '', jockeyId: '' }));
    setRegistrationValues((current) => ({ ...current, tournamentId, horseId: '', jockeyId: '' }));
    setFormErrors((current) => ({ ...current, tournamentId: '', horseId: '' }));
    setRegistrationErrors((current) => ({ ...current, tournamentId: '', horseId: '' }));
    resetFeedback();
    await loadTournamentDetail(tournamentId);
  }

  function selectHorse(horse) {
    const horseId = String(getHorseId(horse));
    if (!isSelectedTournamentDetailReady) {
      setFormErrors((current) => ({ ...current, horseId: t('ownerRaceEligibilityDetailRequired') }));
      return;
    }
    const eligibility = getHorseTournamentEligibility(horse, selectedTournament, t, true);
    if (!eligibility.eligible) {
      const reason = eligibility.reasons.join(' ');
      setFormErrors((current) => ({ ...current, horseId: reason }));
      setRegistrationErrors((current) => ({ ...current, horseId: reason }));
      return;
    }
    const lockReason = getHorseTournamentLockReason(horse, selectedTournament, invitations, horseLockReasons, t);
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
    setSelectedWorkflowInvitationId('');
    setFormValues(emptyInvitationForm());
    setRegistrationValues(emptyRegistrationForm());
    setFormErrors({});
    setRegistrationErrors({});
    setDetailJockey(null);
    setDetailHorse(null);
    setDetailInvitation(null);
    setWizardStep(1);
    resetFeedback();
  }

  async function restoreRegistrationSelectionFromInvitation(invitation, { preserveFeedback = false } = {}) {
    const tournamentId = String(getInvitationTournamentId(invitation));
    if (!tournamentId) return;

    setSelectedWorkflowInvitationId(String(getInvitationId(invitation) || ''));
    setFlowMode('payment');
    setFormValues((current) => ({
      ...current,
      tournamentId,
      horseId: String(getInvitationHorseId(invitation))
    }));
    setRegistrationValues({
      tournamentId,
      horseId: String(getInvitationHorseId(invitation)),
      jockeyId: String(getInvitationJockeyId(invitation))
    });
    setWizardStep(4);
    setRegistrationErrors({});
    if (!preserveFeedback) resetFeedback();
    await loadTournamentDetail(tournamentId);
  }

  async function fillRegistrationFromInvitation(invitation) {
    await restoreRegistrationSelectionFromInvitation(invitation);
  }

  async function restoreInvitationSelectionFromInvitation(invitation, { restart = false } = {}) {
    const tournamentId = String(getInvitationTournamentId(invitation) || '');
    const horseId = String(getInvitationHorseId(invitation) || '');
    if (!tournamentId) return;

    setSelectedWorkflowInvitationId(restart ? '' : String(getInvitationId(invitation) || ''));
    setFlowMode('invite');
    setWizardStep(2);
    setExpandedEligibilityHorseId('');
    setFormValues({
      tournamentId,
      horseId: restart ? '' : horseId,
      jockeyId: restart ? '' : String(getInvitationJockeyId(invitation) || ''),
      expiredAt: '',
      message: ''
    });
    setRegistrationValues({
      tournamentId,
      horseId: restart ? '' : horseId,
      jockeyId: ''
    });
    setFormErrors({});
    setRegistrationErrors({});
    resetFeedback();
    await loadTournamentDetail(tournamentId);
  }

  async function handleTournamentWorkflowAction(invitation, workflow) {
    if (!invitation || !workflow) return;

    if (workflow.actionType === 'restart-invitation') {
      await restoreInvitationSelectionFromInvitation(invitation, { restart: true });
      return;
    }
    if (workflow.actionType === 'view-invitation') {
      setDetailInvitation(invitation);
      return;
    }
    if (workflow.actionType === 'transactions') {
      if (onViewTransactions) {
        onViewTransactions();
        return;
      }
      await fillRegistrationFromInvitation(invitation);
      return;
    }
    if (workflow.actionType === 'payment' || workflow.actionType === 'registration-details') {
      await fillRegistrationFromInvitation(invitation);
      return;
    }

    if (workflow.actionType === 'workflow-details') {
      setDetailInvitation(invitation);
      return;
    }

    if (hasRegistrationStatus(invitation) || isAcceptedInvitation(invitation)) {
      await fillRegistrationFromInvitation(invitation);
      return;
    }
    setDetailInvitation(invitation);
  }

  function validateRegistrationForm(tournamentDetail = selectedTournament, detailReady = isSelectedTournamentDetailReady) {
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
    } else {
      const eligibility = getHorseTournamentEligibility(selectedRegistrationHorse, tournamentDetail, t, detailReady);
      if (!eligibility.eligible) errors.horseId = eligibility.reasons.join(' ');
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
    setSubmitError('');
    setMessage('');
    setIsSaving(true);
    setInvitingJockeyId(String(nextValues.jockeyId));
    try {
      const latestTournament = await loadTournamentDetail(nextValues.tournamentId, { force: true });
      const errors = validateInvitationForm(
        nextValues,
        activeHorses,
        latestTournament || selectedTournament,
        Boolean(latestTournament),
        invitations,
        horseLockReasons,
        t
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) return null;

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
      if (isJockeyAvailabilityError(errorText)) {
        setFormValues((current) => ({ ...current, jockeyId: '' }));
        setFormErrors((current) => ({ ...current, jockeyId: errorText, horseId: '' }));
      } else if (isOverlappingHorseError(errorText) && nextValues.horseId && nextValues.tournamentId) {
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

  async function handleStartRegistrationPayment(event) {
    event.preventDefault();
    if (isRegistering) return;
    if (isPaidStatus(getInvitationPaymentStatus(selectedAcceptedInvitation))) {
      setRegistrationSubmitError('');
      setMessage(t('ownerRaceAlreadyPaidNotice'));
      return;
    }
    if (!canStartInvitationPayment(selectedAcceptedInvitation)) {
      setRegistrationSubmitError(getTournamentWorkflowState(selectedAcceptedInvitation, t).description);
      return;
    }
    setRegistrationSubmitError('');
    setRegistrationResult(null);
    setMessage('');
    setIsRegistering(true);
    try {
      const latestTournament = await loadTournamentDetail(registrationValues.tournamentId, { force: true });
      const errors = validateRegistrationForm(latestTournament || selectedTournament, Boolean(latestTournament));
      setRegistrationErrors(errors);
      if (Object.keys(errors).length > 0) return;

      const registrationId = selectedAcceptedInvitation?.registrationId;
      if (!registrationId) {
        setRegistrationSubmitError(t('ownerRaceAcceptedInviteRequired'));
        return;
      }
      const response = await startOwnerRegistrationPayment(registrationId);
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
          {selectedTournament && !showPaymentResult && (
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
                {isSelectedTournamentDetailLoading && (
                  <div className="admin-alert warning modal-alert" role="status">
                    {t('ownerRaceTournamentDetailLoading')}
                  </div>
                )}
                {selectedTournamentDetailError && (
                  <div className="tournament-detail-load-error" role="alert">
                    <span>{selectedTournamentDetailError}</span>
                    <button className="outline-button compact-button" type="button" onClick={() => loadTournamentDetail(selectedTournamentId, { force: true })}>
                      <RefreshCw size={15} /> {t('ownerRaceRetryDetail')}
                    </button>
                  </div>
                )}
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
              <div className="owner-tournament-workspace-list">
                <div className="owner-tournament-workspace-toolbar">
                  <label className="owner-tournament-search">
                    <Search size={17} />
                    <input
                      value={tournamentSearch}
                      onChange={(event) => setTournamentSearch(event.target.value)}
                      placeholder={t('ownerRaceSearchTournament')}
                    />
                    {tournamentSearch && (
                      <button type="button" onClick={() => setTournamentSearch('')} aria-label={t('eventCommonClear')}>
                        <X size={14} />
                      </button>
                    )}
                  </label>
                  <button className="outline-button owner-tournament-refresh" type="button" onClick={loadPageData} disabled={isLoading}>
                    <RefreshCw size={16} /> {t('refresh')}
                  </button>
                  <span className="owner-count-pill">{t('ownerRaceRows', { count: `${filteredDisplayTournaments.length} / ${displayTournaments.length}` })}</span>
                </div>

                {filteredDisplayTournaments.length === 0 ? (
                  <div className="owner-empty-state compact-empty">
                    <div><Search size={34} /></div>
                    <h3>{t('ownerRaceNoTournamentMatch')}</h3>
                    <p>{t('ownerRaceNoTournamentMatchDesc')}</p>
                  </div>
                ) : filteredDisplayTournaments.map((tournament) => {
                  const tournamentId = String(getTournamentId(tournament));
                  const tournamentDetail = tournamentDetailsById[tournamentId];
                  const tournamentForCard = tournamentDetail ? { ...tournament, ...tournamentDetail } : tournament;
                  const tournamentRaces = getTournamentRaces(tournamentForCard);
                  const tournamentWorkflowInvitation = workflowByTournamentId.get(tournamentId) || null;
                  const tournamentWorkflow = getTournamentWorkflowState(tournamentWorkflowInvitation, t);
                  const hasTournamentWorkflow = Boolean(tournamentWorkflowInvitation);
                  const selected = String(formValues.tournamentId) === tournamentId;
                  const imageUrl = getTournamentImageUrl(tournamentForCard);
                  const maxRegistrations = Number(tournament.maxRegistrations || tournament.maxRegistration || 0);
                  const approvedCount = Number(tournament.approvedRegistrationCount || tournament.registrationCount || 0);
                  const canSelectTournament = isAvailableTournament(tournament);
                  const expanded = expandedTournamentId === tournamentId;
                  const tournamentConditions = getTournamentConditions(tournamentForCard) || [];

                  return (
                    <article className={`owner-tournament-workspace-row ${expanded ? 'expanded' : ''} ${selected ? 'selected' : ''}`} key={tournamentId}>
                      <div className="owner-tournament-workspace-summary">
                        <button
                          type="button"
                          className="owner-tournament-expand-button"
                          onClick={(event) => toggleTournamentExpansion(event, tournamentId, expanded)}
                          aria-expanded={expanded}
                          aria-label={expanded ? t('eventCommonClose') : t('ownerRaceViewDetails')}
                        >
                          {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                        </button>

                        <button
                          type="button"
                          className="owner-tournament-workspace-image"
                          onClick={(event) => openTournamentImagePreview(event, tournamentForCard, imageUrl)}
                          aria-label={imageUrl ? t('eventWizardImagePreviewAlt') : t('ownerRaceViewDetails')}
                        >
                          {imageUrl ? <img src={imageUrl} alt={getTournamentName(tournament)} /> : <Flag size={24} />}
                        </button>

                        <div className="owner-tournament-workspace-title">
                          <span>{t('ownerRaceTournamentLabel')} #{tournamentId}</span>
                          <h3>{getTournamentName(tournament) || `${t('ownerRaceTournamentLabel')} ${tournamentId}`}</h3>
                          <p><MapPin size={14} /> {getTournamentVenue(tournament, t)}</p>
                        </div>

                        <div className="owner-tournament-workspace-metrics">
                          <span>{t('ownerRaceDateRange')} <strong>{formatDateRange(tournament.startDate, tournament.endDate, t)}</strong></span>
                          <span>{t('ownerRaceEntryFee')} <strong>{formatCurrency(tournament.entryFee)}</strong></span>
                          <span>{t('ownerRaceCapacity')} <strong>{maxRegistrations ? `${approvedCount} / ${t('ownerRaceSlots', { count: maxRegistrations })}` : t('ownerRaceApplications', { count: approvedCount })}</strong></span>
                        </div>

                        <div className="owner-tournament-workspace-status">
                          <StatusBadge status={tournament.status || (canSelectTournament ? 'OPEN_FOR_REGISTRATION' : 'REGISTRATION_CLOSED')} />
                          <span className={`owner-tournament-workflow-status tone-${tournamentWorkflow.tone}`}>
                            {tournamentWorkflow.label}
                          </span>
                        </div>

                        <div className="owner-tournament-workspace-actions">
                          <button
                            type="button"
                            className="primary-button compact-primary tournament-workflow-primary"
                            onClick={() => {
                              if (hasTournamentWorkflow) {
                                setExpandedTournamentId(tournamentId);
                                loadTournamentDetail(tournamentId);
                                return;
                              }
                              selectTournament(tournament);
                            }}
                            disabled={!hasTournamentWorkflow && !canSelectTournament}
                          >
                            {hasTournamentWorkflow ? <Eye size={15} /> : <ArrowRight size={15} />}
                            {hasTournamentWorkflow
                              ? t('ownerRaceWorkflowViewProgress')
                              : selected
                                ? t('ownerRaceSelected')
                                : canSelectTournament
                                  ? t('ownerRaceSelectTournament')
                                  : t('ownerRaceNotOpen')}
                          </button>
                          {hasTournamentWorkflow && tournamentWorkflow.actionLabel && (
                            <button
                              type="button"
                              className={`outline-button tournament-workflow-button tone-${tournamentWorkflow.tone}`}
                              onClick={() => handleTournamentWorkflowAction(tournamentWorkflowInvitation, tournamentWorkflow)}
                            >
                              {['payment', 'transactions'].includes(tournamentWorkflow.actionType)
                                ? <CircleDollarSign size={15} />
                                : tournamentWorkflow.actionType === 'restart-invitation'
                                  ? <Send size={15} />
                                  : <Eye size={15} />}
                              {tournamentWorkflow.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>

                      {expanded && (
                        <div className="owner-tournament-workspace-detail">
                          <div className="owner-tournament-workspace-detail-grid">
                            <span><Clock size={15} /> {t('ownerRaceRegistrationOpen')} <strong>{formatDateTime(getRegistrationOpenAt(tournamentForCard), t, language)}</strong></span>
                            <span><Clock size={15} /> {t('ownerRaceRegistrationClose')} <strong>{formatDateTime(getRegistrationDeadline(tournamentForCard), t, language)}</strong></span>
                            <span><Trophy size={15} /> {t('ownerRaceProgram')} <strong>{t('ownerRaceRaceTotal', { count: tournamentRaces.length || (tournament.raceCount ?? 0) })}</strong></span>
                            <span><CheckCircle2 size={15} /> {t('ownerRaceApprovedRegistrations')} <strong>{approvedCount}</strong></span>
                          </div>

                          {hasTournamentWorkflow && (
                            <div className={`owner-tournament-workflow-detail tone-${tournamentWorkflow.tone}`}>
                              <div className="owner-tournament-workflow-detail-head">
                                <div>
                                  <p className="eyebrow">{t('ownerRaceWorkflowProgressTitle')}</p>
                                  <h4>{tournamentWorkflow.label}</h4>
                                  <small>{tournamentWorkflow.description}</small>
                                </div>
                                <span className={`owner-tournament-workflow-status tone-${tournamentWorkflow.tone}`}>
                                  {tournamentWorkflow.label}
                                </span>
                              </div>
                              <div className="owner-tournament-workflow-detail-grid">
                                <span>{t('ownerRaceHorseLabel')} <strong>{tournamentWorkflowInvitation.horseName || `#${getInvitationHorseId(tournamentWorkflowInvitation) || 'N/A'}`}</strong></span>
                                <span>Jockey <strong>{getInvitationJockeyName(tournamentWorkflowInvitation)}</strong></span>
                                <span>{t('ownerRaceInvitationStatusLabel')} <StatusBadge status={getEffectiveInvitationStatus(tournamentWorkflowInvitation) || 'UNKNOWN'} /></span>
                                {tournamentWorkflowInvitation.registrationNo && (
                                  <span>{t('ownerRaceRegistrationNoLabel')} <strong>{tournamentWorkflowInvitation.registrationNo}</strong></span>
                                )}
                                {getInvitationApprovalStatus(tournamentWorkflowInvitation) && (
                                  <span>{t('ownerRaceApprovalStatusLabel')} <StatusBadge status={getInvitationApprovalStatus(tournamentWorkflowInvitation)} /></span>
                                )}
                                {getInvitationPaymentStatus(tournamentWorkflowInvitation) && (
                                  <span>{t('ownerRacePaymentStatusLabel')} <StatusBadge status={getInvitationPaymentStatus(tournamentWorkflowInvitation)} /></span>
                                )}
                                {tournamentWorkflowInvitation.expiredAt && (
                                  <span>{t('ownerRaceWorkflowInvitationDeadline')} <strong>{formatDateTime(tournamentWorkflowInvitation.expiredAt, t, language)}</strong></span>
                                )}
                              </div>
                              {tournamentWorkflowInvitation.rejectionReason && (
                                <div className="owner-tournament-workflow-reason">
                                  <strong>{t('ownerRaceWorkflowRejectionReason')}</strong>
                                  <p>{tournamentWorkflowInvitation.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="owner-tournament-workspace-condition-panel">
                            <div className="owner-tournament-registration-race-preview-head">
                              <span><ShieldCheck size={14} /> {t('ownerRaceParticipationConditions')}</span>
                              <strong>{t('ownerRaceConditionCount', { count: tournamentConditions.length })}</strong>
                            </div>
                            {tournamentConditions.length === 0 ? (
                              <p className="owner-tournament-registration-race-empty">{t('ownerRaceNoExtraConditions')}</p>
                            ) : (
                              <div className="owner-tournament-workspace-condition-list">
                                {tournamentConditions.map((condition, index) => (
                                  <span key={condition.conditionId ?? condition.id ?? `${getConditionType(condition)}-${index}`}>
                                    <Flag size={13} /> {formatTournamentCondition(condition, t)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="owner-tournament-workspace-race-panel" aria-label={t('ownerRaceProgram')}>
                            <div className="owner-tournament-registration-race-preview-head">
                              <span><Trophy size={14} /> {t('ownerRaceProgram')}</span>
                              <strong>{t('ownerRaceRaceTotal', { count: tournamentRaces.length || (tournament.raceCount ?? 0) })}</strong>
                            </div>
                            {tournamentDetailLoadingById[tournamentId] && !tournamentDetail ? (
                              <p className="owner-tournament-registration-race-empty">{t('ownerRaceTournamentDetailLoading')}</p>
                            ) : tournamentDetailErrorsById[tournamentId] ? (
                              <button className="owner-tournament-registration-race-retry" type="button" onClick={() => loadTournamentDetail(tournamentId, { force: true })}>
                                <RefreshCw size={14} /> {t('ownerRaceRetryDetail')}
                              </button>
                            ) : tournamentRaces.length === 0 ? (
                              <p className="owner-tournament-registration-race-empty">{t('ownerRaceNoRaceConfigured')}</p>
                            ) : (
                              <div className="owner-tournament-workspace-race-list">
                                {tournamentRaces.map((race, index) => {
                                  const raceImageUrl = getRaceImageUrl(race);

                                  return (
                                    <div
                                      key={race.raceId ?? race.id ?? index}
                                      role="button"
                                      tabIndex={0}
                                      className="owner-tournament-workspace-race-card"
                                      onClick={(event) => openRaceDetail(event, race, tournamentForCard, race.raceOrder ?? index + 1)}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                          openRaceDetail(event, race, tournamentForCard, race.raceOrder ?? index + 1);
                                        }
                                      }}
                                      aria-label={`${t('ownerRaceViewDetails')}: ${getRaceName(race, tournamentForCard, t)}`}
                                    >
                                      <button
                                        type="button"
                                        className={`owner-tournament-workspace-race-image ${raceImageUrl ? 'has-image' : ''}`}
                                        onClick={(event) => openRaceImagePreview(event, race, tournamentForCard, raceImageUrl)}
                                        disabled={!raceImageUrl}
                                        aria-label={raceImageUrl ? t('eventWizardRaceTrackImagePreviewAlt') : t('eventWizardRaceTrackImage')}
                                      >
                                        {raceImageUrl ? <img src={raceImageUrl} alt={getRaceTrack(race, tournamentForCard, t)} /> : <Flag size={18} />}
                                      </button>
                                      <div className="owner-tournament-workspace-race-order">
                                        {t('ownerRaceRaceOrdinal', { number: race.raceOrder ?? index + 1 })}
                                      </div>
                                      <div className="owner-tournament-workspace-race-main">
                                        <strong>{getRaceName(race, tournamentForCard, t)}</strong>
                                        <small>{getRaceTrack(race, tournamentForCard, t)} · {formatDateTime(race.raceStartTime || race.startTime, t, language)}</small>
                                      </div>
                                      <div className="owner-tournament-workspace-race-meta">
                                        <span>{getRaceDistance(race, t)}</span>
                                        <span>{t('ownerRaceSlots', { count: race.maxRunners ?? t('notUpdated') })}</span>
                                        <StatusBadge status={race.status || 'OPEN_FOR_REGISTRATION'} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                {isSelectedTournamentDetailReady && (
                  <>
                    <section className="owner-tournament-requirements" aria-labelledby="owner-tournament-requirements-title">
                      <div className="owner-tournament-detail-heading">
                        <div>
                          <p className="eyebrow">{t('ownerRaceParticipationConditions')}</p>
                          <h4 id="owner-tournament-requirements-title">{t('ownerRaceEligibilityBeforeInvite')}</h4>
                        </div>
                        <span>{t('ownerRaceConditionCount', { count: getTournamentConditions(selectedTournament)?.length || 0 })}</span>
                      </div>
                      <div className="owner-tournament-condition-grid">
                        <article>
                          <ShieldCheck size={18} />
                          <div><strong>{t('ownerRaceConditionHorseActiveTitle')}</strong><small>{t('ownerRaceConditionHorseActive')}</small></div>
                        </article>
                        <article>
                          <CheckCircle2 size={18} />
                          <div><strong>{t('ownerRaceConditionHealthTitle')}</strong><small>{t('ownerRaceConditionHealthValue', { date: formatDate(selectedTournament.startDate) })}</small></div>
                        </article>
                        {(getTournamentConditions(selectedTournament) || []).map((condition, index) => (
                          <article key={condition.conditionId ?? condition.id ?? `${getConditionType(condition)}-${index}`}>
                            <Flag size={18} />
                            <div>
                              <strong>{formatTournamentCondition(condition, t)}</strong>
                              <small>{t('ownerRaceConditionAppliedToEveryHorse')}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                      {(getTournamentConditions(selectedTournament) || []).length === 0 && (
                        <p className="owner-tournament-no-extra-condition">{t('ownerRaceNoExtraConditions')}</p>
                      )}
                    </section>

                    <section className="owner-tournament-race-program" aria-labelledby="owner-tournament-races-title">
                      <div className="owner-tournament-detail-heading">
                        <div>
                          <p className="eyebrow">{t('ownerRaceProgram')}</p>
                          <h4 id="owner-tournament-races-title">{t('ownerRaceAllRaceDetails')}</h4>
                        </div>
                        <span>{t('ownerRaceRaceTotal', { count: getTournamentRaces(selectedTournament).length })}</span>
                      </div>
                      {getTournamentRaces(selectedTournament).length === 0 ? (
                        <p className="owner-tournament-no-extra-condition">{t('ownerRaceNoRaceConfigured')}</p>
                      ) : (
                        <div className="owner-tournament-race-grid">
                          {getTournamentRaces(selectedTournament).map((race, index) => (
                            <article key={race.raceId ?? race.id ?? index}>
                              <div className="owner-tournament-race-head">
                                <div>
                                  <small>{t('ownerRaceRaceOrdinal', { number: race.raceOrder ?? index + 1 })}</small>
                                  <strong>{getRaceName(race, selectedTournament, t)}</strong>
                                </div>
                                <StatusBadge status={race.status || 'OPEN_FOR_REGISTRATION'} />
                              </div>
                              <dl>
                                <div><dt><CalendarDays size={14} /> {t('ownerRaceRaceStart')}</dt><dd>{formatDateTime(race.raceStartTime || race.startTime, t, language)}</dd></div>
                                <div><dt><Clock size={14} /> {t('ownerRaceRaceEnd')}</dt><dd>{formatDateTime(race.raceEndTime || race.endTime, t, language)}</dd></div>
                                <div><dt><MapPin size={14} /> {t('ownerRaceTrack')}</dt><dd>{getRaceTrack(race, selectedTournament, t)}</dd></div>
                                <div><dt><Flag size={14} /> {t('ownerRaceDistance')}</dt><dd>{getRaceDistance(race, t)}</dd></div>
                                <div><dt><Users size={14} /> {t('ownerRaceMaxRunners')}</dt><dd>{race.maxRunners ?? t('notUpdated')}</dd></div>
                              </dl>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
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

            {horseStepError && <div className="admin-alert error modal-alert" role="alert">{horseStepError}</div>}

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
                  <span>{t('ownerRaceEligibility')}</span>
                  <span>{t('actions')}</span>
                </div>
                {activeHorses.map((horse) => {
                  const horseId = String(getHorseId(horse));
                  const selected = String(formValues.horseId) === horseId;
                  const lockReason = selectedTournament ? getHorseTournamentLockReason(horse, selectedTournament, invitations, horseLockReasons, t) : '';
                  const eligibility = getHorseTournamentEligibility(horse, selectedTournament, t, isSelectedTournamentDetailReady);
                  const participationChecks = [
                    ...eligibility.checks,
                    {
                      key: 'participation-availability',
                      label: t('ownerRaceEligibilityCheckAvailability'),
                      status: lockReason ? 'failed' : 'passed',
                      detail: lockReason || t('ownerRaceEligibilityCheckAvailabilityPassed')
                    }
                  ];
                  const participationReasons = [...new Set([...eligibility.reasons, ...(lockReason ? [lockReason] : [])])];
                  const canParticipate = isSelectedTournamentDetailReady && eligibility.eligible && !lockReason;
                  const disabled = !canParticipate;
                  const reasonText = participationReasons.join(' ');
                  const passedCheckCount = participationChecks.filter((check) => check.status === 'passed').length;
                  const checklistId = `horse-eligibility-${String(getTournamentId(selectedTournament) || 'none')}-${horseId}`;
                  const eligibilityExpanded = expandedEligibilityHorseId === horseId;

                  return (
                    <article className={`registration-horse-card ${selected ? 'selected' : ''} ${canParticipate ? 'eligible' : 'unavailable'}`} key={horseId} title={reasonText || undefined}>
                      <span className="registration-horse-avatar">{selected ? <CheckCircle2 size={22} /> : '🐎'}</span>
                      <strong>{getHorseName(horse) || `Horse ${horseId}`}</strong>
                      <small>{horse.breeding || t('notUpdated')} · {horse.age ?? '?'} {t('ownerRaceYears')} · {horse.weight ?? '?'} kg</small>
                      <div className={`registration-horse-eligibility ${canParticipate ? 'eligible' : 'ineligible'}`}>
                        <span className="registration-horse-eligibility-badge">
                          {canParticipate ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {canParticipate ? t('ownerRaceEligible') : t('ownerRaceNotEligible')}
                        </span>
                        <small className="registration-horse-eligibility-summary">
                          {t('ownerRaceEligibilitySummary', {
                            passed: passedCheckCount,
                            total: participationChecks.length
                          })}
                        </small>
                        <button
                          type="button"
                          className="registration-horse-eligibility-toggle"
                          aria-expanded={eligibilityExpanded}
                          aria-controls={checklistId}
                          onClick={() => setExpandedEligibilityHorseId((current) => current === horseId ? '' : horseId)}
                        >
                          {eligibilityExpanded ? t('ownerRaceEligibilityHideDetails') : t('ownerRaceEligibilityShowDetails')}
                          <ChevronDown className={eligibilityExpanded ? 'is-expanded' : ''} size={15} />
                        </button>
                      </div>
                      <div className="registration-horse-actions">
                        {selected && <span className="registration-horse-selected-badge"><CheckCircle2 size={15} /> {t('ownerRaceSelectedHorse')}</span>}
                        {!selected && (
                          <button className="primary-button compact-primary" type="button" onClick={() => selectHorse(horse)} disabled={disabled} title={reasonText || undefined}>
                            {t('ownerRaceSelectHorse')}
                          </button>
                        )}
                        <button className="outline-button" type="button" onClick={() => setDetailHorse(horse)}>
                          <Eye size={15} /> {t('ownerRaceViewProfile')}
                        </button>
                      </div>
                      {eligibilityExpanded && (
                        <ul className="registration-horse-checklist" id={checklistId}>
                          {participationChecks.map((check) => (
                            <li className={`registration-horse-check ${check.status}`} key={check.key}>
                              <span className="registration-horse-check-icon" aria-hidden="true">
                                {check.status === 'passed'
                                  ? <CheckCircle2 size={17} />
                                  : check.status === 'failed'
                                    ? <XCircle size={17} />
                                    : <Clock size={17} />}
                              </span>
                              <span className="registration-horse-check-copy">
                                <strong>{check.label}</strong>
                                <small>{check.detail}</small>
                              </span>
                              <span className="registration-horse-check-state">
                                {check.status === 'passed'
                                  ? t('ownerRaceEligibilityStatusPassed')
                                  : check.status === 'failed'
                                    ? t('ownerRaceEligibilityStatusFailed')
                                    : t('ownerRaceEligibilityStatusUnknown')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
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

          </form>

          {showPaymentResult ? (
          <section className={`owner-panel owner-payment-result ${isRegistrationPaid ? 'is-paid' : 'is-failed'}`}>
            <div className="owner-payment-result-header">
              <div className={`owner-payment-result-icon ${isRegistrationPaid ? 'success' : 'failed'}`}>
                {isRegistrationPaid ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <div className="owner-payment-result-copy" aria-live="polite">
                <p className="eyebrow">{paymentResult ? t('ownerRacePaymentResultEyebrow') : t('ownerRacePaymentDetailsEyebrow')}</p>
                <h2>{isRegistrationPaid ? t('ownerRacePaymentCompletedTitle') : t('ownerRacePaymentFailedTitle')}</h2>
                <p>{isRegistrationPaid
                  ? t('ownerRacePaymentCompletedDesc')
                  : paymentResult?.message || t('ownerRacePaymentFailedDesc')}</p>
              </div>
              <button className="outline-button compact-button owner-payment-result-close" type="button" onClick={clearTournamentSelection} disabled={isRegistering}>
                <X size={16} /> {t('close')}
              </button>
            </div>
            <div className="owner-tournament-registration-state">
              <div>
                <p className="eyebrow">{t('ownerRaceRegistrationState')}</p>
                <h4>{selectedRegistrationState.title}</h4>
                <small>{selectedRegistrationState.description}</small>
              </div>
              <div className="owner-tournament-registration-state-badges">
                {selectedRegistrationCode && <span>{t('ownerRaceRegistrationNoLabel')} <strong>{selectedRegistrationCode}</strong></span>}
                {selectedInvitationStatus && <span>{t('ownerRaceInvitationStatusLabel')} <StatusBadge status={selectedInvitationStatus} /></span>}
                {selectedApprovalStatus && <span>{t('ownerRaceApprovalStatusLabel')} <StatusBadge status={selectedApprovalStatus} /></span>}
                {selectedPaymentStatus && <span>{t('ownerRacePaymentStatusLabel')} <StatusBadge status={selectedPaymentStatus} /></span>}
              </div>
            </div>
            <dl className="owner-payment-result-details">
              <div><dt>{t('ownerRaceTournamentLabel')}</dt><dd>{selectedTournament ? getTournamentName(selectedTournament) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceLocation')}</dt><dd>{selectedTournament ? getTournamentVenue(selectedTournament, t) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceDateTime')}</dt><dd>{selectedTournament ? formatDateRange(selectedTournament.startDate, selectedTournament.endDate, t) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceHorseLabel')} / Jockey</dt><dd>{selectedHorse ? getHorseName(selectedHorse) : 'N/A'} / {selectedAcceptedInvitation ? getInvitationJockeyName(selectedAcceptedInvitation) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceRegistrationCode')}</dt><dd>{registrationResult?.registrationNo || selectedAcceptedInvitation?.registrationNo || (paymentResult?.registrationId ? `#${paymentResult.registrationId}` : 'N/A')}</dd></div>
              <div><dt>{t('ownerRaceAmount')}</dt><dd>{formatCurrency(paymentResult?.amount ?? selectedTournament?.entryFee)}</dd></div>
              <div><dt>{t('ownerRacePayment')}</dt><dd><StatusBadge status={selectedPaymentStatus || 'FAILED'} /></dd></div>
              <div><dt>{t('ownerRaceApproval')}</dt><dd><StatusBadge status={selectedApprovalStatus || 'PENDING'} /></dd></div>
              {paymentResult?.txnRef && <div className="owner-payment-result-transaction"><dt>{t('ownerRaceTransactionCode')}</dt><dd>{paymentResult.txnRef}</dd></div>}
            </dl>
          </section>
          ) : showReadOnlyRegistration ? (
          <section className={`owner-panel owner-payment-result owner-registration-readonly tone-${selectedRegistrationWorkflow.tone}`}>
            <div className="owner-payment-result-header">
              <div className={`owner-payment-result-icon ${selectedRegistrationWorkflow.tone === 'danger' ? 'failed' : 'success'}`}>
                {selectedRegistrationWorkflow.tone === 'danger' ? <XCircle size={32} /> : <ShieldCheck size={32} />}
              </div>
              <div className="owner-payment-result-copy" aria-live="polite">
                <p className="eyebrow">{t('ownerRaceRegistrationDetailsEyebrow')}</p>
                <h2>{selectedRegistrationState.title}</h2>
                <p>{selectedRegistrationState.description}</p>
              </div>
              <button className="outline-button compact-button owner-payment-result-close" type="button" onClick={clearTournamentSelection}>
                <X size={16} /> {t('close')}
              </button>
            </div>

            <div className="owner-tournament-registration-state">
              <div>
                <p className="eyebrow">{t('ownerRaceRegistrationState')}</p>
                <h4>{selectedRegistrationState.title}</h4>
                <small>{selectedRegistrationState.description}</small>
              </div>
              <div className="owner-tournament-registration-state-badges">
                {selectedRegistrationCode && <span>{t('ownerRaceRegistrationNoLabel')} <strong>{selectedRegistrationCode}</strong></span>}
                {selectedInvitationStatus && <span>{t('ownerRaceInvitationStatusLabel')} <StatusBadge status={selectedInvitationStatus} /></span>}
                {selectedApprovalStatus && <span>{t('ownerRaceApprovalStatusLabel')} <StatusBadge status={selectedApprovalStatus} /></span>}
                {selectedPaymentStatus && <span>{t('ownerRacePaymentStatusLabel')} <StatusBadge status={selectedPaymentStatus} /></span>}
              </div>
            </div>

            <dl className="owner-payment-result-details">
              <div><dt>{t('ownerRaceTournamentLabel')}</dt><dd>{selectedTournament ? getTournamentName(selectedTournament) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceLocation')}</dt><dd>{selectedTournament ? getTournamentVenue(selectedTournament, t) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceDateTime')}</dt><dd>{selectedTournament ? formatDateRange(selectedTournament.startDate, selectedTournament.endDate, t) : 'N/A'}</dd></div>
              <div><dt>{t('ownerRaceHorseLabel')} / Jockey</dt><dd>{selectedHorse ? getHorseName(selectedHorse) : 'N/A'} / {getInvitationJockeyName(selectedAcceptedInvitation)}</dd></div>
              <div><dt>{t('ownerRaceRegistrationCode')}</dt><dd>{selectedAcceptedInvitation?.registrationNo || (selectedAcceptedInvitation?.registrationId ? `#${selectedAcceptedInvitation.registrationId}` : 'N/A')}</dd></div>
              <div><dt>{t('ownerRaceAmount')}</dt><dd>{formatCurrency(selectedTournament?.entryFee)}</dd></div>
              <div><dt>{t('ownerRacePayment')}</dt><dd>{selectedPaymentStatus ? <StatusBadge status={selectedPaymentStatus} /> : t('notUpdated')}</dd></div>
              <div><dt>{t('ownerRaceApproval')}</dt><dd>{selectedApprovalStatus ? <StatusBadge status={selectedApprovalStatus} /> : t('notUpdated')}</dd></div>
              {(selectedAcceptedInvitation?.rejectionReason || selectedRegistrationWorkflow.kind === 'REGISTRATION_REJECTED') && (
                <div className="owner-payment-result-transaction owner-registration-rejection-reason">
                  <dt>{t('ownerRaceWorkflowRejectionReason')}</dt>
                  <dd>{selectedAcceptedInvitation?.rejectionReason || t('ownerRaceWorkflowNoRejectionReason')}</dd>
                </div>
              )}
            </dl>

            {selectedRegistrationWorkflow.kind === 'PAYMENT_REFUNDED' && onViewTransactions && (
              <div className="admin-form-actions tournament-modal-actions">
                <button className="outline-button" type="button" onClick={onViewTransactions}>
                  <CircleDollarSign size={16} /> {t('ownerRaceWorkflowViewTransaction')}
                </button>
              </div>
            )}
          </section>
          ) : isPaymentFlowActive && hasAcceptedInvitation && canStartInvitationPayment(selectedAcceptedInvitation) ? (
          <form className={`owner-panel owner-form flow-only ${wizardStep === 4 ? '' : 'wizard-step-hidden'}`} onSubmit={handleStartRegistrationPayment} noValidate>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">{t('ownerRacePaymentTitle')}</p>
                <h2>{t('ownerRacePaymentReviewTitle')}</h2>
                <p>{t('ownerRacePaymentReviewDesc')}</p>
              </div>
            </div>

            {registrationSubmitError && <div className="admin-alert error modal-alert" role="alert">{registrationSubmitError}</div>}
            {registrationErrors.horseId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.horseId}</div>}
            {registrationErrors.jockeyId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.jockeyId}</div>}
            {isSelectedTournamentDetailLoading && <div className="admin-alert warning modal-alert" role="status">{t('ownerRaceTournamentDetailLoading')}</div>}
            {selectedTournamentDetailError && (
              <div className="tournament-detail-load-error" role="alert">
                <span>{selectedTournamentDetailError}</span>
                <button className="outline-button compact-button" type="button" onClick={() => loadTournamentDetail(selectedTournamentId, { force: true })}>
                  <RefreshCw size={15} /> {t('ownerRaceRetryDetail')}
                </button>
              </div>
            )}

            <div className="owner-payment-order-summary">
              <div><span>{t('ownerRaceTournamentLabel')}</span><strong>{selectedTournament ? getTournamentName(selectedTournament) : t('notUpdated')}</strong></div>
              <div><span>{t('ownerRaceHorseLabel')}</span><strong>{selectedHorse ? getHorseName(selectedHorse) : t('notUpdated')}</strong></div>
              <div><span>Jockey</span><strong>{selectedAcceptedInvitation ? getInvitationJockeyName(selectedAcceptedInvitation) : t('notUpdated')}</strong></div>
              <div><span>{t('ownerRaceEntryFee')}</span><strong>{formatCurrency(selectedTournament?.entryFee)}</strong></div>
            </div>

            <div className="owner-tournament-registration-state">
              <div>
                <p className="eyebrow">{t('ownerRaceRegistrationState')}</p>
                <h4>{selectedRegistrationState.title}</h4>
                <small>{selectedRegistrationState.description}</small>
              </div>
              <div className="owner-tournament-registration-state-badges">
                {selectedRegistrationCode && <span>{t('ownerRaceRegistrationNoLabel')} <strong>{selectedRegistrationCode}</strong></span>}
                {selectedInvitationStatus && <span>{t('ownerRaceInvitationStatusLabel')} <StatusBadge status={selectedInvitationStatus} /></span>}
                {selectedApprovalStatus && <span>{t('ownerRaceApprovalStatusLabel')} <StatusBadge status={selectedApprovalStatus} /></span>}
                {selectedPaymentStatus && <span>{t('ownerRacePaymentStatusLabel')} <StatusBadge status={selectedPaymentStatus} /></span>}
              </div>
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

          {isInviteFlowActive && wizardStep < 3 && (
            <div className="owner-panel wizard-navigation">
              <button className="outline-button wizard-nav-button" type="button" onClick={clearTournamentSelection} disabled={isSaving || isRegistering}>
                {t('cancel')}
              </button>
              <div className="wizard-navigation-actions">
                <button className="outline-button wizard-nav-button" type="button" onClick={goPreviousStep} disabled={wizardStep <= 2 || isSaving || isRegistering}>
                  {t('previous')}
                </button>
                {wizardStep < 3 && (
                  <button className="primary-button compact-primary wizard-nav-button" type="button" onClick={goNextStep} disabled={isSaving || isRegistering || (wizardStep === 1 && !isSelectedTournamentDetailReady)}>
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

      {detailInvitation && (() => {
        const invitationTournament = tournamentById.get(String(getInvitationTournamentId(detailInvitation))) || null;
        const invitationHorse = ownerHorseList.find((horse) => String(getHorseId(horse)) === String(getInvitationHorseId(detailInvitation))) || null;
        const invitationJockey = jockeys.find((jockey) => String(getUserId(jockey)) === String(getInvitationJockeyId(detailInvitation))) || null;
        const invitationStatus = getEffectiveInvitationStatus(detailInvitation) || 'UNKNOWN';
        const invitationWorkflow = getTournamentWorkflowState(detailInvitation, t);

        return (
          <div className="owner-race-detail-backdrop" role="presentation" onClick={() => setDetailInvitation(null)}>
            <section className="owner-invitation-detail-modal" role="dialog" aria-modal="true" aria-labelledby="owner-invitation-detail-title" onClick={(event) => event.stopPropagation()}>
              <div className="owner-invitation-detail-header">
                <div className="owner-invitation-detail-icon"><Send size={24} /></div>
                <div>
                  <p className="eyebrow">{t('ownerRaceInvitationDetailTitle')}</p>
                  <h3 id="owner-invitation-detail-title">
                    {getTournamentName(invitationTournament) || detailInvitation.tournamentName || `${t('ownerRaceTournamentLabel')} #${getInvitationTournamentId(detailInvitation) || ''}`}
                  </h3>
                  <span>{t('ownerRaceInvitationDetailDesc')}</span>
                </div>
                <StatusBadge status={invitationStatus} />
                <button type="button" className="drawer-close-button" onClick={() => setDetailInvitation(null)} aria-label={t('close')}>
                  <X size={18} />
                </button>
              </div>

              <div className={`owner-invitation-detail-state tone-${invitationWorkflow.tone}`}>
                <div>
                  <strong>{invitationWorkflow.label}</strong>
                  <p>{invitationWorkflow.description}</p>
                </div>
                <StatusBadge status={invitationStatus} />
              </div>

              <dl className="owner-invitation-detail-grid">
                <div>
                  <dt>{t('ownerRaceInvitationIdLabel')}</dt>
                  <dd>#{getInvitationId(detailInvitation) || 'N/A'}</dd>
                </div>
                <div>
                  <dt>{t('ownerRaceTournamentLabel')}</dt>
                  <dd>{getTournamentName(invitationTournament) || detailInvitation.tournamentName || 'N/A'}</dd>
                </div>
                <div>
                  <dt>{t('ownerRaceHorseLabel')}</dt>
                  <dd>{invitationHorse ? getHorseName(invitationHorse) : detailInvitation.horseName || `#${getInvitationHorseId(detailInvitation) || 'N/A'}`}</dd>
                </div>
                <div>
                  <dt>Jockey</dt>
                  <dd>{invitationJockey ? getJockeyName(invitationJockey) : getInvitationJockeyName(detailInvitation)}</dd>
                </div>
                <div>
                  <dt>{t('ownerRaceInvitationSentAt')}</dt>
                  <dd>{formatDateTime(detailInvitation.createdAt, t, language)}</dd>
                </div>
                <div>
                  <dt>{t('ownerRaceWorkflowInvitationDeadline')}</dt>
                  <dd>{formatDateTime(detailInvitation.expiredAt, t, language)}</dd>
                </div>
                {detailInvitation.respondedAt && (
                  <div>
                    <dt>{t('ownerRaceInvitationRespondedAt')}</dt>
                    <dd>{formatDateTime(detailInvitation.respondedAt, t, language)}</dd>
                  </div>
                )}
              </dl>

              <div className="owner-invitation-detail-message">
                <span>{t('ownerRaceMessage')}</span>
                <p>{detailInvitation.message || t('ownerRaceInvitationMessageEmpty')}</p>
              </div>

              <footer className="owner-invitation-detail-footer">
                <button type="button" className="outline-button" onClick={() => setDetailInvitation(null)}>
                  {t('close')}
                </button>
                {invitationStatus === 'PENDING' && (
                  <button
                    type="button"
                    className="table-button danger-action"
                    onClick={() => {
                      const invitation = detailInvitation;
                      setDetailInvitation(null);
                      handleCancel(invitation);
                    }}
                  >
                    {t('ownerRaceCancelInvite')}
                  </button>
                )}
              </footer>
            </section>
          </div>
        );
      })()}

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

      {detailRace && (() => {
        const { race, tournament, raceOrder } = detailRace;
        const raceImageUrl = getRaceImageUrl(race);
        const racePrizes = Array.isArray(race?.prizes)
          ? [...race.prizes].sort((left, right) => Number(left.rankPosition ?? left.rank ?? 0) - Number(right.rankPosition ?? right.rank ?? 0))
          : [];
        const prizeCount = racePrizes.length || Number(race?.prizeCount || 0);
        const entryCount = Number(race?.entryCount ?? race?.entries ?? 0);
        const maxRunners = race?.maxRunners ?? race?.capacity ?? tournament?.maxRegistrations ?? t('notUpdated');
        return (
          <div className="owner-race-detail-backdrop" role="presentation" onClick={() => setDetailRace(null)}>
            <section className="owner-race-detail-modal" role="dialog" aria-modal="true" aria-labelledby="owner-race-detail-title" onClick={(event) => event.stopPropagation()}>
              <div className="owner-race-detail-hero">
                <div className={`owner-race-detail-image ${raceImageUrl ? 'has-image' : ''}`}>
                  {raceImageUrl ? <img src={raceImageUrl} alt={getRaceTrack(race, tournament, t)} /> : <Flag size={32} />}
                </div>
                <div className="owner-race-detail-title">
                  <p className="eyebrow">{t('ownerRaceRaceOrdinal', { number: raceOrder })}</p>
                  <h3 id="owner-race-detail-title">{getRaceName(race, tournament, t)}</h3>
                  <span><MapPin size={15} /> {getRaceTrack(race, tournament, t)}</span>
                </div>
                <StatusBadge status={race?.status || 'OPEN_FOR_REGISTRATION'} />
                <button type="button" className="drawer-close-button" onClick={() => setDetailRace(null)} aria-label={t('eventCommonClose')}>
                  <X size={18} />
                </button>
              </div>

              <div className="owner-race-detail-grid">
                <article>
                  <CalendarDays size={18} />
                  <span>{t('ownerRaceDateTime')}</span>
                  <strong>{formatDateTime(race?.raceStartTime || race?.startTime, t, language)}</strong>
                </article>
                <article>
                  <Clock size={18} />
                  <span>{language === 'vi' ? 'Thời gian kết thúc' : 'End time'}</span>
                  <strong>{formatDateTime(race?.raceEndTime || race?.endTime, t, language)}</strong>
                </article>
                <article>
                  <Flag size={18} />
                  <span>{t('ownerRaceDistance')}</span>
                  <strong>{getRaceDistance(race, t)}</strong>
                </article>
                <article>
                  <Users size={18} />
                  <span>{t('ownerRaceHorseCount')}</span>
                  <strong>{entryCount} / {maxRunners}</strong>
                </article>
                <article>
                  <Trophy size={18} />
                  <span>{language === 'vi' ? 'Hạng giải thưởng' : 'Prize ranks'}</span>
                  <strong>{prizeCount || t('notUpdated')}</strong>
                </article>
                <article>
                  <CircleDollarSign size={18} />
                  <span>{t('ownerRaceEntryFee')}</span>
                  <strong>{formatCurrency(tournament?.entryFee)}</strong>
                </article>
              </div>

              <div className="owner-race-detail-note">
                <ShieldCheck size={16} />
                <p>{t('ownerRaceAllTournamentsDesc')}</p>
              </div>

              <section className="owner-race-prize-detail-section">
                <div className="owner-race-prize-detail-header">
                  <div>
                    <p className="eyebrow">{language === 'vi' ? 'Cấu hình giải thưởng' : 'Prize configuration'}</p>
                    <h4>{language === 'vi' ? 'Chi tiết hạng giải' : 'Prize rank details'}</h4>
                  </div>
                  <span>{prizeCount ? `${prizeCount} ${language === 'vi' ? 'hạng' : 'ranks'}` : t('notUpdated')}</span>
                </div>
                {racePrizes.length > 0 ? (
                  <div className="owner-race-prize-detail-list">
                    {racePrizes.map((prize, index) => {
                      const rank = prize.rankPosition ?? prize.rank ?? index + 1;
                      const ownerPercent = Number(prize.ownerPercent ?? prize.ownerPercentage ?? 0);
                      const jockeyPercent = Number(prize.jockeyPercent ?? prize.jockeyPercentage ?? 0);
                      return (
                        <article key={`${rank}-${prize.amount ?? index}`} className="owner-race-prize-detail-card">
                          <div className="owner-race-prize-rank">#{rank}</div>
                          <div>
                            <span>{language === 'vi' ? 'Tiền thưởng' : 'Prize money'}</span>
                            <strong>{formatCurrency(prize.amount)}</strong>
                          </div>
                          <div>
                            <span>Owner</span>
                            <strong>{ownerPercent}%</strong>
                          </div>
                          <div>
                            <span>Jockey</span>
                            <strong>{jockeyPercent}%</strong>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="owner-race-prize-empty">{language === 'vi' ? 'Race này chưa có thông tin hạng giải.' : 'No prize rank details configured for this Race.'}</p>
                )}
              </section>
            </section>
          </div>
        );
      })()}

      {previewTournamentImage && (
        <div className="owner-image-preview-backdrop" role="presentation" onClick={() => setPreviewTournamentImage(null)}>
          <section className="owner-image-preview-modal" role="dialog" aria-modal="true" aria-labelledby="owner-tournament-image-title" onClick={(event) => event.stopPropagation()}>
            <div className="owner-image-preview-header">
              <div>
                <p className="eyebrow">{t('eventWizardVenueImage')}</p>
                <h3 id="owner-tournament-image-title">{previewTournamentImage.title}</h3>
                <span>{previewTournamentImage.venue}</span>
              </div>
              <button type="button" className="drawer-close-button" onClick={() => setPreviewTournamentImage(null)} aria-label={t('close')}>
                <X size={18} />
              </button>
            </div>
            <div className="owner-image-preview-frame">
              <img src={previewTournamentImage.src} alt={previewTournamentImage.title} />
            </div>
          </section>
        </div>
      )}

      {detailJockey && (() => {
        const stats = getJockeyStats(detailJockey, t);
        return (
          <div className="jockey-detail-drawer-backdrop" role="presentation" onClick={() => setDetailJockey(null)}>
            <aside className="jockey-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="jockey-detail-title" onClick={(event) => event.stopPropagation()}>
              <div className="jockey-detail-header">
                <div>
                  <p className="eyebrow">{t('ownerRaceJockeyDetail')}</p>
                  <h3 id="jockey-detail-title">{getJockeyName(detailJockey)}</h3>
                  <span><ShieldCheck size={14} /> {formatDisplayLabel(stats.status)}</span>
                </div>
                <button type="button" className="drawer-close-button" onClick={() => setDetailJockey(null)} aria-label={t('ownerRaceCloseJockeyDetail')}>
                  <X size={18} />
                </button>
              </div>

              <section className="jockey-detail-section jockey-profile-overview-section">
                <h4>{t('ownerRaceProfileInfo')}</h4>
                <div className="jockey-detail-list">
                  <div><strong>{t('ownerRaceLicense')}</strong><span>{stats.license}</span></div>
                  <div><strong>{language === 'vi' ? 'Xếp hạng' : 'Ranking'}</strong><span>{stats.ranking}</span></div>
                  <div><strong>{t('status')}</strong><span>{formatDisplayLabel(stats.status)}</span></div>
                  <div><strong>Email</strong><span>{stats.email}</span></div>
                  <div><strong>{language === 'vi' ? 'Số điện thoại' : 'Phone'}</strong><span>{stats.phone}</span></div>
                  <div><strong>{t('ownerRaceWeight')}</strong><span>{stats.weight ? `${stats.weight} kg` : t('notUpdated')}</span></div>
                </div>
              </section>

              <div className="jockey-detail-metric-grid">
                <span>{t('ownerRaceTotalRace')} <strong>{stats.totalRaces}</strong></span>
                <span>{t('ownerRaceWins')} <strong>{stats.wins}</strong></span>
                <span>{t('ownerRaceWinRate')} <strong>{formatPercent(stats.winRate, t)}</strong></span>
                <span>{t('ownerRaceTop3Rate')} <strong>{formatPercent(stats.top3Rate, t)}</strong></span>
                <span>{language === 'vi' ? 'Xếp hạng' : 'Ranking'} <strong>{stats.ranking}</strong></span>
                <span>{t('ownerRaceViolation')} <strong>{stats.violationCount} / DQ {stats.disqualifiedCount}</strong></span>
              </div>

              <section className="jockey-detail-section">
                <h4>{language === 'vi' ? 'Giới thiệu' : 'Biography'}</h4>
                <p className="jockey-detail-biography">{stats.biography}</p>
              </section>

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
                <h4>{t('ownerRacePerformanceSummary')}</h4>
                <div className="jockey-detail-split">
                  <div>
                    <strong>{t('ownerRaceTotalRace')}</strong>
                    <span>{stats.totalRaces}</span>
                    <strong>{t('ownerRaceWins')}</strong>
                    <span>{stats.wins}</span>
                  </div>
                  <div>
                    <strong>{t('ownerRaceWinRate')}</strong>
                    <span>{formatPercent(stats.winRate, t)}</span>
                    <strong>{t('ownerRaceTop3Rate')}</strong>
                    <span>{formatPercent(stats.top3Rate, t)}</span>
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
