import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { formatDisplayLabel, formatNumber } from '../../../lib';
import { getAdminSystemWallet } from '../../../services/adminSystemWalletService';

function money(value) {
  return `${formatNumber(Number(value || 0))} VND`;
}

function dateTime(value) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function StatCard({ label, value, note, icon: Icon, tone = 'text-brown-500' }) {
  return (
    <div className="min-w-0 rounded-[26px] border border-brown-700/10 bg-white/85 p-5 shadow-[0_18px_44px_rgba(66,38,23,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            {label}
          </span>
          <strong className="mt-3 block break-words text-2xl font-black tracking-tight text-brown-950 sm:text-3xl">
            {value}
          </strong>
          {note && <p className="mt-2 text-sm font-semibold text-slate-500">{note}</p>}
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-brown-700/10 bg-cream-50 shadow-sm">
          <Icon className={tone} size={22} />
        </span>
      </div>
    </div>
  );
}

function TransactionRow({ transaction }) {
  return (
    <article className="grid min-w-0 gap-4 border-b border-brown-700/10 px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(12rem,1.2fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(13rem,1.2fr)] lg:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
            <ArrowUpRight size={16} />
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black text-brown-950">
              {formatDisplayLabel(transaction.transactionType)}
            </strong>
            <span className="text-xs font-semibold text-slate-500">
              {dateTime(transaction.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <span className="text-[0.65rem] font-black uppercase tracking-wide text-slate-500">
          Số tiền
        </span>
        <strong className="mt-1 block whitespace-nowrap text-base font-black text-emerald-700">
          + {money(transaction.amount)}
        </strong>
      </div>

      <div className="min-w-0">
        <span className="text-[0.65rem] font-black uppercase tracking-wide text-slate-500">
          Số dư sau
        </span>
        <strong className="mt-1 block whitespace-nowrap text-sm font-black text-brown-900">
          {money(transaction.balanceAfter)}
        </strong>
      </div>

      <div className="min-w-0">
        <span className="text-[0.65rem] font-black uppercase tracking-wide text-slate-500">
          Tham chiếu
        </span>
        <p className="mt-1 truncate text-sm font-extrabold text-brown-900" title={`${formatDisplayLabel(transaction.referenceType)} #${transaction.referenceId}`}>
          {formatDisplayLabel(transaction.referenceType)} #{transaction.referenceId}
        </p>
        <p className="truncate text-xs font-semibold text-slate-500" title={transaction.description || 'System fund transaction'}>
          {transaction.description || 'System fund transaction'}
        </p>
      </div>
    </article>
  );
}

export default function AdminSystemWallet({ onOpenMoneyTransactions }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadWallet = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await getAdminSystemWallet();
      setWallet(data);
    } catch (err) {
      setError(err?.message || 'Không thể tải System Wallet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const transactions = useMemo(() => wallet?.transactions || [], [wallet]);

  return (
    <section className="min-w-0 max-w-full space-y-6">
      <div className="min-w-0 overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#fffaf2_0%,#f6e7d2_55%,#fff7eb_100%)] shadow-[0_22px_70px_rgba(66,38,23,0.12)]">
        <div className="flex min-w-0 flex-col gap-4 border-b border-brown-700/10 px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brown-500">
              Ví hệ thống
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-brown-950">
              System Wallet
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
              Theo dõi tiền thuộc sở hữu hệ thống. Hiện tại số dư chỉ tăng từ phí vận hành đặt cược.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            {onOpenMoneyTransactions && (
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-brown-700/10 bg-brown-900 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brown-800"
                type="button"
                onClick={onOpenMoneyTransactions}
              >
                Xem ledger đầy đủ
                <ChevronRight size={18} />
              </button>
            )}
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-brown-700/10 bg-white px-5 text-sm font-black text-brown-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brown-700/20 disabled:cursor-wait disabled:opacity-60"
              type="button"
              onClick={() => loadWallet({ silent: true })}
              disabled={loading || refreshing}
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
              {refreshing ? 'Đang làm mới' : 'Làm mới'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 sm:mx-7">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid min-w-0 gap-4 p-5 sm:p-7 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-[26px] bg-white/70" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid min-w-0 gap-4 p-5 sm:p-7 lg:grid-cols-3">
              <StatCard
                label="System Balance"
                value={money(wallet?.balance)}
                note="Tiền thuộc sở hữu nền tảng"
                icon={Landmark}
                tone="text-brown-600"
              />
              <StatCard
                label="Operator Fee Revenue"
                value={money(wallet?.bettingFeeRevenue)}
                note="Tổng phí vận hành từ betting settlement"
                icon={CircleDollarSign}
                tone="text-emerald-600"
              />
              <StatCard
                label="Ledger Rows"
                value={formatNumber(transactions.length)}
                note={`Cập nhật: ${dateTime(wallet?.updatedAt)}`}
                icon={ReceiptText}
                tone="text-amber-600"
              />
            </div>

            <div className="mx-5 mb-6 rounded-[28px] border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-bold text-emerald-900 sm:mx-7">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 shrink-0" size={18} />
                <p>
                  System Wallet là read-only. Admin không thể nạp, rút hoặc chỉnh sửa số dư thủ công.
                </p>
              </div>
            </div>

            <section className="mx-5 mb-7 min-w-0 overflow-hidden rounded-[30px] border border-brown-700/10 bg-white shadow-[0_16px_42px_rgba(66,38,23,0.08)] sm:mx-7">
              <div className="flex flex-col gap-2 border-b border-brown-700/10 bg-cream-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-brown-500">
                    System Fund Ledger
                  </p>
                  <h3 className="mt-1 text-xl font-black text-brown-950">
                    Phí vận hành betting
                  </h3>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brown-700/10 bg-white px-3 py-1 text-xs font-black text-slate-600">
                  <Banknote size={15} />
                  {formatNumber(transactions.length)} giao dịch
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="grid min-h-56 place-items-center px-5 py-10 text-center">
                  <div>
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-brown-700/10 bg-cream-50 text-brown-500">
                      <ReceiptText size={24} />
                    </span>
                    <h4 className="mt-4 text-lg font-black text-brown-950">
                      Chưa có giao dịch System Wallet
                    </h4>
                    <p className="mt-2 max-w-md text-sm font-semibold text-slate-500">
                      Khi betting event được settle và phát sinh operator fee, giao dịch sẽ xuất hiện tại đây.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-brown-700/10">
                  {transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.fundTransactionId}
                      transaction={transaction}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
