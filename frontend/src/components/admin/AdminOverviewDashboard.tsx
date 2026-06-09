import { useEffect, useState } from 'react';
import { getRaces, getTournaments, Race, Tournament } from '../../services/adminTournamentService';

function normalizeStatus(status?: string) {
  return String(status || '').toUpperCase();
}

function isOpenForRegistration(status?: string) {
  const normalizedStatus = normalizeStatus(status);
  return normalizedStatus === 'OPEN_FOR_REGISTRATION' || normalizedStatus === 'OPENFORREGISTRATION';
}

function getTournamentId(tournament: Tournament) {
  return tournament.tournamentId ?? tournament.tournamentID ?? tournament.id ?? '';
}

function getRaceId(race: Race) {
  return race.raceId ?? race.raceID ?? race.id ?? '';
}

function formatDateTime(value?: string) {
  if (!value) return 'N/A';
  return String(value).replace('T', ' ');
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminOverviewDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    setIsLoading(true);
    setError('');

    try {
      const [tournamentData, raceData] = await Promise.all([getTournaments(), getRaces()]);
      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setRaces(Array.isArray(raceData) ? raceData : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu dashboard.'));
    } finally {
      setIsLoading(false);
    }
  }

  const openTournaments = tournaments.filter((tournament) => isOpenForRegistration(tournament.status)).length;
  const notOpenTournaments = Math.max(tournaments.length - openTournaments, 0);

  return (
    <>
      {error && <div className="admin-alert error" role="alert">{error}</div>}

      <section className="admin-stats admin-stats-three">
        <div><span>Tổng giải đấu</span><strong>{isLoading ? '...' : tournaments.length}</strong></div>
        <div><span>Đang mở đăng ký</span><strong>{isLoading ? '...' : openTournaments}</strong></div>
        <div><span>Chưa mở</span><strong>{isLoading ? '...' : notOpenTournaments}</strong></div>
      </section>

      <section className="admin-grid dashboard-overview-grid">
        <section className="admin-card user-table-card">
          <div className="admin-card-header">
            <div>
              <h2>Giải đấu</h2>
              <p>Các giải đấu trong mục quản lý giải đấu.</p>
            </div>
          </div>

          {isLoading ? (
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
                    <th>Ngày bắt đầu</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((tournament) => {
                    const tournamentId = getTournamentId(tournament);
                    return (
                      <tr key={tournamentId || tournament.tournamentName}>
                        <td>{tournamentId || 'N/A'}</td>
                        <td>{tournament.tournamentName || 'N/A'}</td>
                        <td>{tournament.startDate || 'N/A'}</td>
                        <td><span className={`status-badge ${String(tournament.status || '').toLowerCase()}`}>{tournament.status || 'N/A'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card user-table-card">
          <div className="admin-card-header">
            <div>
              <h2>Race</h2>
              <p>Các race hiện có trong hệ thống.</p>
            </div>
          </div>

          {isLoading ? (
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
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((race) => {
                    const raceId = getRaceId(race);
                    return (
                      <tr key={raceId || race.raceName}>
                        <td>{raceId || 'N/A'}</td>
                        <td>{race.raceName || 'N/A'}</td>
                        <td>{formatDateTime(race.startTime)}</td>
                        <td><span className={`status-badge ${String(race.status || '').toLowerCase()}`}>{race.status || 'N/A'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </>
  );
}
