import { useEffect, useMemo, useState } from 'react';
import { cancelOwnerInvitation, getAvailableJockeys, getOwnerInvitations, getTournaments, inviteJockey } from '../../services/ownerService';
import { formatDate, getHorseId, getHorseName, getUserId } from '../../lib';

const INVITATION_STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'];

function getInvitationId(invitation) {
  return invitation.invitationId ?? '';
}

function getJockeyId(jockey) {
  return jockey?.jockeyId ?? getUserId(jockey);
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
  if (!value) return null;
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

  if (isCancelled) return false;
  if (deadline && deadline.getTime() < Date.now()) return false;
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
    errors.tournamentId = 'Please choose a tournament.';
  } else if (!selectedTournament) {
    errors.tournamentId = 'The selected tournament is not in the loaded list.';
  } else if (!isAvailableTournament(selectedTournament)) {
    errors.tournamentId = 'This tournament is no longer open for registration or its deadline has passed.';
  }

  if (!formValues.horseId) {
    errors.horseId = 'Please choose a horse.';
  } else if (!selectedHorse) {
    errors.horseId = 'The selected horse is not in your horse list.';
  } else if (!isActiveHorse(selectedHorse)) {
    errors.horseId = 'Only ACTIVE horses can be selected.';
  }

  if (!formValues.jockeyId) {
    errors.jockeyId = 'Please choose a jockey.';
  }

  if (formValues.expiredAt && !expiredAt) {
    errors.expiredAt = 'Response deadline is invalid.';
  } else if (expiredAt && expiredAt.getTime() <= Date.now()) {
    errors.expiredAt = 'Response deadline must be in the future.';
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
      const [tournamentData, jockeyData, invitationData] = await Promise.all([
        getTournaments(),
        getAvailableJockeys(formValues.tournamentId || null),
        getOwnerInvitations()
      ]);

      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setJockeys(Array.isArray(jockeyData) ? jockeyData : []);
      setInvitations(Array.isArray(invitationData) ? invitationData : []);
    } catch (err) {
      setLoadError(getErrorText(err, 'Unable to load jockey invitation data.'));
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

    if (name === 'tournamentId') {
      loadAvailableJockeys(value);
    }
  }

  async function loadAvailableJockeys(tournamentId) {
    setLoadError('');
    try {
      const data = await getAvailableJockeys(tournamentId || null);
      setJockeys(Array.isArray(data) ? data : []);
      setFormValues((current) => ({ ...current, jockeyId: '' }));
    } catch (err) {
      setLoadError(getErrorText(err, 'Unable to load available jockeys.'));
      setJockeys([]);
    }
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
      setMessage('Jockey invitation was sent. When the jockey accepts, the registration becomes ACCEPTED and waits for admin review.');
      setFormValues(emptyInvitationForm());
      setFormErrors({});
      await loadPageData();
    } catch (err) {
      setSubmitError(getErrorText(err, 'Unable to send the jockey invitation.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancel(invitation) {
    const invitationId = getInvitationId(invitation);
    if (!invitationId) return;

    const confirmed = window.confirm('Are you sure you want to cancel this jockey invitation?');
    if (!confirmed) return;

    setActingId(invitationId);
    setLoadError('');
    setSubmitError('');
    setMessage('');

    try {
      await cancelOwnerInvitation(invitationId);
      setMessage('Jockey invitation was cancelled.');
      await loadPageData();
    } catch (err) {
      setLoadError(getErrorText(err, 'Unable to cancel the invitation.'));
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className="owner-stack">
      {loadError && <div className="admin-alert error" role="alert">{loadError}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <form className="owner-panel owner-form" onSubmit={handleSubmit} noValidate>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Invitation</p>
            <h2>Invite a Jockey to a Tournament</h2>
            <p>Choose an open tournament, an ACTIVE horse, and a READY jockey to create a pending jockey invitation.</p>
          </div>
          <button className="outline-button" type="button" onClick={onBackToHorses}>Back to Horses</button>
        </div>

        {submitError && <div className="admin-alert error modal-alert" role="alert">{submitError}</div>}

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerTournamentId">Tournament <span className="required">*</span></label>
            <select className={formErrors.tournamentId ? 'input has-error' : 'input'} id="ownerTournamentId" name="tournamentId" value={formValues.tournamentId} onChange={handleChange} disabled={isSaving || isLoading}>
              <option value="">Choose an open tournament</option>
              {availableTournaments.map((tournament) => {
                const tournamentId = getTournamentId(tournament);
                return <option key={tournamentId} value={tournamentId}>{formatTournamentOption(tournament)}</option>;
              })}
            </select>
            {formErrors.tournamentId && <p className="field-error">{formErrors.tournamentId}</p>}
            {!isLoading && tournaments.length > 0 && availableTournaments.length === 0 && <p className="field-hint warning-text">No tournaments are currently open for registration.</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="ownerHorseId">ACTIVE Horse <span className="required">*</span></label>
            <select className={formErrors.horseId ? 'input has-error' : 'input'} id="ownerHorseId" name="horseId" value={formValues.horseId} onChange={handleChange} disabled={isSaving}>
              <option value="">Choose a horse</option>
              {activeHorses.map((horse) => {
                const horseId = getHorseId(horse);
                return <option key={horseId} value={horseId}>{getHorseName(horse) || `Horse ${horseId}`}</option>;
              })}
            </select>
            {formErrors.horseId && <p className="field-error">{formErrors.horseId}</p>}
            {horses.length > 0 && activeHorses.length === 0 && <p className="field-hint warning-text">You do not have any ACTIVE horses available for invitations.</p>}
          </div>
        </div>

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerJockeyId">READY Jockey <span className="required">*</span></label>
            <select className={formErrors.jockeyId ? 'input has-error' : 'input'} id="ownerJockeyId" name="jockeyId" value={formValues.jockeyId} onChange={handleChange} disabled={isSaving || isLoading}>
              <option value="">Choose a jockey</option>
              {jockeys.map((jockey) => {
                const jockeyId = getJockeyId(jockey);
                return <option key={jockeyId} value={jockeyId}>{jockey.fullName || jockey.email || `Jockey ${jockeyId}`}</option>;
              })}
            </select>
            {formErrors.jockeyId && <p className="field-error">{formErrors.jockeyId}</p>}
            {!isLoading && jockeys.length === 0 && <p className="field-hint warning-text">No READY jockeys are available for the selected tournament.</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="ownerExpiredAt">Invitation Response Deadline</label>
            <input className={formErrors.expiredAt ? 'input has-error' : 'input'} id="ownerExpiredAt" name="expiredAt" type="datetime-local" value={formValues.expiredAt} onChange={handleChange} disabled={isSaving} />
            {formErrors.expiredAt && <p className="field-error">{formErrors.expiredAt}</p>}
          </div>
        </div>

        <label className="field-label" htmlFor="ownerInviteMessage">Message</label>
        <textarea className="input textarea-input" id="ownerInviteMessage" name="message" rows={3} value={formValues.message} onChange={handleChange} disabled={isSaving} placeholder="Example: I would like to invite you to race with my horse." />

        <div className="admin-form-actions tournament-modal-actions">
          <button className="primary-button" type="submit" disabled={isSaving || isLoading}>{isSaving ? 'Sending...' : 'Send Invitation'}</button>
          <button className="outline-button" type="button" onClick={loadPageData} disabled={isLoading || isSaving}>{isLoading ? 'Loading...' : 'Refresh Data'}</button>
        </div>
      </form>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <h2>Sent Invitations</h2>
            <p>Track invitation and registration statuses.</p>
          </div>
          <div className="inline-filter-row">
            <select className="input compact-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {INVITATION_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>)}
            </select>
            <span className="owner-count-pill">{filteredInvitations.length} invitations</span>
          </div>
        </div>

        {isLoading ? (
          <p className="table-empty">Loading invitations...</p>
        ) : filteredInvitations.length === 0 ? (
          <p className="table-empty">No invitations match the current filters.</p>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tournament</th>
                  <th>Horse</th>
                  <th>Jockey</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Invitation</th>
                  <th>Registration</th>
                  <th>Actions</th>
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
                      <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                      <td>{invitation.jockeyName || invitation.jockeyId || 'N/A'}</td>
                      <td>{formatDate(invitation.createdAt)}</td>
                      <td>{formatDate(invitation.expiredAt)}</td>
                      <td><span className={`status-badge ${String(invitation.status || '').toLowerCase()}`}>{invitation.status || 'N/A'}</span></td>
                      <td><span className={`status-badge ${String(invitation.registrationStatus || '').toLowerCase()}`}>{invitation.registrationStatus || 'N/A'}</span></td>
                      <td>
                        {canCancel ? (
                          <button type="button" className="table-button danger-action" onClick={() => handleCancel(invitation)} disabled={actingId === invitationId}>Cancel</button>
                        ) : (
                          <span className="readonly-note">Cannot cancel</span>
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
