import { useEffect, useMemo, useState } from 'react';
import { getAllUsers } from '../../services/userService';
import { cancelOwnerInvitation, getOwnerInvitations, getTournaments, inviteJockey } from '../../services/ownerService';
import { formatDate, getHorseId, getHorseName, getUserId, getUserRole } from '../../lib';
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
function getDateTime(value) {
    if (!value)
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
function isActiveHorse(horse) {
    return String(horse.status || '').toUpperCase() === 'ACTIVE';
}
function isAvailableTournament(tournament) {
    const status = String(tournament.status || '').toUpperCase();
    const deadline = getDateTime(tournament.registrationDeadline);
    const isCancelled = status.includes('CANCEL');
    const isOpen = status === 'OPEN' || status === 'OPEN_REGISTRATION' || status === 'OPEN_FOR_REGISTRATION' || status.includes('REGISTRATION');
    if (isCancelled)
        return false;
    if (deadline && deadline.getTime() < Date.now())
        return false;
    return isOpen;
}
function formatTournamentOption(tournament) {
    const id = getTournamentId(tournament);
    const name = getTournamentName(tournament) || `Tournament ${id}`;
    const date = tournament.startDate ? ` • ${formatDate(tournament.startDate)}` : '';
    const location = tournament.location ? ` • ${tournament.location}` : '';
    return `${name}${location}${date}`;
}
function validateInvitationForm(formValues, horses, tournaments) {
    const errors = {};
    const selectedHorse = horses.find((horse) => String(getHorseId(horse)) === String(formValues.horseId));
    const selectedTournament = tournaments.find((tournament) => String(getTournamentId(tournament)) === String(formValues.tournamentId));
    const expiredAt = formValues.expiredAt ? getDateTime(formValues.expiredAt) : null;
    if (!formValues.tournamentId) {
        errors.tournamentId = 'Bạn phải chọn giải đấu.';
    }
    else if (!selectedTournament) {
        errors.tournamentId = 'Giải đấu không tồn tại trong danh sách đang tải.';
    }
    else if (!isAvailableTournament(selectedTournament)) {
        errors.tournamentId = 'Giải đấu này không còn mở đăng ký hoặc đã quá hạn đăng ký.';
    }
    if (!formValues.horseId) {
        errors.horseId = 'Bạn phải chọn ngựa.';
    }
    else if (!selectedHorse) {
        errors.horseId = 'Ngựa không tồn tại trong danh sách của bạn.';
    }
    else if (!isActiveHorse(selectedHorse)) {
        errors.horseId = 'Chỉ được chọn ngựa có trạng thái ACTIVE.';
    }
    if (!formValues.jockeyId) {
        errors.jockeyId = 'Bạn phải chọn jockey.';
    }
    if (formValues.expiredAt && !expiredAt) {
        errors.expiredAt = 'Hạn phản hồi không hợp lệ.';
    }
    else if (expiredAt && expiredAt.getTime() <= Date.now()) {
        errors.expiredAt = 'Hạn phản hồi phải là thời gian trong tương lai.';
    }
    return errors;
}
export default function OwnerRegisterRace({ horses, onBackToHorses }) {
    const [formValues, setFormValues] = useState(emptyInvitationForm());
    const [formErrors, setFormErrors] = useState({});
    const [tournaments, setTournaments] = useState([]);
    const [jockeys, setJockeys] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [actingId, setActingId] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [message, setMessage] = useState('');
    const activeHorses = useMemo(() => horses.filter(isActiveHorse), [horses]);
    const availableTournaments = useMemo(() => tournaments.filter(isAvailableTournament), [tournaments]);
    const filteredInvitations = useMemo(() => {
        if (statusFilter === 'ALL')
            return invitations;
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
            setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
            setJockeys((Array.isArray(userData) ? userData : []).filter((user) => getUserRole(user) === 'JOCKEY' && String(user.status || '').toUpperCase() === 'ACTIVE'));
            setInvitations(Array.isArray(invitationData) ? invitationData : []);
        }
        catch (err) {
            setLoadError(getErrorText(err, 'Không thể tải dữ liệu gửi lời mời jockey.'));
        }
        finally {
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
    async function handleSubmit(event) {
        event.preventDefault();
        const errors = validateInvitationForm(formValues, horses, tournaments);
        setFormErrors(errors);
        setSubmitError('');
        setMessage('');
        if (Object.keys(errors).length > 0)
            return;
        setIsSaving(true);
        try {
            await inviteJockey({
                tournamentId: Number(formValues.tournamentId),
                horseId: Number(formValues.horseId),
                jockeyId: Number(formValues.jockeyId),
                expiredAt: formValues.expiredAt || null,
                message: formValues.message.trim() || null
            });
            setMessage('Đã gửi lời mời jockey. Khi jockey accept, registration sẽ chuyển sang ACCEPTED để Admin duyệt.');
            setFormValues(emptyInvitationForm());
            setFormErrors({});
            await loadPageData();
        }
        catch (err) {
            setSubmitError(getErrorText(err, 'Gửi lời mời jockey thất bại.'));
        }
        finally {
            setIsSaving(false);
        }
    }
    async function handleCancel(invitation) {
        const invitationId = getInvitationId(invitation);
        if (!invitationId)
            return;
        const confirmed = window.confirm('Bạn có chắc muốn hủy lời mời jockey này không?');
        if (!confirmed)
            return;
        setActingId(invitationId);
        setLoadError('');
        setSubmitError('');
        setMessage('');
        try {
            await cancelOwnerInvitation(invitationId);
            setMessage('Đã hủy lời mời jockey.');
            await loadPageData();
        }
        catch (err) {
            setLoadError(getErrorText(err, 'Hủy lời mời thất bại.'));
        }
        finally {
            setActingId(null);
        }
    }
    return (<section className="owner-stack">
      {loadError && <div className="admin-alert error" role="alert">{loadError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <form className="owner-panel owner-form" onSubmit={handleSubmit} noValidate>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Invitation</p>
            <h2>Mời jockey tham gia giải đấu</h2>
            <p>Owner chọn giải đấu còn mở đăng ký, chọn ngựa ACTIVE và chọn jockey ACTIVE để tạo registration PENDING_JOCKEY.</p>
          </div>
          <button className="outline-button" type="button" onClick={onBackToHorses}>Quay lại ngựa</button>
        </div>

        {submitError && <div className="admin-alert error modal-alert" role="alert">{submitError}</div>}

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerTournamentId">Giải đấu <span className="required">*</span></label>
            <select className={formErrors.tournamentId ? 'input has-error' : 'input'} id="ownerTournamentId" name="tournamentId" value={formValues.tournamentId} onChange={handleChange} disabled={isSaving || isLoading}>
              <option value="">Chọn giải đấu còn mở đăng ký</option>
              {availableTournaments.map((tournament) => {
            const tournamentId = getTournamentId(tournament);
            return <option key={tournamentId} value={tournamentId}>{formatTournamentOption(tournament)}</option>;
        })}
            </select>
            {formErrors.tournamentId && <p className="field-error">{formErrors.tournamentId}</p>}
            {!isLoading && tournaments.length > 0 && availableTournaments.length === 0 && (<p className="field-hint warning-text">Hiện chưa có giải đấu nào còn mở đăng ký.</p>)}
          </div>

          <div>
            <label className="field-label" htmlFor="ownerHorseId">Ngựa ACTIVE <span className="required">*</span></label>
            <select className={formErrors.horseId ? 'input has-error' : 'input'} id="ownerHorseId" name="horseId" value={formValues.horseId} onChange={handleChange} disabled={isSaving}>
              <option value="">Chọn ngựa</option>
              {activeHorses.map((horse) => {
            const horseId = getHorseId(horse);
            return <option key={horseId} value={horseId}>{getHorseName(horse) || `Horse ${horseId}`}</option>;
        })}
            </select>
            {formErrors.horseId && <p className="field-error">{formErrors.horseId}</p>}
            {horses.length > 0 && activeHorses.length === 0 && (<p className="field-hint warning-text">Bạn chưa có ngựa ACTIVE để gửi invitation.</p>)}
          </div>
        </div>

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerJockeyId">Jockey ACTIVE <span className="required">*</span></label>
            <select className={formErrors.jockeyId ? 'input has-error' : 'input'} id="ownerJockeyId" name="jockeyId" value={formValues.jockeyId} onChange={handleChange} disabled={isSaving || isLoading}>
              <option value="">Chọn jockey</option>
              {jockeys.map((jockey) => {
            const jockeyId = getUserId(jockey);
            return <option key={jockeyId} value={jockeyId}>{jockey.fullName || jockey.email || `Jockey ${jockeyId}`}</option>;
        })}
            </select>
            {formErrors.jockeyId && <p className="field-error">{formErrors.jockeyId}</p>}
            {!isLoading && jockeys.length === 0 && (<p className="field-hint warning-text">Không tìm thấy jockey ACTIVE từ API /api/user/all.</p>)}
          </div>

          <div>
            <label className="field-label" htmlFor="ownerExpiredAt">Hạn phản hồi lời mời</label>
            <input className={formErrors.expiredAt ? 'input has-error' : 'input'} id="ownerExpiredAt" name="expiredAt" type="datetime-local" value={formValues.expiredAt} onChange={handleChange} disabled={isSaving}/>
            {formErrors.expiredAt && <p className="field-error">{formErrors.expiredAt}</p>}
          </div>
        </div>

        <label className="field-label" htmlFor="ownerInviteMessage">Lời nhắn</label>
        <textarea className="input textarea-input" id="ownerInviteMessage" name="message" rows={3} value={formValues.message} onChange={handleChange} disabled={isSaving} placeholder="Ví dụ: Mời bạn tham gia giải đấu cùng ngựa của tôi."/>

        <div className="admin-form-actions tournament-modal-actions">
          <button className="primary-button" type="submit" disabled={isSaving || isLoading}>{isSaving ? 'Đang gửi...' : 'Gửi lời mời'}</button>
          <button className="outline-button" type="button" onClick={loadPageData} disabled={isLoading || isSaving}>{isLoading ? 'Đang tải...' : 'Làm mới dữ liệu'}</button>
        </div>
      </form>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <h2>Lời mời đã gửi</h2>
            <p>Theo dõi trạng thái invitation và registration.</p>
          </div>
          <div className="inline-filter-row">
            <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tất cả status' : status}</option>)}
            </select>
            <span className="owner-count-pill">{filteredInvitations.length} lời mời</span>
          </div>
        </div>

        {isLoading ? (<p className="table-empty">Đang tải lời mời...</p>) : filteredInvitations.length === 0 ? (<p className="table-empty">Chưa có lời mời phù hợp với bộ lọc.</p>) : (<div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Giải đấu</th>
                  <th>Ngựa</th>
                  <th>Jockey</th>
                  <th>Tạo lúc</th>
                  <th>Hết hạn</th>
                  <th>Invitation</th>
                  <th>Registration</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitations.map((invitation) => {
                const invitationId = getInvitationId(invitation);
                const canCancel = String(invitation.status || '').toUpperCase() === 'PENDING';
                return (<tr key={invitationId || `${invitation.tournamentId}-${invitation.jockeyId}`}>
                      <td>{invitationId || 'N/A'}</td>
                      <td>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</td>
                      <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                      <td>{invitation.jockeyName || invitation.jockeyId || 'N/A'}</td>
                      <td>{formatDate(invitation.createdAt)}</td>
                      <td>{formatDate(invitation.expiredAt)}</td>
                      <td><span className={`status-badge ${String(invitation.status || '').toLowerCase()}`}>{invitation.status || 'N/A'}</span></td>
                      <td><span className={`status-badge ${String(invitation.registrationStatus || '').toLowerCase()}`}>{invitation.registrationStatus || 'N/A'}</span></td>
                      <td>
                        {canCancel ? (<button type="button" className="table-button danger-action" onClick={() => handleCancel(invitation)} disabled={actingId === invitationId}>Hủy</button>) : (<span className="readonly-note">Không thể hủy</span>)}
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </section>
    </section>);
}
