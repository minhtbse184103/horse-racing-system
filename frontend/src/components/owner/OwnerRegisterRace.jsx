import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
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
  Users,
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
import { getTournaments } from '../../services/eventService';
import API_BASE_URL from '../../configs/apiConfig';
import { formatDate, formatDisplayLabel, getHorseId, getHorseName, getUserId, getUserRole } from '../../lib';

const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'];

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0
});

function getInvitationId(invitation) {
  return invitation.invitationId ?? '';
}

function getTournamentId(tournament) {
  return tournament?.tournamentId ?? tournament?.tournamentID ?? tournament?.id;
}

function getTournamentName(tournament) {
  return String(tournament?.tournamentName ?? tournament?.name ?? '').trim();
}

function getTournamentVenue(tournament) {
  return tournament?.venue || tournament?.location || 'Chưa cập nhật địa điểm';
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

function toDateTimeLocalValue(value) {
  const date = value instanceof Date ? value : getDateTime(value);
  if (!date) return '';

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function getDateTimeLocalMinValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  now.setSeconds(0, 0);
  return toDateTimeLocalValue(now);
}

function formatDateTime(value) {
  const date = getDateTime(value);
  if (!date) return 'Chưa cập nhật';

  return date.toLocaleString('vi-VN', {
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

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'Chưa cập nhật';
  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  return formatDate(startDate || endDate);
}

function formatStatus(status) {
  const normalized = String(status || '').toUpperCase();
  const labels = {
    OPEN_FOR_REGISTRATION: 'Đang mở đăng ký',
    REGISTRATION_CLOSED: 'Đã đóng đăng ký',
    PENDING: 'Đang chờ',
    ACCEPTED: 'Đã chấp nhận',
    REJECTED: 'Đã từ chối',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn',
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    APPROVED: 'Đã duyệt'
  };
  return labels[normalized] || formatDisplayLabel(status);
}

function isActiveHorse(horse) {
  return String(horse.status || '').toUpperCase() === 'ACTIVE';
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

function hasRegistrationStatus(invitation) {
  return Boolean(invitation.registrationStatus);
}

function validateInvitationForm(formValues, horses, tournaments) {
  const errors = {};
  const selectedHorse = horses.find((horse) => String(getHorseId(horse)) === String(formValues.horseId));
  const selectedTournament = tournaments.find((tournament) => String(getTournamentId(tournament)) === String(formValues.tournamentId));
  const expiredAt = formValues.expiredAt ? getDateTime(formValues.expiredAt) : null;

  if (!formValues.tournamentId) {
    errors.tournamentId = 'Vui lòng chọn giải đấu.';
  } else if (!selectedTournament) {
    errors.tournamentId = 'Giải đấu đã chọn không nằm trong danh sách đang mở đăng ký.';
  } else if (!isAvailableTournament(selectedTournament)) {
    errors.tournamentId = 'Giải đấu không còn mở đăng ký hoặc đã quá hạn đăng ký.';
  }

  if (!formValues.horseId) {
    errors.horseId = 'Vui lòng chọn ngựa.';
  } else if (!selectedHorse) {
    errors.horseId = 'Ngựa đã chọn không nằm trong danh sách ngựa ACTIVE của bạn.';
  } else if (!isActiveHorse(selectedHorse)) {
    errors.horseId = 'Chỉ có thể chọn ngựa ở trạng thái ACTIVE.';
  }

  if (!formValues.jockeyId) {
    errors.jockeyId = 'Vui lòng chọn jockey.';
  }

  if (formValues.expiredAt && !expiredAt) {
    errors.expiredAt = 'Hạn phản hồi không hợp lệ.';
  } else if (expiredAt) {
    const registrationDeadline = getDateTime(getRegistrationDeadline(selectedTournament));

    if (expiredAt.getTime() <= Date.now()) {
      errors.expiredAt = 'Hạn phản hồi phải ở trong tương lai.';
    } else if (registrationDeadline && expiredAt.getTime() >= registrationDeadline.getTime()) {
      errors.expiredAt = 'Hạn phản hồi phải trước deadline đăng ký giải đấu.';
    }
  }

  return errors;
}

function StatusBadge({ status }) {
  const className = String(status || 'not-registered')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return <span className={`status-badge ${className}`}>{formatStatus(status || 'Chưa có')}</span>;
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
  const [actingId, setActingId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [registrationSubmitError, setRegistrationSubmitError] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);
  const [message, setMessage] = useState('');

  const activeHorses = useMemo(
    () => (ownerHorses.length > 0 ? ownerHorses : horses).filter(isActiveHorse),
    [horses, ownerHorses]
  );
  const availableTournaments = useMemo(() => {
    const source = openTournaments.length > 0 ? openTournaments : tournaments.filter(isAvailableTournament);
    return source.filter((tournament) => getTournamentId(tournament));
  }, [openTournaments, tournaments]);
  const tournamentById = useMemo(() => {
    const merged = [...tournaments, ...openTournaments];
    return new Map(
      merged
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
  const acceptedJockeyInvitations = useMemo(() => {
    if (!registrationValues.tournamentId || !registrationValues.horseId) return [];

    return invitations.filter((invitation) => (
      String(invitation.status || '').toUpperCase() === 'ACCEPTED'
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
  const responseDeadlineMin = useMemo(() => getDateTimeLocalMinValue(), []);
  const responseDeadlineMax = useMemo(
    () => getRegistrationDeadline(selectedTournament) ? toDateTimeLocalValue(getRegistrationDeadline(selectedTournament)) : '',
    [selectedTournament]
  );
  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);
  const inviteReady = Boolean(formValues.tournamentId && formValues.horseId);
  const hasAcceptedInvitation = acceptedJockeyInvitations.length > 0;
  const canSubmitRegistration = Boolean(registrationValues.tournamentId && registrationValues.horseId && registrationValues.jockeyId);
  const activeStep = !formValues.tournamentId ? 1 : !formValues.horseId ? 2 : !hasAcceptedInvitation ? 3 : 5;

  useEffect(() => {
    loadPageData();
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
      setInvitations(Array.isArray(invitationData) ? invitationData : []);
    } catch (err) {
      setLoadError(getErrorText(err, 'Không thể tải dữ liệu đăng ký giải đấu.'));
    } finally {
      setIsLoading(false);
    }
  }

  function resetFeedback() {
    setSubmitError('');
    setRegistrationSubmitError('');
    setRegistrationResult(null);
    setMessage('');
  }

  function selectTournament(tournament) {
    const tournamentId = String(getTournamentId(tournament));
    setFormValues((current) => ({ ...current, tournamentId }));
    setRegistrationValues((current) => ({ ...current, tournamentId, jockeyId: '' }));
    setFormErrors((current) => ({ ...current, tournamentId: '' }));
    setRegistrationErrors((current) => ({ ...current, tournamentId: '' }));
    resetFeedback();
  }

  function selectHorse(horse) {
    const horseId = String(getHorseId(horse));
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

  function handleRegistrationJockeyChange(event) {
    const { value } = event.target;
    setRegistrationValues((current) => ({ ...current, jockeyId: value }));
    setRegistrationErrors((current) => ({ ...current, jockeyId: '' }));
    resetFeedback();
  }

  function fillRegistrationFromInvitation(invitation) {
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
    setRegistrationErrors({});
    resetFeedback();
  }

  function validateRegistrationForm() {
    const errors = {};
    const selectedRegistrationTournament = availableTournaments.find((tournament) => String(getTournamentId(tournament)) === String(registrationValues.tournamentId));
    const selectedRegistrationHorse = activeHorses.find((horse) => String(getHorseId(horse)) === String(registrationValues.horseId));

    if (!registrationValues.tournamentId) {
      errors.tournamentId = 'Vui lòng chọn giải đấu.';
    } else if (!selectedRegistrationTournament) {
      errors.tournamentId = 'Giải đấu đã chọn không còn mở đăng ký.';
    }

    if (!registrationValues.horseId) {
      errors.horseId = 'Vui lòng chọn ngựa.';
    } else if (!selectedRegistrationHorse) {
      errors.horseId = 'Ngựa đã chọn không ở trạng thái ACTIVE.';
    }

    if (!registrationValues.jockeyId) {
      errors.jockeyId = 'Bạn cần chọn lời mời jockey đã chấp nhận trước khi đăng ký.';
    } else if (!selectedAcceptedInvitation) {
      errors.jockeyId = 'Jockey đã chọn không có lời mời ACCEPTED phù hợp với giải đấu và ngựa.';
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validateInvitationForm(formValues, activeHorses, availableTournaments);
    setFormErrors(errors);
    setSubmitError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await inviteJockey({
        tournamentId: Number(formValues.tournamentId),
        horseId: Number(formValues.horseId),
        jockeyId: Number(formValues.jockeyId),
        expiredAt: formValues.expiredAt || null,
        message: formValues.message.trim() || null
      });
      setMessage('Đã gửi lời mời jockey. Khi jockey chấp nhận, bạn có thể đăng ký giải và thanh toán phí tham gia.');
      setFormValues((current) => ({ ...current, jockeyId: '', expiredAt: '', message: '' }));
      setFormErrors({});
      await loadPageData();
    } catch (err) {
      setSubmitError(getErrorText(err, 'Không thể gửi lời mời jockey.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegistrationSubmit(event) {
    event.preventDefault();
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
        setMessage('Đã tạo đơn đăng ký. Đang chuyển sang VNPAY để thanh toán phí tham gia.');
        window.location.assign(response.paymentUrl);
        return;
      }
      setMessage('Đã gửi đơn đăng ký giải đấu. Vui lòng chờ Admin duyệt.');
      await loadPageData();
    } catch (err) {
      setRegistrationSubmitError(getErrorText(err, 'Không thể đăng ký giải đấu.'));
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleCancel(invitation) {
    const invitationId = getInvitationId(invitation);
    if (!invitationId) return;

    const confirmed = window.confirm('Bạn có chắc muốn hủy lời mời jockey này?');
    if (!confirmed) return;

    setActingId(invitationId);
    setLoadError('');
    setSubmitError('');
    setMessage('');

    try {
      await cancelOwnerInvitation(invitationId);
      setMessage('Đã hủy lời mời jockey.');
      await loadPageData();
    } catch (err) {
      setLoadError(getErrorText(err, 'Không thể hủy lời mời.'));
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className="owner-stack owner-registration-page">
      {loadError && <div className="admin-alert error" role="alert">{loadError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="owner-panel owner-registration-hero">
        <div>
          <p className="eyebrow">Đăng ký tham gia giải đấu</p>
          <h2>Chọn giải, mời jockey và hoàn tất thanh toán</h2>
          <p>Owner cần có ngựa ACTIVE và lời mời jockey đã được chấp nhận trước khi gửi đơn đăng ký cho Admin duyệt.</p>
        </div>
        <button className="outline-button compact-button" type="button" onClick={loadPageData} disabled={isLoading || isSaving || isRegistering}>
          <RefreshCw size={16} /> {isLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </section>

      <div className="owner-registration-layout">
        <main className="owner-registration-main">
          <section className="owner-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Bước 1</p>
                <h2>Giải đấu đang mở</h2>
                <p>Xem thông tin giải trước khi chọn ngựa và mời jockey.</p>
              </div>
            </div>

            {registrationErrors.tournamentId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.tournamentId}</div>}
            {formErrors.tournamentId && <div className="admin-alert error modal-alert" role="alert">{formErrors.tournamentId}</div>}

            {isLoading ? (
              <p className="table-empty">Đang tải danh sách giải đấu...</p>
            ) : availableTournaments.length === 0 ? (
              <div className="owner-empty-state compact-empty">
                <div><Flag size={34} /></div>
                <h3>Chưa có giải đang mở đăng ký</h3>
                <p>Khi Admin mở registration cho tournament, owner sẽ thấy giải tại đây.</p>
              </div>
            ) : (
              <div className="tournament-card-grid">
                {availableTournaments.map((tournament) => {
                  const tournamentId = String(getTournamentId(tournament));
                  const selected = String(formValues.tournamentId) === tournamentId;
                  const imageUrl = getTournamentImageUrl(tournament);
                  const maxRegistrations = Number(tournament.maxRegistrations || tournament.maxRegistration || 0);
                  const approvedCount = Number(tournament.approvedRegistrationCount || tournament.registrationCount || 0);

                  return (
                    <article className={`tournament-choice-card ${selected ? 'selected' : ''}`} key={tournamentId}>
                      <div className="tournament-choice-media">
                        {imageUrl ? <img src={imageUrl} alt={getTournamentName(tournament)} /> : <Flag size={36} />}
                        <span><Clock size={13} /> Đang mở đăng ký</span>
                      </div>
                      <div className="tournament-choice-body">
                        <h3>{getTournamentName(tournament) || `Giải đấu ${tournamentId}`}</h3>
                        <p><MapPin size={14} /> {getTournamentVenue(tournament)}</p>
                        <div className="tournament-choice-stats">
                          <span>Ngày thi đấu <strong>{formatDateRange(tournament.startDate, tournament.endDate)}</strong></span>
                          <span>Hạn đăng ký <strong>{formatDateTime(getRegistrationDeadline(tournament))}</strong></span>
                          <span>Lệ phí <strong>{formatCurrency(tournament.entryFee)}</strong></span>
                          <span>Số lượng <strong>{maxRegistrations ? `${approvedCount} / ${maxRegistrations} slots` : `${approvedCount} đơn`}</strong></span>
                        </div>
                        <div className="tournament-choice-actions">
                          <button type="button" className="outline-button" onClick={() => selectTournament(tournament)}>
                            <Eye size={15} /> Xem chi tiết
                          </button>
                          <button type="button" className="primary-button compact-primary" onClick={() => selectTournament(tournament)}>
                            {selected ? 'Đã chọn' : 'Chọn giải'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {selectedTournament && (
              <div className="selected-tournament-detail">
                <div className="selected-tournament-header">
                  <div>
                    <p className="eyebrow">Giải đấu đã chọn</p>
                    <h3>{getTournamentName(selectedTournament)}</h3>
                  </div>
                  <StatusBadge status={selectedTournament.status || 'OPEN_FOR_REGISTRATION'} />
                </div>
                <div className="selected-tournament-grid">
                  <span><MapPin size={15} /> Địa điểm <strong>{getTournamentVenue(selectedTournament)}</strong></span>
                  <span><CalendarDays size={15} /> Thời gian <strong>{formatDateRange(selectedTournament.startDate, selectedTournament.endDate)}</strong></span>
                  <span><Clock size={15} /> Mở đăng ký <strong>{formatDateTime(getRegistrationOpenAt(selectedTournament))}</strong></span>
                  <span><Clock size={15} /> Đóng đăng ký <strong>{formatDateTime(getRegistrationDeadline(selectedTournament))}</strong></span>
                  <span><CircleDollarSign size={15} /> Lệ phí <strong>{formatCurrency(selectedTournament.entryFee)}</strong></span>
                  <span><Users size={15} /> Sức chứa <strong>{selectedTournament.maxRegistrations || selectedTournament.maxRegistration || 'Chưa giới hạn'}</strong></span>
                  <span><Flag size={15} /> Số race <strong>{selectedTournament.raceCount ?? 'Chưa cập nhật'}</strong></span>
                  <span><CheckCircle2 size={15} /> Đơn đã duyệt <strong>{selectedTournament.approvedRegistrationCount ?? selectedTournament.registrationCount ?? 0}</strong></span>
                </div>
                {selectedTournament.description && <p className="selected-tournament-description">{selectedTournament.description}</p>}
              </div>
            )}
          </section>

          <section className="owner-panel">
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Bước 2</p>
                <h2>Chọn ngựa ACTIVE</h2>
                <p>Chỉ ngựa đã được duyệt ACTIVE mới có thể dùng để mời jockey và đăng ký giải.</p>
              </div>
              <button className="outline-button" type="button" onClick={onBackToHorses}>Quay lại danh sách ngựa</button>
            </div>

            {formErrors.horseId && <div className="admin-alert error modal-alert" role="alert">{formErrors.horseId}</div>}
            {registrationErrors.horseId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.horseId}</div>}

            {activeHorses.length === 0 ? (
              <div className="owner-empty-state compact-empty">
                <div><Flag size={34} /></div>
                <h3>Bạn chưa có ngựa ACTIVE</h3>
                <p>Hãy thêm hoặc cập nhật hồ sơ ngựa và chờ Admin duyệt trước khi đăng ký giải.</p>
              </div>
            ) : (
              <div className="registration-horse-grid">
                {activeHorses.map((horse) => {
                  const horseId = String(getHorseId(horse));
                  const selected = String(formValues.horseId) === horseId;

                  return (
                    <button className={`registration-horse-card ${selected ? 'selected' : ''}`} type="button" key={horseId} onClick={() => selectHorse(horse)} disabled={!selectedTournament}>
                      <span className="registration-horse-avatar">{selected ? <CheckCircle2 size={22} /> : '🐎'}</span>
                      <strong>{getHorseName(horse) || `Horse ${horseId}`}</strong>
                      <small>{horse.breeding || horse.sex || 'Thông tin giống chưa cập nhật'}</small>
                      <em>{horse.healthCertificateExpiryDate || horse.healthCertExpiry ? `Health cert: ${formatDate(horse.healthCertificateExpiryDate || horse.healthCertExpiry)}` : 'Health cert chưa cập nhật'}</em>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <form className="owner-panel owner-form" onSubmit={handleSubmit} noValidate>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Bước 3</p>
                <h2>Mời jockey tham gia giải đấu</h2>
                <p>Gửi lời mời cho jockey ACTIVE. Sau khi jockey chấp nhận, bạn mới có thể tạo đơn đăng ký và thanh toán.</p>
              </div>
            </div>

            {submitError && <div className="admin-alert error modal-alert" role="alert">{submitError}</div>}
            {currentPendingInvitation && (
              <div className="admin-alert warning modal-alert" role="status">
                Bạn đang có lời mời PENDING cho ngựa này. Hãy chờ jockey phản hồi hoặc hủy lời mời trong bảng bên dưới.
              </div>
            )}

            <div className="owner-form-row">
              <div>
                <label className="field-label" htmlFor="ownerJockeyId">Jockey đang hoạt động <span className="required">*</span></label>
                <select className={formErrors.jockeyId ? 'input has-error' : 'input'} id="ownerJockeyId" name="jockeyId" value={formValues.jockeyId} onChange={handleChange} disabled={isSaving || isLoading || !inviteReady}>
                  <option value="">Chọn jockey</option>
                  {jockeys.map((jockey) => {
                    const jockeyId = getUserId(jockey);
                    return <option key={jockeyId} value={jockeyId}>{jockey.fullName || jockey.email || `Jockey ${jockeyId}`}</option>;
                  })}
                </select>
                {formErrors.jockeyId && <p className="field-error">{formErrors.jockeyId}</p>}
                {!isLoading && jockeys.length === 0 && <p className="field-hint warning-text">Không tìm thấy jockey ACTIVE nào.</p>}
              </div>

              <div>
                <label className="field-label" htmlFor="ownerExpiredAt">Hạn phản hồi lời mời</label>
                <input
                  className={formErrors.expiredAt ? 'input has-error' : 'input'}
                  id="ownerExpiredAt"
                  name="expiredAt"
                  type="datetime-local"
                  value={formValues.expiredAt}
                  onChange={handleChange}
                  min={responseDeadlineMin}
                  max={responseDeadlineMax || undefined}
                  disabled={isSaving || !inviteReady}
                />
                {selectedTournament && (
                  <p className="field-hint">
                    Nên chọn trước hạn đăng ký: <strong>{formatDateTime(getRegistrationDeadline(selectedTournament))}</strong>.
                  </p>
                )}
                {formErrors.expiredAt && <p className="field-error">{formErrors.expiredAt}</p>}
              </div>
            </div>

            <label className="field-label" htmlFor="ownerInviteMessage">Lời nhắn</label>
            <textarea className="input textarea-input" id="ownerInviteMessage" name="message" rows={3} value={formValues.message} onChange={handleChange} disabled={isSaving || !inviteReady} placeholder="Ví dụ: Tôi muốn mời bạn thi đấu cùng ngựa của tôi." />

            <div className="admin-form-actions tournament-modal-actions">
              <button className="primary-button" type="submit" disabled={isSaving || isLoading || !inviteReady || Boolean(currentPendingInvitation)}>
                <Send size={16} /> {isSaving ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
            </div>
          </form>

          <form className="owner-panel owner-form" onSubmit={handleRegistrationSubmit} noValidate>
            <div className="owner-panel-header">
              <div>
                <p className="eyebrow">Bước 5</p>
                <h2>Đăng ký và thanh toán</h2>
                <p>Chọn lời mời đã được jockey chấp nhận để tạo đơn PENDING và chuyển sang thanh toán VNPAY.</p>
              </div>
            </div>

            {registrationSubmitError && <div className="admin-alert error modal-alert" role="alert">{registrationSubmitError}</div>}
            {registrationErrors.jockeyId && <div className="admin-alert error modal-alert" role="alert">{registrationErrors.jockeyId}</div>}

            <div className="owner-form-row">
              <div>
                <label className="field-label" htmlFor="registrationJockeyId">Lời mời đã chấp nhận <span className="required">*</span></label>
                <select
                  className={registrationErrors.jockeyId ? 'input has-error' : 'input'}
                  id="registrationJockeyId"
                  name="jockeyId"
                  value={registrationValues.jockeyId}
                  onChange={handleRegistrationJockeyChange}
                  disabled={isLoading || isRegistering || !registrationValues.tournamentId || !registrationValues.horseId}
                >
                  <option value="">Chọn jockey đã chấp nhận lời mời</option>
                  {acceptedJockeyInvitations.map((invitation) => {
                    const jockeyId = getInvitationJockeyId(invitation);
                    return <option key={invitation.invitationId || jockeyId} value={jockeyId}>{getInvitationJockeyName(invitation)}</option>;
                  })}
                </select>
                {registrationValues.tournamentId && registrationValues.horseId && acceptedJockeyInvitations.length === 0 && (
                  <p className="field-hint warning-text">Chưa có lời mời ACCEPTED cho giải và ngựa đã chọn.</p>
                )}
              </div>

              <div>
                <span className="field-label">Trạng thái sau khi tạo đơn</span>
                <div className="registration-default-status">
                  <span>Thanh toán <strong>Chưa thanh toán</strong></span>
                  <span>Duyệt đơn <strong>Chờ Admin duyệt</strong></span>
                </div>
              </div>
            </div>

            {registrationResult && (
              <div className="admin-alert success modal-alert" role="status">
                Đơn {registrationResult.registrationNo || `#${registrationResult.registrationId || ''}`} đã được tạo với trạng thái {formatStatus(registrationResult.paymentStatus || 'UNPAID')} và {formatStatus(registrationResult.approvalStatus || 'PENDING')}.
              </div>
            )}

            <div className="admin-form-actions tournament-modal-actions">
              <button className="primary-button" type="submit" disabled={isRegistering || isLoading || !canSubmitRegistration}>
                <ArrowRight size={16} /> {isRegistering ? 'Đang tạo đơn...' : 'Đăng ký và thanh toán'}
              </button>
            </div>
          </form>

          <section className="owner-panel">
            <div className="owner-panel-header">
              <div>
                <h2>Lời mời jockey của tôi</h2>
                <p>Theo dõi phản hồi của jockey và tiếp tục đăng ký khi lời mời đã được chấp nhận.</p>
              </div>
              <div className="inline-filter-row">
                <Filter size={16} />
                <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tất cả' : formatStatus(status)}</option>)}
                </select>
                <span className="owner-count-pill">{filteredInvitations.length} lời mời</span>
              </div>
            </div>

            {isLoading ? (
              <p className="table-empty">Đang tải lời mời...</p>
            ) : filteredInvitations.length === 0 ? (
              <p className="table-empty">Không có lời mời phù hợp với bộ lọc hiện tại.</p>
            ) : (
              <div className="table-wrapper">
                <table className="user-table owner-invitation-table">
                  <thead>
                    <tr>
                      <th>Jockey</th>
                      <th>Ngựa</th>
                      <th>Giải đấu</th>
                      <th>Deadline</th>
                      <th>Lời mời</th>
                      <th>Đăng ký</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map((invitation) => {
                      const invitationId = getInvitationId(invitation);
                      const status = String(invitation.status || '').toUpperCase();
                      const canCancel = status === 'PENDING';
                      const canRegister = status === 'ACCEPTED' && !hasRegistrationStatus(invitation);

                      return (
                        <tr key={invitationId || `${invitation.tournamentId}-${invitation.jockeyId}`}>
                          <td>
                            <strong>{getInvitationJockeyName(invitation)}</strong>
                            <small className="table-subtext">Tạo: {formatDate(invitation.createdAt)}</small>
                          </td>
                          <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                          <td>
                            <strong>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</strong>
                            <small className="table-subtext">{formatDateRange(invitation.tournamentStartDate, invitation.tournamentEndDate)}</small>
                          </td>
                          <td>{formatDateTime(getInvitationRegistrationDeadline(invitation, tournamentById))}</td>
                          <td><StatusBadge status={invitation.status} /></td>
                          <td><StatusBadge status={invitation.registrationStatus || 'Chưa có'} /></td>
                          <td>
                            <div className="invitation-action-group">
                              {canRegister && (
                                <button type="button" className="table-button" onClick={() => fillRegistrationFromInvitation(invitation)}>
                                  Đăng ký
                                </button>
                              )}
                              {canCancel ? (
                                <button type="button" className="table-button danger-action" onClick={() => handleCancel(invitation)} disabled={actingId === invitationId}>
                                  Hủy
                                </button>
                              ) : !canRegister ? (
                                <span className="readonly-note"><MoreVertical size={14} /> Không có</span>
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
        </main>

        <aside className="owner-registration-sidebar">
          <section className="owner-panel registration-progress-panel">
            <p className="eyebrow">Tiến trình đăng ký</p>
            <div className="registration-steps">
              <StepItem number={1} label="Chọn giải đấu" complete={Boolean(formValues.tournamentId)} active={activeStep === 1} />
              <StepItem number={2} label="Chọn ngựa" complete={Boolean(formValues.horseId)} active={activeStep === 2} />
              <StepItem number={3} label="Mời jockey" complete={Boolean(currentPendingInvitation || hasAcceptedInvitation)} active={activeStep === 3} />
              <StepItem number={4} label="Jockey chấp nhận" complete={hasAcceptedInvitation} active={Boolean(formValues.horseId && !hasAcceptedInvitation && currentPendingInvitation)} />
              <StepItem number={5} label="Đăng ký & thanh toán" complete={Boolean(registrationResult)} active={activeStep === 5} />
            </div>
          </section>

          <section className="owner-panel registration-selection-panel">
            <p className="eyebrow">Đang chọn</p>
            <div className="registration-selection-block">
              <span>Giải đấu</span>
              <strong>{selectedTournament ? getTournamentName(selectedTournament) : 'Chưa chọn'}</strong>
              {selectedTournament && <small>{getTournamentVenue(selectedTournament)}</small>}
            </div>
            <div className="registration-selection-block">
              <span>Ngựa</span>
              <strong>{selectedHorse ? getHorseName(selectedHorse) : 'Chưa chọn'}</strong>
              {selectedHorse && <small>{selectedHorse.breeding || selectedHorse.sex || 'Ngựa ACTIVE'}</small>}
            </div>
            <div className="registration-selection-block">
              <span>Jockey đã chấp nhận</span>
              <strong>{selectedAcceptedInvitation ? getInvitationJockeyName(selectedAcceptedInvitation) : 'Chưa có'}</strong>
              {selectedAcceptedInvitation && <small>Sẵn sàng tạo đơn đăng ký</small>}
            </div>
          </section>

          <section className="owner-panel registration-help-panel">
            <p className="eyebrow">Điều kiện</p>
            <ul>
              <li><CheckCircle2 size={15} /> Tournament còn mở đăng ký.</li>
              <li><CheckCircle2 size={15} /> Ngựa thuộc owner và đang ACTIVE.</li>
              <li><CheckCircle2 size={15} /> Jockey ACTIVE đã chấp nhận lời mời.</li>
              <li><XCircle size={15} /> Không trùng lịch hoặc trùng đăng ký.</li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
