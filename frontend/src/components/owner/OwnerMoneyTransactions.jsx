import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Eye,
  Filter,
  ReceiptText,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { getOwnerEntryFeeTransactions } from '../../services/ownerService';
import { useLanguage } from '../../context/LanguageContext';
import { formatDisplayLabel } from '../../lib';
import { formatVndCurrency } from '../../lib/eventFormatters';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'SUCCESS', 'FAILED'];

function formatDateTime(value, language = 'vi') {
  if (!value) return language === 'vi' ? 'Chưa cập nhật' : 'Not updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getPaymentStatusClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SUCCESS') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (normalized === 'FAILED') return 'bg-red-50 text-red-700 ring-red-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function getPaymentStatusLabel(status, language) {
  const normalized = String(status || '').toUpperCase();
  const labels = {
    vi: {
      SUCCESS: 'Đã thanh toán',
      PENDING: 'Đang chờ',
      FAILED: 'Thất bại'
    },
    en: {
      SUCCESS: 'Paid',
      PENDING: 'Pending',
      FAILED: 'Failed'
    }
  };
  return labels[language]?.[normalized] || formatDisplayLabel(status || 'PENDING');
}

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4">
      <span className="block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || '-'}</strong>
    </div>
  );
}

export default function OwnerMoneyTransactions() {
  const { language, t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const copy = {
    eyebrow: language === 'vi' ? 'Thanh toán phí tham gia' : 'Entry fee transactions',
    title: language === 'vi' ? 'Lịch sử phí tham gia Tournament' : 'Tournament entry fee ledger',
    desc: language === 'vi'
      ? 'Theo dõi các lần thanh toán phí tham gia qua VNPAY cho Registration của bạn.'
      : 'Track VNPAY entry fee payments for your Tournament registrations.',
    search: language === 'vi' ? 'Tìm Tournament, Horse, Jockey, mã Registration...' : 'Search Tournament, Horse, Jockey, Registration...',
    filter: language === 'vi' ? 'Lọc Status' : 'Filter Status',
    refresh: language === 'vi' ? 'Làm mới' : 'Refresh',
    paidAmount: language === 'vi' ? 'Đã thanh toán' : 'Paid amount',
    pending: language === 'vi' ? 'Đang chờ' : 'Pending',
    failed: language === 'vi' ? 'Thất bại' : 'Failed',
    total: language === 'vi' ? 'Tổng giao dịch' : 'Total transactions',
    empty: language === 'vi' ? 'Chưa có giao dịch phí tham gia' : 'No entry fee transactions yet',
    emptyDesc: language === 'vi'
      ? 'Khi bạn tạo Registration và thanh toán qua VNPAY, giao dịch sẽ xuất hiện tại đây.'
      : 'When you create a Registration and pay through VNPAY, the transaction will appear here.',
    noResult: language === 'vi' ? 'Không có giao dịch phù hợp với bộ lọc.' : 'No transactions match the current filters.',
    loadError: language === 'vi' ? 'Không thể tải lịch sử thanh toán phí tham gia.' : 'Unable to load entry fee transactions.',
    detailTitle: language === 'vi' ? 'Chi tiết giao dịch' : 'Transaction detail',
    amount: language === 'vi' ? 'Số tiền' : 'Amount',
    tournament: 'Tournament',
    horse: 'Horse',
    jockey: 'Jockey',
    registration: 'Registration',
    provider: language === 'vi' ? 'Cổng thanh toán' : 'Provider',
    txnRef: language === 'vi' ? 'Mã giao dịch' : 'Transaction ref',
    providerNo: language === 'vi' ? 'Mã VNPAY' : 'VNPAY transaction no',
    responseCode: language === 'vi' ? 'Mã phản hồi' : 'Response code',
    createdAt: language === 'vi' ? 'Tạo lúc' : 'Created at',
    paidAt: language === 'vi' ? 'Thanh toán lúc' : 'Paid at',
    paymentStatus: 'Payment Status',
    approvalStatus: 'Registration Status',
    view: language === 'vi' ? 'Xem' : 'View',
    all: language === 'vi' ? 'Tất cả' : 'All'
  };

  async function loadTransactions() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getOwnerEntryFeeTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorText(err, copy.loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const summary = useMemo(() => transactions.reduce((total, item) => {
    const status = String(item.status || '').toUpperCase();
    const amount = Number(item.amount || 0);
    if (status === 'SUCCESS') {
      total.paidAmount += Number.isFinite(amount) ? amount : 0;
      total.successCount += 1;
    }
    if (status === 'PENDING') total.pendingCount += 1;
    if (status === 'FAILED') total.failedCount += 1;
    return total;
  }, {
    paidAmount: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0
  }), [transactions]);

  const filteredTransactions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesStatus = statusFilter === 'ALL'
        || String(transaction.status || '').toUpperCase() === statusFilter;
      const matchesQuery = !needle || [
        transaction.tournamentName,
        transaction.horseName,
        transaction.jockeyName,
        transaction.registrationNo,
        transaction.txnRef,
        transaction.providerTransactionNo
      ].some((value) => String(value || '').toLowerCase().includes(needle));
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, transactions]);

  return (
    <section className="owner-stack">
      <div className="owner-section-toolbar">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.desc}</p>
        </div>
        <button className="outline-button compact-button" type="button" onClick={loadTransactions} disabled={isLoading}>
          <RefreshCw size={15} /> {isLoading ? `${t('loading')}...` : copy.refresh}
        </button>
      </div>

      {error && (
        <div className="admin-alert error" role="alert">
          {error}
          <button type="button" className="table-button" onClick={loadTransactions}>{copy.refresh}</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-brown-700/10 bg-white/85 p-5 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <CheckCircle2 size={15} /> {copy.paidAmount}
          </span>
          <strong className="mt-3 block text-2xl font-black text-brown-950">{formatVndCurrency(summary.paidAmount)}</strong>
          <small className="mt-1 block font-bold text-emerald-700">{summary.successCount} SUCCESS</small>
        </article>
        <article className="rounded-lg border border-brown-700/10 bg-white/85 p-5 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <CreditCard size={15} /> {copy.pending}
          </span>
          <strong className="mt-3 block text-2xl font-black text-brown-950">{summary.pendingCount}</strong>
          <small className="mt-1 block font-bold text-amber-700">PENDING</small>
        </article>
        <article className="rounded-lg border border-brown-700/10 bg-white/85 p-5 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <ReceiptText size={15} /> {copy.failed}
          </span>
          <strong className="mt-3 block text-2xl font-black text-brown-950">{summary.failedCount}</strong>
          <small className="mt-1 block font-bold text-red-700">FAILED</small>
        </article>
        <article className="rounded-lg border border-brown-700/10 bg-white/85 p-5 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <CalendarDays size={15} /> {copy.total}
          </span>
          <strong className="mt-3 block text-2xl font-black text-brown-950">{transactions.length}</strong>
          <small className="mt-1 block font-bold text-slate-500">{filteredTransactions.length} visible</small>
        </article>
      </div>

      <section className="owner-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="min-w-0 flex-1">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{copy.search}</span>
            <span className="flex min-h-12 items-center gap-3 rounded-lg border border-brown-700/15 bg-white px-4 focus-within:border-gold-400">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                className="min-w-0 flex-1 bg-transparent py-3 font-bold text-brown-900 outline-none placeholder:text-slate-400"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search}
              />
            </span>
          </label>
          <label className="w-full lg:w-64">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{copy.filter}</span>
            <span className="flex min-h-12 items-center gap-3 rounded-lg border border-brown-700/15 bg-white px-4">
              <Filter size={16} className="shrink-0 text-slate-400" />
              <select
                className="min-w-0 flex-1 bg-transparent py-3 font-black text-brown-900 outline-none"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? copy.all : getPaymentStatusLabel(status, language)}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
      </section>

      <section className="owner-panel overflow-hidden">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">VNPAY</p>
            <h2>{copy.title}</h2>
            <p>{filteredTransactions.length} / {transactions.length} transactions</p>
          </div>
          <ReceiptText size={24} />
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-brown-700/15 bg-cream-100 p-8 text-center font-black text-slate-500">
            {t('loading')}...
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brown-700/15 bg-cream-100 p-8 text-center">
            <ReceiptText className="mx-auto text-brown-500" size={32} />
            <h3 className="mt-3 text-xl font-black text-brown-950">{copy.empty}</h3>
            <p className="mx-auto mt-2 max-w-2xl font-semibold text-slate-500">{copy.emptyDesc}</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brown-700/15 bg-cream-100 p-8 text-center font-black text-slate-500">
            {copy.noResult}
          </div>
        ) : (
          <div className="divide-y divide-brown-700/10">
            {filteredTransactions.map((transaction) => (
              <article
                className="grid gap-4 py-5 transition hover:bg-cream-100/60 lg:grid-cols-[1.15fr_1fr_0.8fr_0.8fr_auto] lg:items-center"
                key={transaction.paymentTransactionId}
              >
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wide text-brown-600">
                    {transaction.registrationNo || `#${transaction.registrationId || '-'}`}
                  </span>
                  <h3 className="mt-1 truncate text-lg font-black text-brown-950">
                    {transaction.tournamentName || copy.tournament}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {formatDateTime(transaction.paidAt || transaction.createdAt, language)}
                  </p>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">{copy.horse} / Jockey</span>
                  <p className="mt-1 truncate font-black text-brown-900">{transaction.horseName || '-'}</p>
                  <p className="truncate text-sm font-semibold text-slate-500">{transaction.jockeyName || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">{copy.amount}</span>
                  <strong className="mt-1 block text-lg font-black text-brown-950">{formatVndCurrency(transaction.amount)}</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${getPaymentStatusClass(transaction.status)}`}>
                    {getPaymentStatusLabel(transaction.status, language)}
                  </span>
                  {transaction.registrationApprovalStatus && (
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-black uppercase text-slate-600 ring-1 ring-slate-200">
                      {formatDisplayLabel(transaction.registrationApprovalStatus)}
                    </span>
                  )}
                </div>
                <button
                  className="outline-button compact-button justify-center"
                  type="button"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <Eye size={15} /> {copy.view}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center bg-brown-950/65 p-4 backdrop-blur-md"
          role="presentation"
          onClick={() => setSelectedTransaction(null)}
        >
          <section
            className="relative z-[10000] max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-brown-700/10 bg-[#fffaf1] p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-entry-fee-transaction-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-brown-700/10 pb-4">
              <div>
                <p className="eyebrow">{copy.detailTitle}</p>
                <h3 id="owner-entry-fee-transaction-title" className="mt-1 text-2xl font-black text-brown-950">
                  {selectedTransaction.registrationNo || `#${selectedTransaction.registrationId || '-'}`}
                </h3>
                <p className="mt-1 font-semibold text-slate-500">{selectedTransaction.tournamentName || copy.tournament}</p>
              </div>
              <button
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 transition hover:border-gold-400 hover:bg-gold-400/15"
                type="button"
                onClick={() => setSelectedTransaction(null)}
                aria-label={t('close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label={copy.paymentStatus} value={getPaymentStatusLabel(selectedTransaction.status, language)} />
              <Field label={copy.approvalStatus} value={formatDisplayLabel(selectedTransaction.registrationApprovalStatus)} />
              <Field label={copy.amount} value={formatVndCurrency(selectedTransaction.amount)} />
              <Field label={copy.provider} value={selectedTransaction.provider} />
              <Field label={copy.horse} value={selectedTransaction.horseName} />
              <Field label={copy.jockey} value={selectedTransaction.jockeyName} />
              <Field label={copy.txnRef} value={selectedTransaction.txnRef} />
              <Field label={copy.providerNo} value={selectedTransaction.providerTransactionNo} />
              <Field label={copy.responseCode} value={selectedTransaction.responseCode} />
              <Field label={copy.createdAt} value={formatDateTime(selectedTransaction.createdAt, language)} />
              <Field label={copy.paidAt} value={formatDateTime(selectedTransaction.paidAt, language)} />
              <Field label={copy.registration} value={`#${selectedTransaction.registrationId || '-'}`} />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
