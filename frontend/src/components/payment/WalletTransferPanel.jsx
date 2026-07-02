import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Banknote, Check, CircleDollarSign, Copy, CreditCard, ExternalLink, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { getUserRole } from '../../lib';
import { createWalletDeposit, getMyWallet } from '../../services/walletService';

const ALLOWED_ROLES = new Set(['JOCKEY', 'SPECTATOR']);
const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];
const VNPAY_TEST_CARD = [
  ['Ngan hang', 'NCB'],
  ['So the', '9704198526191432198'],
  ['Ten chu the', 'NGUYEN VAN A'],
  ['Ngay phat hanh', '07/15'],
  ['Mat khau OTP', '123456']
];

function formatVnd(value) {
  const number = Number(value || 0);
  return Number.isFinite(number)
    ? `VND ${number.toLocaleString('vi-VN')}`
    : 'VND 0';
}

function normalizeAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : 0;
}

export default function WalletTransferPanel({ currentUser, role: roleOverride }) {
  const role = String(roleOverride || getUserRole(currentUser) || '').toUpperCase();
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('200000');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [paymentSession, setPaymentSession] = useState(null);
  const [copiedValue, setCopiedValue] = useState('');

  const amountValue = useMemo(() => normalizeAmount(amount), [amount]);
  const canSubmit = ALLOWED_ROLES.has(role) && amountValue > 0 && !submitting;

  async function loadWallet() {
    if (!ALLOWED_ROLES.has(role)) return;
    setLoading(true);
    setError('');
    try {
      setWallet(await getMyWallet());
    } catch (err) {
      setError(err.message || 'Khong the tai thong tin vi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
  }, [role]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!ALLOWED_ROLES.has(role)) {
      setError('Chi Jockey va Spectator duoc su dung chuc nang nay.');
      return;
    }

    if (amountValue <= 0) {
      setError('So tien phai lon hon 0.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createWalletDeposit(amountValue);
      const paymentUrl = result?.paymentUrl || result?.paymentTransaction?.payUrl;
      if (paymentUrl) {
        setPaymentSession({
          paymentUrl,
          amount: amountValue,
          txnRef: result?.paymentTransaction?.txnRef,
          status: result?.paymentTransaction?.status,
          walletId: result?.wallet?.walletId
        });
        setMessage('Da tao link VNPAY. Kiem tra thong tin roi bam Mo cong VNPAY.');
      } else {
        setError('Giao dich da tao nhung khong co duong dan thanh toan.');
      }
    } catch (err) {
      setError(err.message || 'Khong the tao giao dich chuyen tien.');
    } finally {
      setSubmitting(false);
    }
  }

  function openVnpay() {
    if (paymentSession?.paymentUrl) {
      window.location.assign(paymentSession.paymentUrl);
    }
  }

  function resetPaymentSession() {
    setPaymentSession(null);
    setMessage('');
    setError('');
  }

  async function copyTestValue(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(''), 1400);
    } catch {
      setCopiedValue('');
    }
  }

  if (!ALLOWED_ROLES.has(role)) {
    return (
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Wallet access</p>
            <h2>Khong co quyen truy cap</h2>
            <p>Chuc nang chuyen tien chi danh cho Jockey va Spectator.</p>
          </div>
          <ShieldCheck size={24} />
        </div>
      </section>
    );
  }

  return (
    <section className="owner-stack">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="owner-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">Wallet transfer</p>
              <h2>Chuyen tien vao vi</h2>
              <p>Nap tien an toan qua VNPAY cho tai khoan {role === 'JOCKEY' ? 'Jockey' : 'Spectator'}.</p>
            </div>
            <button className="outline-button compact-button" type="button" onClick={loadWallet} disabled={loading}>
              <RefreshCw size={15} /> {loading ? 'Dang tai' : 'Tai lai'}
            </button>
          </div>

          {error && <div className="admin-alert error" role="alert">{error}</div>}
          {message && <div className="admin-alert success" role="status">{message}</div>}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
              <span className="flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Wallet size={15} /> Balance</span>
              <strong className="mt-2 block text-xl font-black text-brown-900">{formatVnd(wallet?.balance)}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
              <span className="flex items-center gap-2 text-xs font-black uppercase text-slate-500"><ShieldCheck size={15} /> Available</span>
              <strong className="mt-2 block text-xl font-black text-emerald-800">{formatVnd(wallet?.availableBalance)}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
              <span className="flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Banknote size={15} /> Locked</span>
              <strong className="mt-2 block text-xl font-black text-slate-700">{formatVnd(wallet?.lockedBalance)}</strong>
            </div>
          </div>

          {paymentSession && (
            <section className="mt-5 rounded-lg border border-emerald-700/20 bg-emerald-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-emerald-700">VNPAY link ready</p>
                  <h3 className="mt-1 text-xl font-black text-brown-900">Giao dich da san sang</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Kiem tra so tien, sau do mo cong VNPAY de thanh toan. Sau khi thanh toan, VNPAY se quay ve trang ket qua.
                  </p>
                </div>
                <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-emerald-800">
                  {paymentSession.status || 'PENDING'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/85 p-3">
                  <span className="text-[11px] font-black uppercase text-slate-500">So tien</span>
                  <strong className="mt-1 block text-brown-900">{formatVnd(paymentSession.amount)}</strong>
                </div>
                <div className="rounded-lg bg-white/85 p-3">
                  <span className="text-[11px] font-black uppercase text-slate-500">Wallet</span>
                  <strong className="mt-1 block text-brown-900">{paymentSession.walletId || 'N/A'}</strong>
                </div>
                <div className="rounded-lg bg-white/85 p-3">
                  <span className="text-[11px] font-black uppercase text-slate-500">Txn Ref</span>
                  <strong className="mt-1 block break-all text-brown-900">{paymentSession.txnRef || 'N/A'}</strong>
                </div>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button className="outline-button compact-button" type="button" onClick={resetPaymentSession}>
                  Tao giao dich khac
                </button>
                <button className="primary-button compact-button" type="button" onClick={openVnpay}>
                  Mo cong VNPAY <ExternalLink size={15} />
                </button>
              </div>
            </section>
          )}

          <form className="mt-5 grid gap-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-black uppercase text-slate-500" htmlFor="wallet-transfer-amount">So tien</label>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-lg border border-brown-700/15 bg-white px-4 focus-within:border-gold-400">
                <CircleDollarSign size={18} className="text-brown-500" />
                <input
                  id="wallet-transfer-amount"
                  className="min-w-0 flex-1 bg-transparent py-3 text-lg font-black text-brown-900 outline-none"
                  min="1000"
                  step="1000"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Nhap so tien"
                />
                <span className="text-sm font-black text-slate-500">VND</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <button
                  className={amountValue === quickAmount ? 'primary-button compact-button' : 'outline-button compact-button'}
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(String(quickAmount))}
                >
                  {formatVnd(quickAmount)}
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-brown-700/10 bg-cream-200/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase text-slate-500">Thanh toan qua</span>
                  <strong className="mt-1 flex items-center gap-2 text-brown-900"><CreditCard size={17} /> VNPAY</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase text-slate-500">Tong tien</span>
                  <strong className="mt-1 block text-brown-900">{formatVnd(amountValue)}</strong>
                </div>
              </div>
            </div>

            <button className="primary-button owner-hero-action justify-center" type="submit" disabled={!canSubmit}>
              {submitting ? 'Dang tao giao dich...' : paymentSession ? 'Tao lai link VNPAY' : 'Chuyen sang VNPAY'} <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <aside className="owner-panel compact-panel">
          <div className="owner-panel-header">
            <div>
              <p className="eyebrow">Security</p>
              <h2>Quy trinh giao dich</h2>
              <p>Giao dich duoc ghi nhan sau khi VNPAY tra ket qua thanh cong.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ['1', 'Nhap so tien va kiem tra thong tin vi.'],
              ['2', 'He thong tao giao dich VNPAY voi trang thai pending.'],
              ['3', 'Sau khi thanh toan thanh cong, so du vi duoc cap nhat.']
            ].map(([step, text]) => (
              <div className="flex gap-3 rounded-lg border border-brown-700/10 bg-white/75 p-4" key={step}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brown-900 text-sm font-black text-gold-400">{step}</span>
                <p className="text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-gold-400/35 bg-gold-400/10 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-brown-700">
                <CreditCard size={18} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-brown-500">VNPAY sandbox</p>
                <h3 className="mt-1 text-lg font-black text-brown-900">Thong tin the test</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Dung cac thong tin nay tren cong VNPAY sandbox.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {VNPAY_TEST_CARD.map(([label, value]) => (
                <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2" key={label}>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-black uppercase text-slate-500">{label}</span>
                    <strong className="mt-0.5 block break-all text-sm text-brown-900">{value}</strong>
                  </div>
                  <button
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 text-brown-700 transition hover:border-gold-400 hover:bg-gold-400/15"
                    type="button"
                    onClick={() => copyTestValue(value)}
                    aria-label={`Copy ${label}`}
                    title={`Copy ${label}`}
                  >
                    {copiedValue === value ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </section>
  );
}
