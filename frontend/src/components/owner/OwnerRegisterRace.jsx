import { useEffect, useMemo, useState } from 'react';
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
import { formatDate, formatDisplayLabel, getHorseId, getHorseName, getUserId, getUserRole } from '../../lib';

const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'];

function getInvitationId(invitation) {
  return invitation.invitationId ?? '';
}

function getTournamentId(tournament) {
  return tournament.tournamentId ?? tournament.tournamentID ?? tournament.id;
}

function getTournamentName(tournament) {
  return String(tournament.tournamentName ?? tournament.name ?? '').trim();
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

function isActiveHorse(horse) {
  return String(horse.status || '').toUpperCase() === 'ACTIVE';
}

function isAvailableTournament(tournament) {
  const status = String(tournament.status || '').toUpperCase();
  const deadline = getDateTime(tournament.registrationDeadline ?? tournament.registrationCloseAt);
  const isCancelled = status.includes('CANCEL');
  const isOpen = status === 'OPEN' || status === 'OPEN_REGISTRATION' || status === 'OPEN_FOR_REGISTRATION' || status.includes('REGISTRATION');

  if (isCancelled) return false;
  if (deadline && deadline.getTime() < Date.now()) return false;
  return isOpen;
}

function formatTournamentOption(tournament) {
  const id = getTournamentId(tournament);
  const name = getTournamentName(tournament) || `Tournament ${id}`;
  const date = tournament.startDate ? ` • Bắt đầu: ${formatDate(tournament.startDate)}` : '';
  const location = tournament.location || tournament.venue ? ` • ${tournament.location || tournament.venue}` : '';
  const deadlineValue = tournament.registrationDeadline ?? tournament.registrationCloseAt;
  const deadline = deadlineValue ? ` • Deadline đăng ký: ${formatDateTime(deadlineValue)}` : '';
  return `${name}${location}${date}${deadline}`;
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
    ?? tournamentById.get(String(invitation.tournamentId))?.registrationCloseAt
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

function validateInvitationForm(formValues, horses, tournaments) {
  const errors = {};
  const selectedHorse = horses.find((horse) => String(getHorseId(horse)) === String(formValues.horseId));
  const selectedTournament = tournaments.find((tournament) => String(getTournamentId(tournament)) === String(formValues.tournamentId));
  const expiredAt = formValues.expiredAt ? getDateTime(formValues.expiredAt) : null;

  if (!formValues.tournamentId) {
    errors.tournamentId = 'Vui lòng chọn giải đấu.';
  } else if (!selectedTournament) {
    errors.tournamentId = 'Giải đấu đã chọn không nằm trong danh sách đã tải.';
  } else if (!isAvailableTournament(selectedTournament)) {
    errors.tournamentId = 'Giải đấu không còn mở đăng ký hoặc đã quá hạn đăng ký.';
  }

  if (!formValues.horseId) {
    errors.horseId = 'Vui lòng chọn ngựa.';
  } else if (!selectedHorse) {
    errors.horseId = 'Ngựa đã chọn không nằm trong danh sách ngựa của bạn.';
  } else if (!isActiveHorse(selectedHorse)) {
    errors.horseId = 'Chỉ có thể chọn ngựa ở trạng thái ACTIVE.';
  }

  if (!formValues.jockeyId) {
    errors.jockeyId = 'Vui lòng chọn jockey.';
  }

  if (formValues.expiredAt && !expiredAt) {
    errors.expiredAt = 'Hạn phản hồi không hợp lệ.';
  } else if (expiredAt) {
    const registrationDeadline = getDateTime(selectedTournament?.registrationDeadline);

    if (expiredAt.getTime() <= Date.now()) {
      errors.expiredAt = 'Hạn phản hồi phải ở trong tương lai.';
    } else if (registrationDeadline && expiredAt.getTime() >= registrationDeadline.getTime()) {
      errors.expiredAt = 'Hạn phản hồi phải trước deadline đăng ký giải đấu.';
    }
  }

  return errors;
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

  const activeHorses = useMemo(() => horses.filter(isActiveHorse), [horses]);
  const registrationHorses = useMemo(
    () => (ownerHorses.length > 0 ? ownerHorses : horses).filter(isActiveHorse),
    [horses, ownerHorses]
  );
  const availableTournaments = useMemo(() => tournaments.filter(isAvailableTournament), [tournaments]);
  const tournamentById = useMemo(() => new Map(tournaments.map((tournament) => [String(getTournamentId(tournament)), tournament])), [tournaments]);
  const openTournamentById = useMemo(() => new Map(openTournaments.map((tournament) => [String(getTournamentId(tournament)), tournament])), [openTournaments]);
  const selectedTournament = useMemo(
    () => tournamentById.get(String(formValues.tournamentId)) || null,
    [formValues.tournamentId, tournamentById]
  );
  const selectedRegistrationTournament = useMemo(
    () => openTournamentById.get(String(registrationValues.tournamentId)) || null,
    [openTournamentById, registrationValues.tournamentId]
  );
  const acceptedJockeyInvitations = useMemo(() => {
    if (!registrationValues.tournamentId || !registrationValues.horseId) return [];

    return invitations.filter((invitation) => (
      String(invitation.status || '').toUpperCase() === 'ACCEPTED'
      && String(getInvitationTournamentId(invitation)) === String(registrationValues.tournamentId)
      && String(getInvitationHorseId(invitation)) === String(registrationValues.horseId)
    ));
  }, [invitations, registrationValues.horseId, registrationValues.tournamentId]);
  const responseDeadlineMin = useMemo(() => getDateTimeLocalMinValue(), []);
  const responseDeadlineMax = useMemo(
    () => selectedTournament?.registrationDeadline ? toDateTimeLocalValue(selectedTournament.registrationDeadline) : '',
    [selectedTournament]
  );
  const filteredInvitations = useMemo(() => {
    if (statusFilter === 'ALL') return invitations;
    return invitations.filter((invitation) => String(invitation.status || '').toUpperCase() === statusFilter);
  }, [invitations, statusFilter]);

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
      setLoadError(getErrorText(err, 'Không thể tải dữ liệu lời mời jockey.'));
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
    setMessage('');
  }

  function handleRegistrationChange(event) {
    const { name, value } = event.target;
    setRegistrationValues((current) => {
      const next = { ...current, [name]: value };
      if (name === 'tournamentId' || name === 'horseId') {
        next.jockeyId = '';
      }
      return next;
    });
    setRegistrationErrors((current) => ({ ...current, [name]: '' }));
    setRegistrationSubmitError('');
    setRegistrationResult(null);
    setMessage('');
  }

  function validateRegistrationForm() {
    const errors = {};
    const selectedTournament = openTournaments.find((tournament) => String(getTournamentId(tournament)) === String(registrationValues.tournamentId));
    const selectedHorse = registrationHorses.find((horse) => String(getHorseId(horse)) === String(registrationValues.horseId));
    const selectedInvitation = acceptedJockeyInvitations.find((invitation) => String(getInvitationJockeyId(invitation)) === String(registrationValues.jockeyId));

    if (!registrationValues.tournamentId) {
      errors.tournamentId = 'Vui lòng chọn Tournament.';
    } else if (!selectedTournament) {
      errors.tournamentId = 'Tournament đã chọn không còn mở Registration.';
    }

    if (!registrationValues.horseId) {
      errors.horseId = 'Vui lòng chọn ngựa.';
    } else if (!selectedHorse) {
      errors.horseId = 'Ngựa đã chọn không ở trạng thái ACTIVE.';
    }

    if (!registrationValues.jockeyId) {
      errors.jockeyId = 'Bạn cần có Jockey đã chấp nhận lời mời trước khi đăng ký Tournament.';
    } else if (!selectedInvitation) {
      errors.jockeyId = 'Jockey đã chọn không có lời mời ACCEPTED phù hợp với Tournament và ngựa.';
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validateInvitationForm(formValues, horses, tournaments);
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
      setMessage('Đã gửi lời mời jockey. Khi jockey chấp nhận, đơn đăng ký sẽ chuyển sang ACCEPTED và chờ admin xét duyệt.');
      setFormValues(emptyInvitationForm());
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
        setMessage('Registration da duoc tao. Dang chuyen sang VNPAY de thanh toan phi tham gia.');
        window.location.assign(response.paymentUrl);
        return;
      }
      setMessage('Đã gửi Registration Tournament. Vui lòng chờ Admin duyệt.');
      await loadPageData();
    } catch (err) {
      setRegistrationSubmitError(getErrorText(err, 'Không thể đăng ký Tournament.'));
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
    <section className="owner-stack">
      {loadError && <div className="admin-alert error" role="alert">{loadError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <form className="owner-panel owner-form" onSubmit={handleRegistrationSubmit} noValidate>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Registration</p>
            <h2>Đăng ký Tournament</h2>
            <p>Chọn Tournament đang mở Registration, ngựa ACTIVE và Jockey đã ACCEPTED lời mời để gửi đơn chờ Admin duyệt.</p>
          </div>
          <button className="outline-button" type="button" onClick={loadPageData} disabled={isLoading || isRegistering}>
            {isLoading ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </button>
        </div>

        {registrationSubmitError && <div className="admin-alert error modal-alert" role="alert">{registrationSubmitError}</div>}

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="registrationTournamentId">Tournament <span className="required">*</span></label>
            <select
              className={registrationErrors.tournamentId ? 'input has-error' : 'input'}
              id="registrationTournamentId"
              name="tournamentId"
              value={registrationValues.tournamentId}
              onChange={handleRegistrationChange}
              disabled={isLoading || isRegistering}
            >
              <option value="">Chọn Tournament đang mở Registration</option>
              {openTournaments.map((tournament) => {
                const tournamentId = getTournamentId(tournament);
                return <option key={tournamentId} value={tournamentId}>{formatTournamentOption(tournament)}</option>;
              })}
            </select>
            {registrationErrors.tournamentId && <p className="field-error">{registrationErrors.tournamentId}</p>}
            {!isLoading && openTournaments.length === 0 && <p className="field-hint warning-text">Hiện không có Tournament nào đang mở Registration.</p>}
            {selectedRegistrationTournament && (
              <p className="field-hint">
                Hạn Registration: <strong>{formatDateTime(selectedRegistrationTournament.registrationCloseAt)}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor="registrationHorseId">Ngựa ACTIVE <span className="required">*</span></label>
            <select
              className={registrationErrors.horseId ? 'input has-error' : 'input'}
              id="registrationHorseId"
              name="horseId"
              value={registrationValues.horseId}
              onChange={handleRegistrationChange}
              disabled={isLoading || isRegistering}
            >
              <option value="">Chọn ngựa</option>
              {registrationHorses.map((horse) => {
                const horseId = getHorseId(horse);
                return <option key={horseId} value={horseId}>{getHorseName(horse) || `Horse ${horseId}`}</option>;
              })}
            </select>
            {registrationErrors.horseId && <p className="field-error">{registrationErrors.horseId}</p>}
            {!isLoading && registrationHorses.length === 0 && <p className="field-hint warning-text">Bạn không có ngựa ACTIVE để đăng ký Tournament.</p>}
          </div>
        </div>

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="registrationJockeyId">Jockey đã ACCEPTED <span className="required">*</span></label>
            <select
              className={registrationErrors.jockeyId ? 'input has-error' : 'input'}
              id="registrationJockeyId"
              name="jockeyId"
              value={registrationValues.jockeyId}
              onChange={handleRegistrationChange}
              disabled={isLoading || isRegistering || !registrationValues.tournamentId || !registrationValues.horseId}
            >
              <option value="">Chọn Jockey đã chấp nhận lời mời</option>
              {acceptedJockeyInvitations.map((invitation) => {
                const jockeyId = getInvitationJockeyId(invitation);
                return <option key={invitation.invitationId || jockeyId} value={jockeyId}>{getInvitationJockeyName(invitation)}</option>;
              })}
            </select>
            {registrationErrors.jockeyId && <p className="field-error">{registrationErrors.jockeyId}</p>}
            {registrationValues.tournamentId && registrationValues.horseId && acceptedJockeyInvitations.length === 0 && (
              <p className="field-hint warning-text">Bạn cần có Jockey đã chấp nhận lời mời trước khi đăng ký Tournament.</p>
            )}
          </div>

          <div>
            <span className="field-label">Trạng thái mặc định</span>
            <div className="detail-grid">
              <span>Payment Status</span>
              <strong>UNPAID</strong>
              <span>Approval Status</span>
              <strong>PENDING</strong>
            </div>
          </div>
        </div>

        {registrationResult && (
          <div className="admin-alert success modal-alert" role="status">
            Registration {registrationResult.registrationNo || `#${registrationResult.registrationId || ''}`} đã được tạo với Payment Status {registrationResult.paymentStatus || 'UNPAID'} và Approval Status {registrationResult.approvalStatus || 'PENDING'}.
          </div>
        )}

        <div className="admin-form-actions tournament-modal-actions">
          <button className="primary-button" type="submit" disabled={isRegistering || isLoading}>
            {isRegistering ? 'Đang gửi Registration...' : 'Gửi Registration'}
          </button>
        </div>
      </form>

      <form className="owner-panel owner-form" onSubmit={handleSubmit} noValidate>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Lời mời</p>
            <h2>Mời jockey tham gia giải đấu</h2>
            <p>Chọn giải đấu đang mở đăng ký, ngựa ACTIVE và jockey ACTIVE để tạo lời mời đang chờ phản hồi.</p>
          </div>
          <button className="outline-button" type="button" onClick={onBackToHorses}>Quay lại danh sách ngựa</button>
        </div>

        {submitError && <div className="admin-alert error modal-alert" role="alert">{submitError}</div>}

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerTournamentId">Giải đấu <span className="required">*</span></label>
            <select className={formErrors.tournamentId ? 'input has-error' : 'input'} id="ownerTournamentId" name="tournamentId" value={formValues.tournamentId} onChange={handleChange} disabled={isSaving || isLoading}>
              <option value="">Chọn giải đấu đang mở đăng ký</option>
              {availableTournaments.map((tournament) => {
                const tournamentId = getTournamentId(tournament);
                return <option key={tournamentId} value={tournamentId}>{formatTournamentOption(tournament)}</option>;
              })}
            </select>
            {formErrors.tournamentId && <p className="field-error">{formErrors.tournamentId}</p>}
            {selectedTournament && (
              <p className="field-hint">
                Deadline đăng ký: <strong>{formatDateTime(selectedTournament.registrationDeadline)}</strong>
              </p>
            )}
            {!isLoading && tournaments.length > 0 && availableTournaments.length === 0 && <p className="field-hint warning-text">Hiện không có giải đấu nào đang mở đăng ký.</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="ownerHorseId">Ngựa đang hoạt động <span className="required">*</span></label>
            <select className={formErrors.horseId ? 'input has-error' : 'input'} id="ownerHorseId" name="horseId" value={formValues.horseId} onChange={handleChange} disabled={isSaving}>
              <option value="">Chọn ngựa</option>
              {activeHorses.map((horse) => {
                const horseId = getHorseId(horse);
                return <option key={horseId} value={horseId}>{getHorseName(horse) || `Horse ${horseId}`}</option>;
              })}
            </select>
            {formErrors.horseId && <p className="field-error">{formErrors.horseId}</p>}
            {horses.length > 0 && activeHorses.length === 0 && <p className="field-hint warning-text">Bạn không có ngựa ACTIVE nào có thể gửi lời mời.</p>}
          </div>
        </div>

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerJockeyId">Jockey đang hoạt động <span className="required">*</span></label>
            <select className={formErrors.jockeyId ? 'input has-error' : 'input'} id="ownerJockeyId" name="jockeyId" value={formValues.jockeyId} onChange={handleChange} disabled={isSaving || isLoading}>
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
              disabled={isSaving}
            />
            {selectedTournament?.registrationDeadline && (
              <p className="field-hint">
                Chọn thời điểm sau hiện tại và trước deadline đăng ký: <strong>{formatDateTime(selectedTournament.registrationDeadline)}</strong>.
              </p>
            )}
            {formErrors.expiredAt && <p className="field-error">{formErrors.expiredAt}</p>}
          </div>
        </div>

        <label className="field-label" htmlFor="ownerInviteMessage">Lời nhắn</label>
        <textarea className="input textarea-input" id="ownerInviteMessage" name="message" rows={3} value={formValues.message} onChange={handleChange} disabled={isSaving} placeholder="Ví dụ: Tôi muốn mời bạn thi đấu cùng ngựa của tôi." />

        <div className="admin-form-actions tournament-modal-actions">
          <button className="primary-button" type="submit" disabled={isSaving || isLoading}>{isSaving ? 'Đang gửi...' : 'Gửi lời mời'}</button>
          <button className="outline-button" type="button" onClick={loadPageData} disabled={isLoading || isSaving}>{isLoading ? 'Đang tải...' : 'Làm mới dữ liệu'}</button>
        </div>
      </form>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <h2>Lời mời đã gửi</h2>
            <p>Theo dõi trạng thái lời mời và đơn đăng ký.</p>
          </div>
          <div className="inline-filter-row">
            <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatDisplayLabel(status)}</option>)}
            </select>
            <span className="owner-count-pill">{filteredInvitations.length} invitations</span>
          </div>
        </div>

        {isLoading ? (
          <p className="table-empty">Đang tải lời mời...</p>
        ) : filteredInvitations.length === 0 ? (
          <p className="table-empty">Không có lời mời phù hợp với bộ lọc hiện tại.</p>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Giải đấu</th>
                  <th>Thời gian</th>
                  <th>Deadline đăng ký</th>
                  <th>Ngựa</th>
                  <th>Jockey</th>
                  <th>Ngày tạo</th>
                  <th>Hết hạn</th>
                  <th>Lời mời</th>
                  <th>Đăng ký</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitations.map((invitation) => {
                  const invitationId = getInvitationId(invitation);
                  const canCancel = String(invitation.status || '').toUpperCase() === 'PENDING';

                  return (
                    <tr key={invitationId || `${invitation.tournamentId}-${invitation.jockeyId}`}>
                      <td>{invitationId || 'N/A'}</td>
                      <td>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</td>
                      <td>{formatTournamentDateRange(invitation)}</td>
                      <td>{formatDateTime(getInvitationRegistrationDeadline(invitation, tournamentById))}</td>
                      <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                      <td>{invitation.jockeyName || invitation.jockeyId || 'N/A'}</td>
                      <td>{formatDate(invitation.createdAt)}</td>
                      <td>{formatDateTime(invitation.expiredAt)}</td>
                      <td><span className={`status-badge ${String(invitation.status || '').toLowerCase()}`}>{formatDisplayLabel(invitation.status)}</span></td>
                      <td><span className={`status-badge ${String(invitation.registrationStatus || '').toLowerCase()}`}>{formatDisplayLabel(invitation.registrationStatus)}</span></td>
                      <td>
                        {canCancel ? (
                          <button type="button" className="table-button danger-action" onClick={() => handleCancel(invitation)} disabled={actingId === invitationId}>Hủy</button>
                        ) : (
                          <span className="readonly-note">Không thể hủy</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
