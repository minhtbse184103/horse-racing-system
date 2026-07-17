import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CircleDollarSign, CreditCard, ExternalLink, RefreshCw, ShieldCheck, Wallet, X } from 'lucide-react';
import { getUserRole } from '../../lib';
import { useLanguage } from '../../context/LanguageContext';
import { confirmVnpayReturn } from '../../services/paymentService';
import { createWalletDeposit, getMyWallet } from '../../services/walletService';
import { createKycSession, getMyKyc } from '../../services/kycService';

const ALLOWED_ROLES = new Set(['SPECTATOR']);
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
  const { t } = useLanguage();
  const role = String(roleOverride || getUserRole(currentUser) || '').toUpperCase();
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('200000');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [kyc, setKyc] = useState(null);
  const [startingKyc, setStartingKyc] = useState(false);

  const amountValue = useMemo(() => normalizeAmount(amount), [amount]);
  const canSubmit = ALLOWED_ROLES.has(role) && amountValue > 0 && !submitting;

  async function loadWallet() {
    if (!ALLOWED_ROLES.has(role)) return;
    setLoading(true);
    setError('');
    try {
      const [walletResult, kycResult] = await Promise.allSettled([getMyWallet(), getMyKyc()]);
      setWallet(walletResult.status === 'fulfilled' ? walletResult.value : null);
      if (kycResult.status === 'fulfilled') setKyc(kycResult.value);
      if (walletResult.status === 'rejected' && kycResult.status === 'rejected') {
        throw walletResult.reason;
      }
    } catch (err) {
      setError(err.message || t('walletLoadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
  }, [role]);

  useEffect(() => {
    if (!ALLOWED_ROLES.has(role)) return undefined;
    if (window.location.pathname !== '/wallet/kyc/result') return undefined;
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const current = await getMyKyc();
        if (cancelled) return;
        setKyc(current);
        if (current?.status === 'VERIFIED') {
          await loadWallet();
          window.history.replaceState(null, '', '/dashboard?section=wallet');
          return;
        }
      } catch {
        // A later poll can recover from a transient callback race.
      }
      if (!cancelled && attempts < 15) window.setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [role]);

  async function handleStartKyc() {
    setStartingKyc(true);
    setError('');
    try {
      const session = await createKycSession();
      if (!session?.verificationUrl) throw new Error('Didit did not return a verification URL.');
      window.location.assign(session.verificationUrl);
    } catch (err) {
      setError(err.message || 'Cannot start Didit verification.');
      setStartingKyc(false);
    }
  }

  function replaceWalletUrl() {
    window.history.replaceState(null, '', '/dashboard?section=wallet');
  }

  useEffect(() => {
    if (!ALLOWED_ROLES.has(role)) return undefined;
    let ignore = false;

    async function syncVnpayReturn() {
      const params = new URLSearchParams(window.location.search);
      const hasVnpayParams = params.has('vnp_TxnRef') || params.has('vnp_SecureHash');
      const topupStatus = params.get('topup');

      if (hasVnpayParams) {
        try {
          const result = await confirmVnpayReturn(window.location.search);
          if (ignore) return;

          setNotice({
            type: result?.success ? 'success' : 'error',
            key: result?.success ? 'walletTopUpSuccessful' : 'walletTopUpFailed'
          });

          if (result?.success) {
            loadWallet();
          }

          replaceWalletUrl();
        } catch {
          if (ignore) return;

          setNotice({ type: 'error', key: 'walletTopUpFailed' });
          replaceWalletUrl();
        }
        return;
      }

      if (topupStatus === 'success') {
        setNotice({ type: 'success', key: 'walletTopUpSuccessful' });
        loadWallet();
        replaceWalletUrl();
      } else if (topupStatus === 'failed') {
        setNotice({ type: 'error', key: 'walletTopUpFailed' });
        replaceWalletUrl();
      }
    }

    syncVnpayReturn();

    return () => {
      ignore = true;
    };
  }, [role]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!ALLOWED_ROLES.has(role)) {
      setError(t('walletTopupsUnavailable'));
      return;
    }

    if (amountValue <= 0) {
      setError(t('walletAmountGreaterThanZero'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await createWalletDeposit(amountValue);
      const paymentUrl = result?.paymentUrl || result?.paymentTransaction?.payUrl;
      if (paymentUrl) {
        window.location.assign(paymentUrl);
      } else {
        setError(t('walletNoPaymentUrl'));
      }
    } catch (err) {
      setError(err.message || t('walletCreateTopUpError'));
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
            <p className="eyebrow">{t('walletAccess')}</p>
            <h2>{t('walletAccessDenied')}</h2>
            <p>{t('walletTopupsUnavailable')}</p>
          </div>
          <ShieldCheck size={24} />
        </div>
      </section>
    );
  }

  const roleTranslation = t(`role_${role}`);
  const roleLabel = roleTranslation === `role_${role}` ? t('walletGenericUser') : roleTranslation.toLowerCase();

  return (
    <section className="owner-stack">
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">{t('wallet')}</p>
            <h2>{t('walletCurrentBalance')}</h2>
            <p>{t('walletBalanceDescription', { role: role ? roleLabel : t('walletGenericUser') })}</p>
          </div>
          <button className="outline-button compact-button inline-flex items-center justify-center gap-2" type="button" onClick={handleRefreshWallet} disabled={loading}>
            <RefreshCw size={15} /> {loading ? t('loading') : t('refresh')}
          </button>
        </div>

        {!isDepositOpen && error && <div className="admin-alert error" role="alert">{error}</div>}
        {!isDepositOpen && notice && <div className={`admin-alert ${notice.type}`} role="status">{notice.key ? t(notice.key) : notice.text}</div>}

        {!wallet && (
          <div className="mb-5 border-y border-brown-700/10 bg-white/55 px-1 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
                  <ShieldCheck size={15} /> {t('walletIdentityVerification')}
                </span>
                <strong className="mt-2 block text-lg font-black text-brown-900">
                  {kyc?.status === 'VERIFIED' ? t('walletOpeningAfterKyc') : t('walletVerifyToOpen')}
                </strong>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {t('walletKycStatus', { status: t(`status_${String(kyc?.status || 'NOT_SUBMITTED').toUpperCase()}`) })}
                </p>
              </div>
              {kyc?.status !== 'VERIFIED' && (
                <button className="primary-button compact-button inline-flex items-center justify-center gap-2" type="button" onClick={handleStartKyc} disabled={startingKyc}>
                  {startingKyc ? t('walletStartingKyc') : t('walletVerifyWithDidit')} <ExternalLink size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-brown-700/10 bg-white/75 p-5">
          <span className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
            <Wallet size={15} /> {t('walletBalance')}
          </span>
          <strong className="mt-3 block text-3xl font-black text-brown-900">{formatVnd(wallet?.balance)}</strong>
        </div>

        <div className="mt-5 rounded-lg border border-brown-700/10 bg-cream-200/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-500">{t('walletTopUp')}</span>
              <strong className="mt-1 flex items-center gap-2 text-brown-900">
                <CreditCard size={17} /> VNPAY
              </strong>
            </div>
            <button className="primary-button compact-button inline-flex items-center justify-center gap-2" type="button" onClick={openDepositDialog} disabled={!wallet}>
              {t('walletTopUp')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {isDepositOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brown-950/45 p-4">
          <form className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">{t('walletTopUp')}</p>
                <h3 className="mt-1 text-xl font-black text-brown-900">{t('walletEnterTopUpAmount')}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{t('walletPaymentThroughProvider', { provider: 'VNPAY' })}</p>
              </div>
              <button
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 text-brown-700 transition hover:border-gold-400 hover:bg-gold-400/15"
                type="button"
                onClick={closeDepositDialog}
                aria-label={t('close')}
                title={t('close')}
                disabled={submitting}
              >
                <X size={16} />
              </button>
            </div>

            {error && <div className="admin-alert error mt-4" role="alert">{error}</div>}

            <div className="mt-5">
              <label className="text-xs font-black uppercase text-slate-500" htmlFor="wallet-transfer-amount">{t('walletAmount')}</label>
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
                  placeholder={t('walletEnterAmount')}
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
                  <span className="text-xs font-black uppercase text-slate-500">{t('walletPaymentMethod')}</span>
                  <strong className="mt-1 flex items-center gap-2 text-brown-900"><CreditCard size={17} /> VNPAY</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase text-slate-500">{t('walletTotal')}</span>
                  <strong className="mt-1 block text-brown-900">{formatVnd(amountValue)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="outline-button compact-button inline-flex items-center justify-center" type="button" onClick={closeDepositDialog} disabled={submitting}>
                {t('cancel')}
              </button>
              <button className="primary-button compact-button inline-flex items-center justify-center gap-2" type="submit" disabled={!canSubmit}>
                {submitting ? t('walletRedirecting') : t('walletTopUp')} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
