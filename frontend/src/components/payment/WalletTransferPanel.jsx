import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CircleDollarSign, CreditCard, RefreshCw, ShieldCheck, Wallet, X } from 'lucide-react';
import { getUserRole } from '../../lib';
import { confirmVnpayReturn } from '../../services/paymentService';
import { createWalletDeposit, getMyWallet } from '../../services/walletService';

const ALLOWED_ROLES = new Set(['ADMIN', 'OWNER', 'JOCKEY', 'SPECTATOR']);
const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];
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
  const [notice, setNotice] = useState(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  const amountValue = useMemo(() => normalizeAmount(amount), [amount]);
  const canSubmit = ALLOWED_ROLES.has(role) && amountValue > 0 && !submitting;

async function loadWallet() {
    if (!ALLOWED_ROLES.has(role)) return;
    setLoading(true);
    setError('');
    try {
      setWallet(await getMyWallet());
    } catch (err) {
      setError(err.message || 'Unable to load wallet information.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
  }, [role]);

  function replaceWalletUrl() {
    window.history.replaceState(null, '', '/dashboard?section=wallet');
  }

  useEffect(() => {
    let ignore = false;

    async function syncVnpayReturn() {
      const params = new URLSearchParams(window.location.search);
      const hasVnpayParams = params.has('vnp_TxnRef') || params.has('vnp_SecureHash');
      const topupStatus = params.get('topup');

      if (hasVnpayParams) {
        try {
          const result = await confirmVnpayReturn(window.location.search);
          if (ignore) return;

          const nextStatus = result?.success ? 'success' : 'failed';
          setNotice({
            type: result?.success ? 'success' : 'error',
            text: result?.success ? 'Top-up successful.' : 'Top-up failed.'
          });

          if (result?.success) {
            loadWallet();
          }

          replaceWalletUrl();
        } catch {
          if (ignore) return;

          setNotice({ type: 'error', text: 'Top-up failed.' });
          replaceWalletUrl();
        }
        return;
      }

      if (topupStatus === 'success') {
        setNotice({ type: 'success', text: 'Top-up successful.' });
        loadWallet();
        replaceWalletUrl();
      } else if (topupStatus === 'failed') {
        setNotice({ type: 'error', text: 'Top-up failed.' });
        replaceWalletUrl();
      }
    }

    syncVnpayReturn();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!ALLOWED_ROLES.has(role)) {
      setError('This account cannot use wallet top-ups.');
      return;
    }

    if (amountValue <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createWalletDeposit(amountValue);
      const paymentUrl = result?.paymentUrl || result?.paymentTransaction?.payUrl;
      if (paymentUrl) {
        window.location.assign(paymentUrl);
      } else {
        setError('The top-up transaction was created, but no payment URL was returned.');
      }
    } catch (err) {
      setError(err.message || 'Unable to create the top-up transaction.');
    } finally {
      setSubmitting(false);
    }
  }

  function openDepositDialog() {
    setIsDepositOpen(true);
    setError('');
    setNotice(null);
  }

  function closeDepositDialog() {
    if (submitting) return;
    setIsDepositOpen(false);
    setError('');
  }

  function handleRefreshWallet() {
    setNotice(null);
    replaceWalletUrl();
    loadWallet();
  }

  if (!ALLOWED_ROLES.has(role)) {
    return (
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Wallet access</p>
            <h2>Access denied</h2>
            <p>Wallet top-ups are not available for this account.</p>
          </div>
          <ShieldCheck size={24} />
        </div>
      </section>
    );
  }

  return (
    <section className="owner-stack">
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Wallet</p>
            <h2>Current balance</h2>
            <p>Track the wallet balance for this {role ? role.toLowerCase() : 'user'} account.</p>
          </div>
          <button className="outline-button compact-button inline-flex items-center justify-center gap-2" type="button" onClick={handleRefreshWallet} disabled={loading}>
            <RefreshCw size={15} /> {loading ? 'Loading' : 'Refresh'}
          </button>
        </div>

        {!isDepositOpen && error && <div className="admin-alert error" role="alert">{error}</div>}
        {!isDepositOpen && notice && <div className={`admin-alert ${notice.type}`} role="status">{notice.text}</div>}

        <div className="rounded-lg border border-brown-700/10 bg-white/75 p-5">
          <span className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
            <Wallet size={15} /> Balance
          </span>
          <strong className="mt-3 block text-3xl font-black text-brown-900">{formatVnd(wallet?.balance)}</strong>
        </div>

        <div className="mt-5 rounded-lg border border-brown-700/10 bg-cream-200/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-500">Top up</span>
              <strong className="mt-1 flex items-center gap-2 text-brown-900">
                <CreditCard size={17} /> VNPAY
              </strong>
            </div>
            <button className="primary-button compact-button inline-flex items-center justify-center gap-2" type="button" onClick={openDepositDialog}>
              Top up <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {isDepositOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brown-950/45 p-4">
          <form className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">Top up</p>
                <h3 className="mt-1 text-xl font-black text-brown-900">Enter top-up amount</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">Payment will be processed through VNPAY.</p>
              </div>
              <button
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 text-brown-700 transition hover:border-gold-400 hover:bg-gold-400/15"
                type="button"
                onClick={closeDepositDialog}
                aria-label="Close"
                title="Close"
                disabled={submitting}
              >
                <X size={16} />
              </button>
            </div>

            {error && <div className="admin-alert error mt-4" role="alert">{error}</div>}

            <div className="mt-5">
              <label className="text-xs font-black uppercase text-slate-500" htmlFor="wallet-transfer-amount">Amount</label>
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
                  placeholder="Enter amount"
                  autoFocus
                />
                <span className="text-sm font-black text-slate-500">VND</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <button
                  className={amountValue === quickAmount
                    ? 'primary-button compact-button inline-flex items-center justify-center'
                    : 'outline-button compact-button inline-flex items-center justify-center'}
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(String(quickAmount))}
                  disabled={submitting}
                >
                  {formatVnd(quickAmount)}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-brown-700/10 bg-cream-200/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase text-slate-500">Payment method</span>
                  <strong className="mt-1 flex items-center gap-2 text-brown-900"><CreditCard size={17} /> VNPAY</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase text-slate-500">Total</span>
                  <strong className="mt-1 block text-brown-900">{formatVnd(amountValue)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="outline-button compact-button inline-flex items-center justify-center" type="button" onClick={closeDepositDialog} disabled={submitting}>
                Cancel
              </button>
              <button className="primary-button compact-button inline-flex items-center justify-center gap-2" type="submit" disabled={!canSubmit}>
                {submitting ? 'Redirecting...' : 'Top up'} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
