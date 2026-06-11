import { useEffect, useState } from 'react';
import { AcceptedRegistration, confirmRegistration, getAcceptedRegistrations, getRegistrationHistory, rejectRegistration } from '../../services/adminTournamentService';

function getRegistrationId(registration: AcceptedRegistration) {
  return registration.registrationId ?? registration.registrationID ?? registration.id ?? '';
}
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message || fallback : fallback;
}
function statusClass(status?: string) {
  return String(status || 'unknown').toLowerCase().replace(/\s+/g, '_');
}
function formatDateTime(value?: string) {
  if (!value) return 'N/A';
  return String(value).replace('T', ' ').slice(0, 16);
}

export default function AdminRegistrationReview() {
  const [acceptedRegistrations, setAcceptedRegistrations] = useState<AcceptedRegistration[]>([]);
  const [historyRegistrations, setHistoryRegistrations] = useState<AcceptedRegistration[]>([]);
  const [isLoadingAccepted, setIsLoadingAccepted] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadRegistrations(); }, []);

  async function loadRegistrations() {
    await Promise.all([loadAcceptedRegistrations(), loadHistoryRegistrations()]);
  }
  async function loadAcceptedRegistrations() {
    setIsLoadingAccepted(true); setError('');
    try { const data = await getAcceptedRegistrations(); setAcceptedRegistrations(Array.isArray(data) ? data : []); }
    catch (err) { setError(getErrorMessage(err, 'Không thể tải danh sách đơn ACCEPTED.')); }
    finally { setIsLoadingAccepted(false); }
  }
  async function loadHistoryRegistrations() {
    setIsLoadingHistory(true);
    try { const data = await getRegistrationHistory(); setHistoryRegistrations(Array.isArray(data) ? data : []); }
    catch (err) { setError(getErrorMessage(err, 'Không thể tải lịch sử registration.')); }
    finally { setIsLoadingHistory(false); }
  }
  async function handleReview(registration: AcceptedRegistration, action: 'confirm' | 'reject') {
    const registrationId = getRegistrationId(registration); if (!registrationId) return;
    setReviewingId(registrationId); setError(''); setMessage('');
    try {
      if (action === 'confirm') { await confirmRegistration(registrationId); setMessage('Đã đồng ý đơn đăng ký.'); }
      else { await rejectRegistration(registrationId); setMessage('Đã từ chối đơn đăng ký.'); }
      await loadRegistrations();
    } catch (err) { setError(getErrorMessage(err, action === 'confirm' ? 'Đồng ý đơn đăng ký thất bại.' : 'Từ chối đơn đăng ký thất bại.')); }
    finally { setReviewingId(null); }
  }

  function renderRegistrationTable(registrations: AcceptedRegistration[], showActions: boolean) {
    return (
      <div className="table-wrapper"><table className="user-table"><thead><tr>
        <th>ID</th><th>Giải đấu</th><th>Ngựa</th><th>Chủ ngựa</th><th>Jockey</th><th>Trạng thái</th><th>Created</th><th>Updated</th>{showActions && <th>Thao tác</th>}
      </tr></thead><tbody>{registrations.map((registration) => {
        const registrationId = getRegistrationId(registration);
        const isReviewed = ['CONFIRMED', 'REJECTED'].includes(String(registration.status || '').toUpperCase());
        return <tr key={String(registrationId)}>
          <td>{registrationId}</td><td>{registration.tournamentName || registration.tournamentId || 'N/A'}</td><td>{registration.horseName || registration.horseId || 'N/A'}</td><td>{registration.ownerName || registration.ownerId || 'N/A'}</td><td>{registration.jockeyName || registration.jockeyId || 'N/A'}</td><td><span className={`status-badge ${statusClass(registration.status)}`}>{registration.status || 'N/A'}</span></td><td>{formatDateTime(registration.createdAt)}</td><td>{formatDateTime(registration.updatedAt)}</td>
          {showActions && <td><div className="table-actions"><button type="button" onClick={() => handleReview(registration, 'confirm')} disabled={reviewingId === registrationId || isReviewed}>Đồng ý</button><button className="danger-action" type="button" onClick={() => handleReview(registration, 'reject')} disabled={reviewingId === registrationId || isReviewed}>Từ chối</button></div></td>}
        </tr>;
      })}</tbody></table></div>
    );
  }

  return (<>
    {error && <div className="admin-alert error" role="alert">{error}</div>}
    {message && <div className="admin-alert success" role="status">{message}</div>}
    <section className="admin-card user-table-card"><div className="admin-card-header"><div><h2>Registration cần duyệt</h2><p>Dữ liệu từ <code>GET /api/admin/registrations/accepted</code>.</p></div><button className="outline-button" type="button" onClick={loadRegistrations} disabled={isLoadingAccepted || isLoadingHistory}>{isLoadingAccepted ? 'Đang tải...' : 'Làm mới'}</button></div>{isLoadingAccepted ? <p className="table-empty">Đang tải danh sách đơn đăng ký...</p> : acceptedRegistrations.length === 0 ? <p className="table-empty">Không có đơn đăng ký ACCEPTED nào cần duyệt.</p> : renderRegistrationTable(acceptedRegistrations, true)}</section>
    <section className="admin-card user-table-card history-card"><div className="admin-card-header"><div><h2>Lịch sử registration</h2><p>Dữ liệu từ <code>GET /api/admin/registrations/history</code>.</p></div><button className="outline-button" type="button" onClick={loadHistoryRegistrations} disabled={isLoadingHistory}>{isLoadingHistory ? 'Đang tải...' : 'Làm mới lịch sử'}</button></div>{isLoadingHistory ? <p className="table-empty">Đang tải lịch sử...</p> : historyRegistrations.length === 0 ? <p className="table-empty">Chưa có lịch sử registration.</p> : renderRegistrationTable(historyRegistrations, false)}</section>
  </>);
}
