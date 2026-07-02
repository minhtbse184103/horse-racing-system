import { useEffect, useState } from 'react';
import { confirmVnpayReturn } from '../../services/paymentService';

function getStatusText(result) {
  if (!result) return 'Đang xác nhận thanh toán...';
  if (!result.validSignature) return 'Chữ ký VNPAY không hợp lệ.';
  if (result.success) return 'Thanh toán thành công.';
  return result.message || 'Thanh toán không thành công.';
}

function getStatusDescription(result, hasVnpayParams) {
  if (!hasVnpayParams) {
    return 'Đường dẫn hiện tại không có dữ liệu trả về từ VNPAY. Vui lòng bắt đầu lại từ màn hình Chuyển tiền.';
  }

  if (!result) return '';

  if (!result.validSignature) {
    return 'Thông tin trả về không khớp với chữ ký bảo mật. Nguyên nhân thường gặp là sai Hash Secret, dùng link cũ, hoặc URL bị thiếu tham số.';
  }

  if (result.success) {
    return 'Giao dịch đã được VNPAY xác nhận. Số dư ví sẽ được cập nhật sau khi hệ thống xử lý kết quả.';
  }

  return 'Giao dịch chưa hoàn tất. Bạn có thể quay lại Dashboard và tạo giao dịch mới.';
}

function formatVnd(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? `VND ${number.toLocaleString('vi-VN')}` : 'Không có dữ liệu';
}

function displayValue(value) {
  return value === null || value === undefined || value === '' ? 'Không có dữ liệu' : value;
}

export default function VnpayReturnPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function confirmPayment() {
      const params = new URLSearchParams(window.location.search);
      const hasVnpayParams = params.has('vnp_TxnRef') || params.has('vnp_SecureHash');

      if (!hasVnpayParams) {
        setResult({
          validSignature: false,
          success: false,
          message: 'Thiếu tham số trả về từ VNPAY.'
        });
        setLoading(false);
        return;
      }

      try {
        const data = await confirmVnpayReturn(window.location.search);
        if (!ignore) {
          setResult(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Không thể xác nhận thanh toán.');
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
  const isWalletDeposit = Boolean(result?.walletId);
  const hasVnpayParams = new URLSearchParams(window.location.search).has('vnp_TxnRef')
    || new URLSearchParams(window.location.search).has('vnp_SecureHash');
  const shouldShowDetails = Boolean(result?.validSignature || result?.txnRef || result?.responseCode);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">VNPAY</p>
        <h1>Kết quả thanh toán</h1>

        {loading && <div className="admin-alert" role="status">Đang xác nhận thanh toán...</div>}
        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {!loading && !error && (
          <div className={success ? 'admin-alert success' : 'admin-alert error'} role="status">
            <strong>{getStatusText(result)}</strong>
            <p className="mt-2 text-sm font-semibold leading-6">
              {getStatusDescription(result, hasVnpayParams)}
            </p>
          </div>
        )}

        {!loading && !error && result && !result.validSignature && (
          <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-4 text-left">
            <p className="text-sm font-black uppercase text-danger">Cần kiểm tra</p>
            <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-600">
              <li>Đảm bảo backend đã restart sau khi cập nhật `vnpay.hash-secret`.</li>
              <li>Không mở lại link VNPAY cũ hoặc tự sửa tham số trên URL.</li>
              <li>Tạo lại giao dịch từ màn hình Chuyển tiền rồi thanh toán lại trên VNPAY sandbox.</li>
            </ul>
          </div>
        )}

        {result && shouldShowDetails && (
          <div className="detail-grid">
            <span>Loại giao dịch</span>
            <strong>{isWalletDeposit ? 'Nạp ví' : 'Phí đăng ký'}</strong>
            <span>Mã giao dịch</span>
            <strong>{displayValue(result.txnRef)}</strong>
            {isWalletDeposit ? (
              <>
                <span>Wallet</span>
                <strong>{displayValue(result.walletId)}</strong>
                <span>Số tiền</span>
                <strong>{formatVnd(result.amount)}</strong>
              </>
            ) : (
              <>
                <span>Registration</span>
                <strong>{displayValue(result.registrationId)}</strong>
                <span>Payment Status</span>
                <strong>{displayValue(result.registrationPaymentStatus)}</strong>
              </>
            )}
            <span>Response Code</span>
            <strong>{displayValue(result.responseCode)}</strong>
          </div>
        )}

        <div className="admin-form-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              window.location.href = '/dashboard';
            }}
          >
            Quay về Dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
