import { useEffect, useState } from 'react';
import { confirmVnpayReturn } from '../../services/paymentService';

function getStatusText(result) {
  if (!result) return 'Dang xac nhan thanh toan...';
  if (!result.validSignature) return 'Chu ky VNPAY khong hop le.';
  if (result.success) return 'Thanh toan thanh cong.';
  return result.message || 'Thanh toan khong thanh cong.';
}

export default function VnpayReturnPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function confirmPayment() {
      try {
        const data = await confirmVnpayReturn(window.location.search);
        if (!ignore) {
          setResult(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Khong the xac nhan thanh toan.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    confirmPayment();

    return () => {
      ignore = true;
    };
  }, []);

  const success = Boolean(result?.success);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">VNPAY</p>
        <h1>Ket qua thanh toan</h1>

        {loading && <div className="admin-alert" role="status">Dang xac nhan thanh toan...</div>}
        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {!loading && !error && (
          <div className={success ? 'admin-alert success' : 'admin-alert error'} role="status">
            {getStatusText(result)}
          </div>
        )}

        {result && (
          <div className="detail-grid">
            <span>Ma giao dich</span>
            <strong>{result.txnRef || 'N/A'}</strong>
            <span>Registration</span>
            <strong>{result.registrationId || 'N/A'}</strong>
            <span>Payment Status</span>
            <strong>{result.registrationPaymentStatus || 'N/A'}</strong>
            <span>Response Code</span>
            <strong>{result.responseCode || 'N/A'}</strong>
          </div>
        )}

        <div className="admin-form-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              window.location.href = '/owner/dashboard';
            }}
          >
            Quay ve Owner Dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
