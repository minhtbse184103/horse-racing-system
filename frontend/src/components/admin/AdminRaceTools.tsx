import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from 'react';
import {
  createRace,
  getRaces,
  getTournamentRounds,
  getTournaments,
  Race,
  Tournament,
  TournamentRound
} from '../../services/adminTournamentService';

interface RaceFormValues {
  roundId: string;
  startTime: string;
  endTime: string;
  distance: string;
}

function emptyRaceForm(): RaceFormValues {
  return {
    roundId: '',
    startTime: '',
    endTime: '',
    distance: '1000'
  };
}

function formatDateTime(value?: string) {
  if (!value) return 'N/A';
  return String(value).replace('T', ' ');
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getTournamentId(tournament: Tournament) {
  return tournament.tournamentId ?? tournament.tournamentID ?? tournament.id ?? '';
}

function getRoundId(round: TournamentRound) {
  return round.roundId ?? round.roundID ?? round.id ?? '';
}

interface RoundOption {
  id: number | string;
  label: string;
}

export default function AdminRaceTools() {
  const [races, setRaces] = useState<Race[]>([]);
  const [roundOptions, setRoundOptions] = useState<RoundOption[]>([]);
  const [formValues, setFormValues] = useState(emptyRaceForm());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingRaces, setIsLoadingRaces] = useState(false);
  const [isLoadingRounds, setIsLoadingRounds] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRaces();
    loadRoundOptions();
  }, []);

  async function loadRaces() {
    setIsLoadingRaces(true);
    setError('');

    try {
      const data = await getRaces();
      setRaces(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách race.'));
    } finally {
      setIsLoadingRaces(false);
    }
  }

  async function loadRoundOptions() {
    setIsLoadingRounds(true);

    try {
      const tournaments = await getTournaments();
      const roundGroups = await Promise.all(
        (Array.isArray(tournaments) ? tournaments : []).map(async (tournament) => {
          const tournamentId = getTournamentId(tournament);
          if (!tournamentId) return [];

          const rounds = await getTournamentRounds(tournamentId);
          return (Array.isArray(rounds) ? rounds : []).map((round) => {
            const roundId = getRoundId(round);
            const tournamentName = tournament.tournamentName || `Tournament ${tournamentId}`;
            const roundName = round.roundName || `Round ${roundId}`;

            return {
              id: roundId,
              label: `${tournamentName} - ${roundName}`
            };
          });
        })
      );

      setRoundOptions(roundGroups.flat().filter((round) => round.id));
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách round.'));
    } finally {
      setIsLoadingRounds(false);
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
      await createRace({
        roundId: Number(formValues.roundId),
        startTime: formValues.startTime,
        endTime: formValues.endTime,
        distance: Number(formValues.distance)
      });
      setFormValues(emptyRaceForm());
      setIsCreateOpen(false);
      setMessage('Tạo race thành công.');
      await loadRaces();
    } catch (err) {
      setError(getErrorMessage(err, 'Tạo race thất bại.'));
    } finally {
      setIsSaving(false);
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

      <section className="admin-grid race-admin-grid">
        <section className="admin-card user-table-card">
          <div className="admin-card-header">
            <div>
              <h2>Race</h2>
              <p>Các race hiện đang có trong hệ thống.</p>
            </div>
            <div className="tournament-card-actions">
              <button className="outline-button" type="button" onClick={loadRaces} disabled={isLoadingRaces}>
                {isLoadingRaces ? 'Đang tải...' : 'Làm mới'}
              </button>
              <button className="primary-button tournament-create-button" type="button" onClick={() => setIsCreateOpen(true)}>
                Tạo race
              </button>
            </div>
          </div>

          {isLoadingRaces ? (
            <p className="table-empty">Đang tải danh sách race...</p>
          ) : races.length === 0 ? (
            <p className="table-empty">Chưa có race nào.</p>
          ) : (
            <div className="table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Round Name</th>
                    <th>Bắt đầu</th>
                    <th>Kết thúc</th>
                    <th>Cự ly</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((race) => (
                    <tr key={race.raceId ?? race.raceID ?? race.id}>
                      <td>{race.raceId ?? race.raceID ?? race.id ?? 'N/A'}</td>
                      <td>{race.raceName || 'N/A'}</td>
                      <td>{formatDateTime(race.startTime)}</td>
                      <td>{formatDateTime(race.endTime)}</td>
                      <td>{race.distance || 'N/A'}</td>
                      <td><span className={`status-badge ${String(race.status || '').toLowerCase()}`}>{race.status || 'N/A'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {isCreateOpen && (
        <div className="admin-modal-overlay" role="presentation" onMouseDown={closeModal}>
          <form className="admin-card admin-form admin-modal" onSubmit={handleSubmit} onMouseDown={stopModalClick}>
            <div className="admin-card-header">
              <div>
                <h2>Tạo race</h2>
                <p>Nhập thông tin race theo round đã có trong hệ thống.</p>
              </div>
              <button className="outline-button" type="button" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>
                Đóng
              </button>
            </div>

            <label className="field-label" htmlFor="raceRoundId">Round Name</label>
            <select className="input" id="raceRoundId" name="roundId" value={formValues.roundId} onChange={handleChange} disabled={isSaving || isLoadingRounds} required>
              <option value="">{isLoadingRounds ? 'Đang tải round...' : 'Chọn round'}</option>
              {roundOptions.map((round) => (
                <option key={round.id} value={round.id}>{round.label}</option>
              ))}
            </select>

            <label className="field-label" htmlFor="raceStartTime">Giờ bắt đầu</label>
            <input className="input" id="raceStartTime" name="startTime" type="datetime-local" value={formValues.startTime} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="raceEndTime">Giờ kết thúc</label>
            <input className="input" id="raceEndTime" name="endTime" type="datetime-local" value={formValues.endTime} onChange={handleChange} disabled={isSaving} required />

            <label className="field-label" htmlFor="raceDistance">Cự ly</label>
            <input className="input" id="raceDistance" min="1" name="distance" type="number" value={formValues.distance} onChange={handleChange} disabled={isSaving} required />

            <div className="admin-form-actions tournament-modal-actions">
              <button className="outline-button" type="button" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>
                Hủy
              </button>
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? 'Đang tạo...' : 'Tạo race'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
