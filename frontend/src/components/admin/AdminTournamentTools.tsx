import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from 'react';
import {
  createTournament,
  getTournamentConditions,
  getTournaments,
  openTournamentRegistration,
  Tournament,
  TournamentCondition
} from '../../services/adminTournamentService';

interface TournamentFormValues {
  tournamentName: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  minParticipants: string;
  maxParticipants: string;
  conditionId: string;
}

function emptyTournamentForm(): TournamentFormValues {
  return {
    tournamentName: '',
    location: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    minParticipants: '2',
    maxParticipants: '8',
    conditionId: ''
  };
}

function getConditionId(condition: TournamentCondition) {
  return condition.conditionId ?? condition.conditionID ?? condition.id ?? '';
}

function getConditionLabel(condition: TournamentCondition) {
  return condition.conditionName || condition.name || `Condition ${getConditionId(condition)}`;
}

function getTournamentId(tournament: Tournament) {
  return tournament.tournamentId ?? tournament.tournamentID ?? tournament.id ?? '';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeStatus(status?: string) {
  return String(status || '').toUpperCase();
}

function canOpenRegistration(tournament: Tournament) {
  return normalizeStatus(tournament.status) === 'DRAFT';
}

function getOpenRegistrationButtonLabel(tournament: Tournament, openingTournamentId: number | string | null) {
  const tournamentId = getTournamentId(tournament);
  const status = normalizeStatus(tournament.status);

  if (openingTournamentId === tournamentId) return 'Đang mở...';
  if (status === 'OPEN_FOR_REGISTRATION' || status === 'OPENFORREGISTRATION') return 'Đã mở đăng ký';
  if (status === 'CANCELLED') return 'Đã hủy';
  if (status && status !== 'DRAFT') return 'Không khả dụng';
  return 'Mở đăng ký';
}

export default function AdminTournamentTools() {
  const [conditions, setConditions] = useState<TournamentCondition[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [formValues, setFormValues] = useState(emptyTournamentForm());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingConditions, setIsLoadingConditions] = useState(false);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openingTournamentId, setOpeningTournamentId] = useState<number | string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadConditions();
    loadTournaments();
  }, []);

  async function loadConditions() {
    setIsLoadingConditions(true);
    setError('');

    try {
      const data = await getTournamentConditions();
      setConditions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách điều kiện giải đấu.'));
    } finally {
      setIsLoadingConditions(false);
    }
  }

  async function loadTournaments() {
    setIsLoadingTournaments(true);
    setError('');

    try {
      const data = await getTournaments();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách giải đấu.'));
    } finally {
      setIsLoadingTournaments(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setError('');
    setMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await createTournament({
        tournamentName: formValues.tournamentName,
        location: formValues.location,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        registrationDeadline: formValues.registrationDeadline,
        minParticipants: Number(formValues.minParticipants),
        maxParticipants: Number(formValues.maxParticipants),
        conditionId: formValues.conditionId ? Number(formValues.conditionId) : null
      });
      setFormValues(emptyTournamentForm());
      setIsCreateOpen(false);
      setMessage('Tạo giải đấu thành công.');
      await loadTournaments();
    } catch (err) {
      setError(getErrorMessage(err, 'Tạo giải đấu thất bại.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenRegistration(tournament: Tournament) {
    const tournamentId = getTournamentId(tournament);
    if (!tournamentId) return;

    setOpeningTournamentId(tournamentId);
    setError('');
    setMessage('');

    try {
      const updatedTournament = await openTournamentRegistration(tournamentId);
      setTournaments((current) =>
        current.map((item) => (getTournamentId(item) === tournamentId ? { ...item, ...updatedTournament } : item))
      );
      setMessage('Đã mở đăng ký giải đấu.');
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể mở đăng ký giải đấu.'));
    } finally {
      setOpeningTournamentId(null);
    }
  }

  function closeModal() {
    if (!isSaving) setIsCreateOpen(false);
  }

  function stopModalClick(event: MouseEvent<HTMLFormElement>) {
    event.stopPropagation();
  }

  return (
    <>
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="admin-card user-table-card">
        <div className="admin-card-header">
          <div>
            <h2>Giải đấu</h2>
            <p>Những giải đấu hiện đang có trong database.</p>
          </div>
          <div className="tournament-card-actions">
            <button className="outline-button" type="button" onClick={loadTournaments} disabled={isLoadingTournaments}>
              {isLoadingTournaments ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button className="primary-button tournament-create-button" type="button" onClick={() => setIsCreateOpen(true)}>
              Tạo giải đấu
            </button>
          </div>
        </div>

        {isLoadingTournaments ? (
          <p className="table-empty">Đang tải danh sách giải đấu...</p>
        ) : tournaments.length === 0 ? (
          <p className="table-empty">Chưa có giải đấu nào.</p>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên giải đấu</th>
                  <th>Địa điểm</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => {
                  const tournamentId = getTournamentId(tournament);
                  const isOpening = openingTournamentId === tournamentId;

                  return (
                    <tr key={tournamentId || tournament.tournamentName}>
                      <td>{tournamentId || 'N/A'}</td>
                      <td>{tournament.tournamentName || 'N/A'}</td>
                      <td>{tournament.location || 'N/A'}</td>
                      <td>{tournament.startDate || 'N/A'}</td>
                      <td>{tournament.endDate || 'N/A'}</td>
                      <td><span className={`status-badge ${String(tournament.status || '').toLowerCase()}`}>{tournament.status || 'N/A'}</span></td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => handleOpenRegistration(tournament)}
                            disabled={isOpening || !canOpenRegistration(tournament)}
                          >
                            {getOpenRegistrationButtonLabel(tournament, openingTournamentId)}
                          </button>
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

      {isCreateOpen && (
        <div className="admin-modal-overlay" role="presentation" onMouseDown={closeModal}>
          <form className="admin-card admin-form admin-modal" onSubmit={handleSubmit} onMouseDown={stopModalClick}>
            <div className="admin-card-header">
              <div>
                <h2>Tạo giải đấu</h2>
                <p>Nhập thông tin giải đấu mới và lưu vào database.</p>
              </div>
              <button className="outline-button" type="button" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>
                Đóng
              </button>
            </div>

            <label className="field-label" htmlFor="tournamentName">Tên giải đấu</label>
            <input className="input" id="tournamentName" name="tournamentName" type="text" value={formValues.tournamentName} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="tournamentLocation">Địa điểm</label>
            <input className="input" id="tournamentLocation" name="location" type="text" value={formValues.location} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="tournamentStartDate">Ngày bắt đầu</label>
            <input className="input" id="tournamentStartDate" name="startDate" type="date" value={formValues.startDate} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="tournamentEndDate">Ngày kết thúc</label>
            <input className="input" id="tournamentEndDate" name="endDate" type="date" value={formValues.endDate} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="registrationDeadline">Hạn đăng ký</label>
            <input className="input" id="registrationDeadline" name="registrationDeadline" type="date" value={formValues.registrationDeadline} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="minParticipants">Số người tối thiểu</label>
            <input className="input" id="minParticipants" min="1" name="minParticipants" type="number" value={formValues.minParticipants} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="maxParticipants">Số người tối đa</label>
            <input className="input" id="maxParticipants" min="1" name="maxParticipants" type="number" value={formValues.maxParticipants} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="conditionId">Điều kiện giải đấu</label>
            <select className="input" id="conditionId" name="conditionId" value={formValues.conditionId} onChange={handleChange} disabled={isSaving || isLoadingConditions}>
              <option value="">{isLoadingConditions ? 'Đang tải điều kiện...' : 'Không chọn'}</option>
              {conditions.map((condition) => {
                const conditionId = getConditionId(condition);
                return <option key={conditionId} value={conditionId}>{getConditionLabel(condition)}</option>;
              })}
            </select>

            <div className="admin-form-actions tournament-modal-actions">
              <button className="outline-button" type="button" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>
                Hủy
              </button>
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? 'Đang tạo...' : 'Tạo giải đấu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
