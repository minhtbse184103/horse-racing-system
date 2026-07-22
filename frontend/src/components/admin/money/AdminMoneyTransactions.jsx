import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Database,
  Eye,
  Filter,
  Landmark,
  ReceiptText,
  RefreshCw,
  Search,
  UserRound,
  Wallet,
  X
} from 'lucide-react';
import { formatDisplayLabel } from '../../../lib';
import { formatVndCurrency } from '../../../lib/eventFormatters';
import { getAdminMoneyTransactions } from '../../../services/adminMoneyTransactionService';

const SOURCE_OPTIONS = ['ALL', 'PAYMENT', 'WALLET', 'FUND', 'BET_SETTLEMENT'];
const STATUS_OPTIONS = ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'RECORDED', 'SETTLED'];
const TYPE_OPTIONS = [
  'ALL',
  'REGISTRATION_FEE',
  'WALLET_DEPOSIT',
  'DEPOSIT',
  'BET_LOCK',
  'BET_WIN',
  'BET_LOST',
  'BET_REFUND',
  'BETTING_OPERATOR_FEE',
  'PRIZE_PAYOUT',
  'BET_SETTLEMENT'
];

function money(value) {
  return formatVndCurrency(value);
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

function toDateTimeLocal(value) {
  if (!value) return '';
  return value.length === 16 ? `${value}:00` : value;
}

function sourceTone(source) {
  const normalized = String(source || '').toUpperCase();
  if (normalized === 'PAYMENT') return 'bg-emerald-50 text-emerald-800 border-emerald-100';
  if (normalized === 'WALLET') return 'bg-sky-50 text-sky-800 border-sky-100';
  if (normalized === 'FUND') return 'bg-amber-50 text-amber-800 border-amber-100';
  if (normalized === 'BET_SETTLEMENT') return 'bg-purple-50 text-purple-800 border-purple-100';
  return 'bg-stone-100 text-stone-700 border-stone-200';
}

function sourceDotTone(source) {
  const normalized = String(source || '').toUpperCase();
  if (normalized === 'PAYMENT') return 'bg-emerald-500';
  if (normalized === 'WALLET') return 'bg-sky-500';
  if (normalized === 'FUND') return 'bg-amber-500';
  if (normalized === 'BET_SETTLEMENT') return 'bg-purple-500';
  return 'bg-stone-400';
}

function directionTone(direction) {
  const normalized = String(direction || '').toUpperCase();
  if (normalized === 'CREDIT' || normalized === 'SETTLED') return 'text-emerald-700';
  if (normalized === 'DEBIT' || normalized === 'LOCK') return 'text-red-700';
  return 'text-brown-800';
}

function statusTone(status) {
  const normalized = String(status || '').toUpperCase();
  if (['SUCCESS', 'RECORDED', 'SETTLED', 'PAID'].includes(normalized)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (['PENDING', 'PROCESSING'].includes(normalized)) {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  if (['FAILED', 'CANCELLED', 'REJECTED'].includes(normalized)) {
    return 'border-red-200 bg-red-50 text-red-800';
  }
  return 'border-brown-700/10 bg-white text-brown-800';
}

function DirectionIcon({ direction }) {
  const normalized = String(direction || '').toUpperCase();
  if (normalized === 'CREDIT' || normalized === 'SETTLED') return <ArrowUpRight size={15} />;
  if (normalized === 'DEBIT' || normalized === 'LOCK') return <ArrowDownLeft size={15} />;
  return <CircleDollarSign size={15} />;
}

function transactionContext(transaction) {
  return transaction.tournamentName || transaction.raceName || transaction.username || 'System';
}

function transactionDescription(transaction) {
  return transaction.description || `${transaction.referenceType || 'REF'} #${transaction.referenceId || '-'}`;
}

function transactionTitle(transaction) {
  const type = formatDisplayLabel(transaction.transactionType);
  if (transaction.tournamentName && transaction.raceName) {
    return `${type} - ${transaction.tournamentName} / ${transaction.raceName}`;
  }
  if (transaction.tournamentName) return `${type} - ${transaction.tournamentName}`;
  if (transaction.username) return `${type} - ${transaction.username}`;
  return type;
}

function controlClass() {
  return 'h-11 w-full min-w-0 rounded-xl border border-brown-700/15 bg-white px-3 text-sm font-extrabold text-brown-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';
}

function FieldLabel({ label, children, className = '' }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'text-brown-500' }) {
  return (
    <div className="min-w-0 rounded-2xl border border-brown-700/10 bg-white p-4 shadow-sm transition hover:border-brown-700/20 hover:shadow-[0_16px_38px_rgba(66,38,23,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-xs font-extrabold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brown-700/10 bg-cream-50">
          <Icon className={tone} size={18} />
        </span>
      </div>
      <strong className="mt-3 block break-words text-2xl font-black tracking-tight text-brown-950">
        {value}
      </strong>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-brown-700/10 bg-white px-4 py-3 shadow-sm">
      <span className="block text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <p className="mt-1 min-w-0 break-words text-sm font-extrabold text-brown-950">
        {value || 'N/A'}
      </p>
    </div>
  );
}

function DetailGroup({ icon: Icon, title, children }) {
  return (
    <section className="rounded-[22px] border border-brown-700/10 bg-cream-50/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl border border-brown-700/10 bg-white text-brown-700 shadow-sm">
          <Icon size={17} />
        </span>
        <h3 className="text-sm font-black uppercase tracking-wide text-brown-800">
          {title}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function MoneyFlow({ transaction }) {
  const sourceLabel = formatDisplayLabel(transaction.source);
  const directionLabel = formatDisplayLabel(transaction.direction);
  const isCredit = ['CREDIT', 'SETTLED'].includes(String(transaction.direction || '').toUpperCase());
  const isDebit = ['DEBIT', 'LOCK'].includes(String(transaction.direction || '').toUpperCase());
  const fromLabel = isCredit ? 'Nguồn tiền' : 'Tài khoản / quỹ';
  const toLabel = isDebit ? 'Đích ghi nhận' : 'Hệ thống';

  return (
    <div className="rounded-[22px] border border-brown-700/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 rounded-2xl border border-brown-700/10 bg-cream-50 p-4">
          <span className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
            {fromLabel}
          </span>
          <strong className="mt-1 block truncate text-base text-brown-950">
            {transaction.username || transaction.tournamentName || sourceLabel}
          </strong>
        </div>
        <div className={`inline-flex items-center justify-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-black ${directionTone(transaction.direction)}`}>
          <DirectionIcon direction={transaction.direction} />
          {directionLabel}
        </div>
        <div className="min-w-0 flex-1 rounded-2xl border border-brown-700/10 bg-cream-50 p-4">
          <span className="text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
            {toLabel}
          </span>
          <strong className="mt-1 block truncate text-base text-brown-950">
            {transaction.tournamentName || transaction.raceName || 'System ledger'}
          </strong>
        </div>
      </div>
    </div>
  );
}

function TransactionDetailDrawer({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-brown-950/45 p-3 backdrop-blur-sm sm:p-5">
      <section className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[#fffaf7] shadow-[0_32px_100px_rgba(43,23,16,0.32)]">
        <div className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-white px-5 py-5 sm:px-6">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-brown-700/10 bg-cream-50 text-brown-700 shadow-sm">
              <ReceiptText size={20} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">Transaction detail</p>
              <h2 className="line-clamp-2 text-xl font-black leading-tight text-brown-950 sm:text-2xl">
                {transactionTitle(transaction)}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {dateTime(transaction.createdAt)}
              </p>
            </div>
          </div>
          <button
            className="refresh-button shrink-0"
            type="button"
            onClick={onClose}
            aria-label="Close transaction detail"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="rounded-[24px] border border-brown-700/10 bg-brown-900 p-5 text-white shadow-[0_18px_46px_rgba(43,23,16,0.18)]">
              <span className="text-[0.68rem] font-black uppercase tracking-wide text-white/55">
                Total amount
              </span>
              <strong className="mt-2 block break-words text-3xl font-black tracking-tight">
                {money(transaction.amount)}
              </strong>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <span className="block text-[0.65rem] font-black uppercase text-white/45">Source</span>
                  <strong className="mt-1 block break-words text-sm">{transaction.source || 'N/A'}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <span className="block text-[0.65rem] font-black uppercase text-white/45">Direction</span>
                  <strong className="mt-1 inline-flex items-center gap-1 text-sm">
                    <DirectionIcon direction={transaction.direction} />
                    {formatDisplayLabel(transaction.direction)}
                  </strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <span className="block text-[0.65rem] font-black uppercase text-white/45">Status</span>
                  <strong className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusTone(transaction.status)}`}>
                    {formatDisplayLabel(transaction.status)}
                  </strong>
                </div>
              </div>
            </aside>

            <div className="space-y-4">
              <MoneyFlow transaction={transaction} />

              <DetailGroup icon={UserRound} title="Người liên quan">
                <DetailItem label="Tài khoản" value={transaction.username || 'System'} />
                <DetailItem label="User ID" value={transaction.userId} />
              </DetailGroup>

              <DetailGroup icon={Landmark} title="Tournament / Race">
                <DetailItem label="Tournament" value={transaction.tournamentName} />
                <DetailItem label="Tournament ID" value={transaction.tournamentId} />
                <DetailItem label="Race" value={transaction.raceName} />
                <DetailItem label="Race ID" value={transaction.raceId} />
              </DetailGroup>

              <DetailGroup icon={Database} title="Nguồn ghi nhận">
                <DetailItem label="Transaction type" value={formatDisplayLabel(transaction.transactionType)} />
                <DetailItem label="Reference" value={`${transaction.referenceType || 'N/A'} #${transaction.referenceId || '-'}`} />
                <DetailItem label="Ledger ID" value={transaction.id} />
                <DetailItem label="Currency" value={transaction.currency || 'VND'} />
              </DetailGroup>

              <section className="rounded-[22px] border border-brown-700/10 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl border border-brown-700/10 bg-cream-50 text-brown-700">
                    <CalendarClock size={17} />
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-wide text-brown-800">
                    Ghi chú giao dịch
                  </h3>
                </div>
                <p className="rounded-2xl border border-brown-700/10 bg-cream-50 px-4 py-3 text-sm font-bold leading-6 text-brown-950">
                  {transaction.description || 'Không có mô tả chi tiết cho giao dịch này.'}
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TransactionMobileCard({ transaction, onView }) {
  const context = transactionContext(transaction);
  const description = transactionDescription(transaction);

  return (
    <article className="grid min-w-0 gap-3 px-4 py-4 transition hover:bg-cream-50/65 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
          <span className={`inline-flex max-w-full overflow-hidden truncate whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-black ${sourceTone(transaction.source)}`} title={transaction.source}>
            {transaction.source}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-black ${directionTone(transaction.direction)}`}>
            <DirectionIcon direction={transaction.direction} />
            {formatDisplayLabel(transaction.direction)}
          </span>
          <span className={`inline-flex w-fit max-w-full overflow-hidden truncate whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(transaction.status)}`} title={formatDisplayLabel(transaction.status)}>
            {formatDisplayLabel(transaction.status)}
          </span>
        </div>
        <strong className="block min-w-0 truncate text-sm text-brown-950" title={formatDisplayLabel(transaction.transactionType)}>
          {formatDisplayLabel(transaction.transactionType)}
        </strong>
        <p className="mt-1 text-sm font-bold text-slate-600">{dateTime(transaction.createdAt)}</p>
        <span className="mt-2 block min-w-0 overflow-hidden" title={`${context} - ${description}`}>
          <strong className="block truncate text-sm text-brown-900">{context}</strong>
          <small className="block truncate font-bold text-slate-500">{description}</small>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
        <strong className="whitespace-nowrap text-base text-brown-950">{money(transaction.amount)}</strong>
        <button className="refresh-button" type="button" onClick={onView} aria-label="View transaction detail">
          <Eye size={16} />
        </button>
      </div>
    </article>
  );
}

function EmptyLedger({ compact = false }) {
  return (
    <div className={`${compact ? 'hidden lg:grid' : 'grid lg:hidden'} min-h-56 place-items-center p-8 text-center`}>
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-brown-700/10 bg-cream-50 text-brown-600">
          <CircleDollarSign size={28} />
        </span>
        <p className="mt-3 text-lg font-black text-brown-950">No matching transactions</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">Adjust filters or refresh data.</p>
      </div>
    </div>
  );
}

export default function AdminMoneyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    source: 'ALL',
    type: 'ALL',
    status: 'ALL',
    from: '',
    to: '',
    limit: 200
  });
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTransactions(nextFilters = filters) {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAdminMoneyTransactions({
        ...nextFilters,
        from: toDateTimeLocal(nextFilters.from),
        to: toDateTimeLocal(nextFilters.to)
      });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải giao dịch tiền.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    const nextFilters = {
      source: 'ALL',
      type: 'ALL',
      status: 'ALL',
      from: '',
      to: '',
      limit: 200
    };
    setFilters(nextFilters);
    setSearch('');
    loadTransactions(nextFilters);
  }

  const visibleTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return transactions;
    return transactions.filter((transaction) => [
      transaction.id,
      transaction.source,
      transaction.transactionType,
      transaction.direction,
      transaction.status,
      transaction.username,
      transaction.tournamentName,
      transaction.raceName,
      transaction.referenceType,
      transaction.referenceId,
      transaction.description
    ].join(' ').toLowerCase().includes(keyword));
  }, [transactions, search]);

  const stats = useMemo(() => {
    const registrationFees = transactions
      .filter((transaction) => transaction.transactionType === 'REGISTRATION_FEE' && transaction.source === 'FUND')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const walletMovement = transactions
      .filter((transaction) => transaction.source === 'WALLET')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const operatorFees = transactions
      .filter((transaction) => transaction.transactionType === 'BETTING_OPERATOR_FEE')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const prizePayout = transactions
      .filter((transaction) => transaction.transactionType === 'PRIZE_PAYOUT')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    return { registrationFees, walletMovement, operatorFees, prizePayout };
  }, [transactions]);

  const activeFilterCount = useMemo(() => [
    filters.source !== 'ALL',
    filters.type !== 'ALL',
    filters.status !== 'ALL',
    Boolean(filters.from),
    Boolean(filters.to),
    Number(filters.limit) !== 200,
    Boolean(search.trim())
  ].filter(Boolean).length, [filters, search]);

  return (
    <section className="min-w-0 max-w-full space-y-6">
      <section className="min-w-0 overflow-hidden rounded-[26px] border border-brown-700/10 bg-white shadow-[0_20px_60px_rgba(66,38,23,0.08)]">
        <div className="flex min-w-0 flex-col gap-5 border-b border-brown-700/10 px-5 py-6 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-brown-700/10 bg-brown-900 text-gold-300 shadow-sm">
              <ReceiptText size={22} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">Finance operations</p>
              <h2 className="text-2xl font-black tracking-tight text-brown-950 sm:text-3xl">
                Money Transactions
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Read-only operational ledger across Payment, Wallet, Tournament Fund, Betting settlement and prize flows.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <span className="inline-flex h-11 items-center justify-center rounded-xl border border-brown-700/10 bg-cream-50 px-4 text-xs font-black uppercase tracking-wide text-slate-600">
              {visibleTransactions.length}/{transactions.length} giao dịch
            </span>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brown-700/10 bg-brown-900 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brown-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => loadTransactions()}
              disabled={isLoading}
            >
              <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 bg-cream-50/60 p-5 sm:grid-cols-2 xl:grid-cols-4 xl:p-6">
          <StatCard label="Registration fees" value={money(stats.registrationFees)} icon={Landmark} tone="text-emerald-700" />
          <StatCard label="Wallet movement" value={money(stats.walletMovement)} icon={Wallet} tone="text-sky-700" />
          <StatCard label="Operator fees" value={money(stats.operatorFees)} icon={CircleDollarSign} tone="text-amber-700" />
          <StatCard label="Prize payouts" value={money(stats.prizePayout)} icon={ArrowDownLeft} tone="text-red-700" />
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[26px] border border-brown-700/10 bg-white shadow-[0_20px_52px_rgba(66,38,23,0.08)]">
        <div className="flex min-w-0 flex-col gap-4 border-b border-brown-700/10 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">Ledger explorer</p>
              {activeFilterCount > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wide text-amber-800">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <h3 className="mt-1 text-xl font-black text-brown-950">Search and filter</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Narrow the ledger by source, type, status, time range or free-text context.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-xl border border-brown-700/10 bg-white px-4 text-sm font-black text-brown-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={resetFilters}
              disabled={isLoading}
            >
              Reset
            </button>
            <button
              className="inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-xl bg-brown-700 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(111,67,40,0.18)] transition hover:-translate-y-0.5 hover:bg-brown-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => loadTransactions()}
              disabled={isLoading}
            >
              <Filter size={17} />
              Apply
            </button>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-brown-700/10 bg-cream-50/45 p-5 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-12">
          <FieldLabel label="Search" className="sm:col-span-2 lg:col-span-6 xl:col-span-4">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className={`${controlClass()} pl-11 pr-4`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="User, Tournament, Race, reference..."
                aria-label="Search transactions by user, Tournament, Race or reference"
              />
            </div>
          </FieldLabel>
          <FieldLabel label="Source" className="lg:col-span-2 xl:col-span-2">
            <select className={controlClass()} value={filters.source} onChange={(event) => updateFilter('source', event.target.value)}>
              {SOURCE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="Type" className="lg:col-span-2 xl:col-span-2">
            <select className={controlClass()} value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
              {TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="Status" className="lg:col-span-2 xl:col-span-2">
            <select className={controlClass()} value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="From" className="lg:col-span-3 xl:col-span-2">
            <input type="datetime-local" className={controlClass()} value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} />
          </FieldLabel>
          <FieldLabel label="To" className="lg:col-span-3 xl:col-span-2">
            <input type="datetime-local" className={controlClass()} value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} />
          </FieldLabel>
          <FieldLabel label="Limit" className="sm:max-w-40 lg:col-span-2 xl:col-span-1">
            <input type="number" min="1" max="500" className={controlClass()} value={filters.limit} onChange={(event) => updateFilter('limit', event.target.value)} />
          </FieldLabel>
        </div>

        <div className="min-w-0 space-y-3 p-5">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800" role="alert">
              <AlertTriangle className="mt-0.5 shrink-0" size={17} />
              <span>{error}</span>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 rounded-2xl border border-brown-700/10 bg-cream-50 px-4 py-3 text-sm font-bold text-brown-800" role="status">
              <RefreshCw size={17} className="animate-spin" />
              Đang tải giao dịch...
            </div>
          )}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-brown-700/10 bg-white shadow-sm">
            <div className="border-b border-brown-700/10 bg-white px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Transactions</p>
                  <p className="text-sm font-semibold text-slate-500">Latest ledger records from the backend</p>
                </div>
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {visibleTransactions.length} visible
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[27%]" />
                  <col className="w-[16%]" />
                  <col className="w-[25%]" />
                  <col className="w-[12%]" />
                  <col className="w-[7%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 border-b border-brown-700/10 bg-cream-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Flow</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Context</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-700/10">
                  {visibleTransactions.length > 0 && visibleTransactions.map((transaction) => {
                    const context = transactionContext(transaction);
                    const description = transactionDescription(transaction);

                    return (
                      <tr key={transaction.id} className="align-middle transition hover:bg-cream-50/65">
                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                          {dateTime(transaction.createdAt)}
                        </td>
                        <td className="min-w-0 px-4 py-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className={`mt-1 size-2.5 shrink-0 rounded-full ${sourceDotTone(transaction.source)}`} />
                            <div className="min-w-0">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <span className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-xs font-black ${sourceTone(transaction.source)}`} title={transaction.source}>
                                  {transaction.source}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-xs font-black ${directionTone(transaction.direction)}`}>
                                  <DirectionIcon direction={transaction.direction} />
                                  {formatDisplayLabel(transaction.direction)}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-sm font-extrabold text-brown-950" title={formatDisplayLabel(transaction.transactionType)}>
                                {formatDisplayLabel(transaction.transactionType)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <strong className="block whitespace-nowrap text-base font-black text-brown-950">
                            {money(transaction.amount)}
                          </strong>
                          <span className="text-xs font-bold text-slate-500">{transaction.currency || 'VND'}</span>
                        </td>
                        <td className="min-w-0 px-4 py-4">
                          <strong className="block truncate text-sm font-black text-brown-950" title={context}>
                            {context}
                          </strong>
                          <small className="block truncate text-xs font-semibold text-slate-500" title={description}>
                            {description}
                          </small>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`mx-auto inline-flex max-w-full justify-center truncate rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(transaction.status)}`} title={formatDisplayLabel(transaction.status)}>
                            {formatDisplayLabel(transaction.status)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <button className="refresh-button mx-auto" type="button" onClick={() => setSelectedTransaction(transaction)} aria-label="View transaction detail">
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {visibleTransactions.length === 0 ? (
              <EmptyLedger compact />
            ) : (
              <div className="divide-y divide-brown-700/10 lg:hidden">
                {visibleTransactions.map((transaction) => (
                  <TransactionMobileCard
                    key={transaction.id}
                    transaction={transaction}
                    onView={() => setSelectedTransaction(transaction)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <TransactionDetailDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </section>
  );
}
