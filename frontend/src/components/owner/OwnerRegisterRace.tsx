import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { cancelOwnerInvitation, getOwnerInvitations, inviteJockey } from '../../services/ownerService';
import type { Horse, OwnerInvitation } from '../../services/ownerService';
import { formatDate, getHorseId, getHorseName } from '../../lib';

interface OwnerRegisterRaceProps {
  horses: Horse[];
  onBackToHorses: () => void;
}

function getInvitationId(invitation: OwnerInvitation) {
  return invitation.invitationId ?? '';
}

function getErrorText(error: unknown, fallback: string): string {
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

export default function OwnerRegisterRace({ horses, onBackToHorses }: OwnerRegisterRaceProps) {
  const [formValues, setFormValues] = useState(emptyInvitationForm());
  const [invitations, setInvitations] = useState<OwnerInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actingId, setActingId] = useState<string | number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getOwnerInvitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorText(err, 'Không thể tải danh sách lời mời jockey.'));
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setError('');
    setMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!formValues.tournamentId || !formValues.horseId || !formValues.jockeyId) {
      setError('Vui lòng nhập Tournament ID, chọn ngựa và nhập Jockey ID.');
      return;
    }

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
      await loadInvitations();
    } catch (err) {
      setError(getErrorText(err, 'Gửi lời mời jockey thất bại.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancel(invitation: OwnerInvitation) {
    const invitationId = getInvitationId(invitation);
    if (!invitationId) return;

    setActingId(invitationId);
    setError('');
    setMessage('');

    try {
      await cancelOwnerInvitation(invitationId);
      setMessage('Đã hủy lời mời jockey.');
      await loadInvitations();
    } catch (err) {
      setError(getErrorText(err, 'Hủy lời mời thất bại.'));
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className="owner-stack">
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <form className="owner-panel owner-form" onSubmit={handleSubmit}>
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Registration</p>
            <h2>Gửi lời mời jockey đăng ký giải đấu</h2>
            <p>Owner nhập Tournament ID, chọn ngựa của mình và nhập Jockey ID để tạo registration PENDING_JOCKEY.</p>
          </div>
          <button className="outline-button" type="button" onClick={onBackToHorses}>Quay lại ngựa</button>
        </div>

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerTournamentId">Tournament ID <span className="required">*</span></label>
            <input
              className="input"
              id="ownerTournamentId"
              name="tournamentId"
              type="number"
              min="1"
              value={formValues.tournamentId}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ownerHorseId">Ngựa <span className="required">*</span></label>
            <select
              className="input"
              id="ownerHorseId"
              name="horseId"
              value={formValues.horseId}
              onChange={handleChange}
              disabled={isSaving}
            >
              <option value="">Chọn ngựa</option>
              {horses.map((horse) => {
                const horseId = getHorseId(horse);
                return <option key={horseId} value={horseId}>{getHorseName(horse) || `Horse ${horseId}`}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="owner-form-row">
          <div>
            <label className="field-label" htmlFor="ownerJockeyId">Jockey ID <span className="required">*</span></label>
            <input
              className="input"
              id="ownerJockeyId"
              name="jockeyId"
              type="number"
              min="1"
              value={formValues.jockeyId}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ownerExpiredAt">Hạn phản hồi lời mời</label>
            <input
              className="input"
              id="ownerExpiredAt"
              name="expiredAt"
              type="datetime-local"
              value={formValues.expiredAt}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>
        </div>

        <label className="field-label" htmlFor="ownerInviteMessage">Lời nhắn</label>
        <textarea
          className="input textarea-input"
          id="ownerInviteMessage"
          name="message"
          rows={3}
          value={formValues.message}
          onChange={handleChange}
          disabled={isSaving}
          placeholder="Ví dụ: Mời bạn tham gia giải đấu cùng ngựa của tôi."
        />

        <div className="admin-form-actions tournament-modal-actions">
          <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Đang gửi...' : 'Gửi lời mời'}</button>
          <button className="outline-button" type="button" onClick={loadInvitations} disabled={isLoading || isSaving}>{isLoading ? 'Đang tải...' : 'Làm mới'}</button>
        </div>
      </form>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <h2>Lời mời đã gửi</h2>
            <p>Theo dõi trạng thái invitation và registration.</p>
          </div>
          <span className="owner-count-pill">{invitations.length} lời mời</span>
        </div>

        {isLoading ? (
          <p className="table-empty">Đang tải lời mời...</p>
        ) : invitations.length === 0 ? (
          <p className="table-empty">Chưa có lời mời jockey nào.</p>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Giải đấu</th>
                  <th>Ngựa</th>
                  <th>Jockey</th>
                  <th>Hết hạn</th>
                  <th>Invitation</th>
                  <th>Registration</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const invitationId = getInvitationId(invitation);
                  const canCancel = String(invitation.status || '').toUpperCase() === 'PENDING';
                  return (
                    <tr key={invitationId || `${invitation.tournamentId}-${invitation.jockeyId}`}>
                      <td>{invitationId || 'N/A'}</td>
                      <td>{invitation.tournamentName || invitation.tournamentId || 'N/A'}</td>
                      <td>{invitation.horseName || invitation.horseId || 'N/A'}</td>
                      <td>{invitation.jockeyName || invitation.jockeyId || 'N/A'}</td>
                      <td>{formatDate(invitation.expiredAt)}</td>
                      <td><span className={`status-badge ${String(invitation.status || '').toLowerCase()}`}>{invitation.status || 'N/A'}</span></td>
                      <td><span className={`status-badge ${String(invitation.registrationStatus || '').toLowerCase()}`}>{invitation.registrationStatus || 'N/A'}</span></td>
                      <td>
                        <div className="table-actions">
                          <button type="button" onClick={() => handleCancel(invitation)} disabled={!canCancel || actingId === invitationId}>Hủy</button>
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
    </section>
  );
}
