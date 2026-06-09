import { useEffect, useState } from 'react';
import {
  AcceptedRegistration,
  confirmRegistration,
  getAcceptedRegistrations,
  rejectRegistration
} from '../../services/adminTournamentService';

function getRegistrationId(registration: AcceptedRegistration) {
  return registration.registrationId ?? registration.registrationID ?? registration.id ?? '';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminRegistrationReview() {
  const [registrations, setRegistrations] = useState<AcceptedRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, []);

  async function loadRegistrations() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getAcceptedRegistrations();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách đơn đăng ký.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReview(registration: AcceptedRegistration, action: 'confirm' | 'reject') {
    const registrationId = getRegistrationId(registration);
    if (!registrationId) return;

    setReviewingId(registrationId);
    setError('');
    setMessage('');

    try {
      if (action === 'confirm') {
        await confirmRegistration(registrationId);
        setRegistrations((current) =>
          current.map((item) =>
            getRegistrationId(item) === registrationId ? { ...item, status: 'CONFIRMED' } : item
          )
        );
        setMessage('Đã đồng ý đơn đăng ký.');
      } else {
        await rejectRegistration(registrationId);
        setRegistrations((current) =>
          current.map((item) =>
            getRegistrationId(item) === registrationId ? { ...item, status: 'REJECTED' } : item
          )
        );
        setMessage('Đã từ chối đơn đăng ký.');
      }
    } catch (err) {
      setError(getErrorMessage(err, action === 'confirm' ? 'Đồng ý đơn đăng ký thất bại.' : 'Từ chối đơn đăng ký thất bại.'));
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <>
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="admin-card user-table-card">
        <div className="admin-card-header">
          <div>
            <h2>Registration</h2>
            <p>Hiển thị các đơn đăng ký đang có trạng thái ACCEPTED.</p>
          </div>
          <button className="outline-button" type="button" onClick={loadRegistrations} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {isLoading ? (
          <p className="table-empty">Đang tải danh sách đơn đăng ký...</p>
        ) : registrations.length === 0 ? (
          <p className="table-empty">Không có đơn đăng ký nào cần duyệt.</p>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Giải đấu</th>
                  <th>Ngựa</th>
                  <th>Chủ ngựa</th>
                  <th>Jockey</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => {
                  const registrationId = getRegistrationId(registration);
                  const isReviewed = registration.status === 'CONFIRMED' || registration.status === 'REJECTED';

                  return (
                    <tr key={registrationId}>
                      <td>{registrationId}</td>
                      <td>{registration.tournamentName || registration.tournamentId || 'N/A'}</td>
                      <td>{registration.horseName || registration.horseId || 'N/A'}</td>
                      <td>{registration.ownerName || registration.ownerId || 'N/A'}</td>
                      <td>{registration.jockeyName || registration.jockeyId || 'N/A'}</td>
                      <td><span className={`status-badge ${String(registration.status || '').toLowerCase()}`}>{registration.status || 'N/A'}</span></td>
                      <td>
                        <div className="table-actions">
                          <button type="button" onClick={() => handleReview(registration, 'confirm')} disabled={reviewingId === registrationId || isReviewed}>
                            Đồng ý
                          </button>
                          <button className="danger-action" type="button" onClick={() => handleReview(registration, 'reject')} disabled={reviewingId === registrationId || isReviewed}>
                            Từ chối
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
    </>
  );
}
