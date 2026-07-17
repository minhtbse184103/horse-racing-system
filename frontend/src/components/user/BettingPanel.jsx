import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CircleDollarSign,
  Clock,
  ReceiptText,
  RefreshCw,
  Ticket,
  Wallet
} from 'lucide-react';
import { formatDate, formatDisplayLabel, formatNumber } from '../../lib';
import { getMyWallet } from '../../services/walletService';
import {
  getBettingEvent,
  getBettingEvents,
  getMyBetTickets,
  placeBet
} from '../../services/bettingService';

const ticketStatuses = ['ALL', 'PLACED', 'WON', 'LOST', 'REFUNDED', 'VOID'];
const productOptions = ['ALL', 'WIN'];

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

function StatusBadge({ status }) {
  return <span className={`status-badge ${String(status || '').toLowerCase()}`}>{formatDisplayLabel(status)}</span>;
}

function ProductBadge({ code }) {
  const label = String(code || '').toUpperCase();
  return <span className="rounded-md border border-brown-700/10 bg-cream-200 px-2.5 py-1 text-xs font-black text-brown-700">{label}</span>;
}

function PanelStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/75 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && <Icon className="text-brown-500" size={18} />}
      </div>
      <strong className="mt-2 block text-2xl font-black text-brown-900">{value}</strong>
    </div>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="text-xs font-bold text-danger">{children}</p>;
}

function BettingEventList({ events, selectedProduct, setSelectedProduct, onSelect }) {
  const filtered = useMemo(() => {
    if (selectedProduct === 'ALL') return events;
    return events.filter((event) => String(event.productCode).toUpperCase() === selectedProduct);
  }, [events, selectedProduct]);

  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">Betting</p>
          <h2>Cuộc đua đang mở cược</h2>
          <p>Chọn race và sản phẩm cược. Odds đang hiển thị là ước tính theo pool hiện tại.</p>
        </div>
        <select
          className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-extrabold text-brown-900 outline-none"
          value={selectedProduct}
          onChange={(event) => setSelectedProduct(event.target.value)}
        >
          {productOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brown-700/20 bg-white/60 p-8 text-center">
          <CircleDollarSign className="mx-auto text-brown-500" size={30} />
          <h3 className="mt-3 text-xl font-black text-brown-900">Chưa có event cược phù hợp</h3>
          <p className="mt-2 font-medium text-slate-500">Khi admin mở betting event, danh sách sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((event) => {
            const isOpen = String(event.status).toUpperCase() === 'OPEN';
            return (
              <article key={event.betEventId} className="rounded-lg border border-brown-700/10 bg-white/75 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProductBadge code={event.productCode} />
                      <StatusBadge status={event.status} />
                    </div>
                    <h3 className="mt-3 truncate text-xl font-black text-brown-900">{event.raceName}</h3>
                    <p className="mt-1 truncate text-sm font-bold text-slate-500">{event.trackName}</p>
                  </div>
                  <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-brown-900 text-gold-400">
                    <Ticket size={22} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-cream-200/60 p-3">
                    <span className="text-xs font-extrabold uppercase text-slate-500">Race start</span>
                    <strong className="mt-1 block text-sm text-brown-900">{dateTime(event.raceStartTime)}</strong>
                  </div>
                  <div className="rounded-lg bg-cream-200/60 p-3">
                    <span className="text-xs font-extrabold uppercase text-slate-500">Đóng cược</span>
                    <strong className="mt-1 block text-sm text-brown-900">{dateTime(event.closeAt)}</strong>
                  </div>
                  <div className="rounded-lg bg-cream-200/60 p-3">
                    <span className="text-xs font-extrabold uppercase text-slate-500">Total pool</span>
                    <strong className="mt-1 block text-sm text-brown-900">{money(event.totalStake)}</strong>
                  </div>
                  <div className="rounded-lg bg-cream-200/60 p-3">
                    <span className="text-xs font-extrabold uppercase text-slate-500">Daily max</span>
                    <strong className="mt-1 block text-sm text-brown-900">{money(event.maxDailyStake)}</strong>
                  </div>
                </div>

                <button
                  className="primary-button owner-hero-action mt-5"
                  type="button"
                  onClick={() => onSelect(event.betEventId)}
                  disabled={!isOpen}
                >
                  {isOpen ? 'Xem cược' : 'Đã đóng cược'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BetEventDetail({ event, wallet, selectedEntryId, setSelectedEntryId, stake, setStake, formError, isSubmitting, onBack, onSubmit }) {
  const selectedEntry = event?.entries?.find((entry) => Number(entry.raceEntryId) === Number(selectedEntryId));
  const stakeNumber = Number(stake || 0);
  const estimatedPayout = selectedEntry?.estimatedOdds && stakeNumber > 0
    ? stakeNumber * Number(selectedEntry.estimatedOdds)
    : 0;
  const availableBalance = Number(wallet?.availableBalance ?? 0);

  return (
    <section className="owner-stack">
      <button className="outline-button w-fit" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      <section className="owner-panel">
        <div className="owner-panel-header">
          <div>
            <p className="eyebrow">Bet Slip</p>
            <h2>{event.raceName}</h2>
            <p>{event.trackName} · {dateTime(event.raceStartTime)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ProductBadge code={event.productCode} />
            <StatusBadge status={event.status} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 overflow-hidden rounded-lg border border-brown-700/10 bg-white/65">
            <div className="grid grid-cols-[5rem_minmax(0,1.2fr)_minmax(0,1fr)_9rem_8rem] gap-3 border-b border-brown-700/10 px-4 py-3 text-xs font-black uppercase text-slate-500 max-lg:hidden">
              <span>Stall</span>
              <span>Horse</span>
              <span>Jockey</span>
              <span>Pool</span>
              <span>Odds</span>
            </div>

            <div className="divide-y divide-brown-700/10">
              {(event.entries || []).map((entry) => {
                const selected = Number(entry.raceEntryId) === Number(selectedEntryId);
                return (
                  <button
                    key={entry.raceEntryId}
                    type="button"
                    onClick={() => setSelectedEntryId(entry.raceEntryId)}
                    className={`grid w-full gap-3 px-4 py-4 text-left transition lg:grid-cols-[5rem_minmax(0,1.2fr)_minmax(0,1fr)_9rem_8rem] ${selected ? 'bg-gold-400/12 ring-2 ring-inset ring-gold-400/40' : 'bg-white/45 hover:bg-white/80'}`}
                  >
                    <span className="font-black text-brown-900">#{entry.startingStall}</span>
                    <span className="min-w-0">
                      <strong className="block truncate text-brown-900">{entry.horseName}</strong>
                      <small className="block truncate font-bold text-slate-500">Owner: {entry.ownerName || 'N/A'}</small>
                    </span>
                    <span className="truncate font-bold text-slate-600">{entry.jockeyName || 'N/A'}</span>
                    <span className="font-black text-brown-900">{money(entry.poolStake)}</span>
                    <span className="font-black text-emerald-700">{entry.estimatedOdds ? Number(entry.estimatedOdds).toFixed(2) : '-'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-brown-700/10 bg-white/80 p-5 shadow-sm lg:sticky lg:top-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-black text-brown-900">Phiếu cược</h3>
              <ReceiptText className="text-brown-500" size={22} />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-lg bg-cream-200/60 p-3">
                <span className="text-xs font-extrabold uppercase text-slate-500">Ngựa đã chọn</span>
                <strong className="mt-1 block text-brown-900">{selectedEntry?.horseName || 'Chưa chọn'}</strong>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Stake</span>
                <input
                  className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  type="number"
                  min={event.minStake || 10000}
                  step="10000"
                  value={stake}
                  onChange={(changeEvent) => setStake(changeEvent.target.value)}
                  placeholder="10000"
                  disabled={isSubmitting}
                />
                <FieldError>{formError}</FieldError>
              </label>
              <div className="grid gap-2 rounded-lg border border-brown-700/10 bg-white/70 p-3 text-sm font-bold text-slate-600">
                <span className="flex justify-between gap-3"><span>Ví khả dụng</span><strong>{money(availableBalance)}</strong></span>
                <span className="flex justify-between gap-3"><span>Min stake</span><strong>{money(event.minStake)}</strong></span>
                <span className="flex justify-between gap-3"><span>Daily max</span><strong>{money(event.maxDailyStake)}</strong></span>
                <span className="flex justify-between gap-3"><span>Estimated odds</span><strong>{selectedEntry?.estimatedOdds ? Number(selectedEntry.estimatedOdds).toFixed(2) : '-'}</strong></span>
                <span className="flex justify-between gap-3"><span>Estimated payout</span><strong>{money(estimatedPayout)}</strong></span>
              </div>
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                <AlertTriangle size={16} />
                <span>Odds chỉ là ước tính. Payout cuối cùng được tính tự động khi Admin công bố kết quả.</span>
              </div>
              <button
                className="primary-button owner-hero-action"
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || String(event.status).toUpperCase() !== 'OPEN'}
              >
                {isSubmitting ? 'Đang đặt cược...' : 'Đặt cược'}
              </button>
              <button className="outline-button" type="button" onClick={() => setSelectedEntryId('')} disabled={isSubmitting}>
                Xóa lựa chọn
              </button>
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}

function MyTickets({ tickets, statusFilter, setStatusFilter, productFilter, setProductFilter }) {
  const filtered = useMemo(() => tickets.filter((ticket) => {
    const status = String(ticket.status || '').toUpperCase();
    const product = String(ticket.productCode || '').toUpperCase();
    return (statusFilter === 'ALL' || status === statusFilter)
      && (productFilter === 'ALL' || product === productFilter);
  }), [tickets, statusFilter, productFilter]);

  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">My Tickets</p>
          <h2>Vé cược của tôi</h2>
          <p>Theo dõi trạng thái vé, final odds và payout sau khi settle.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-extrabold text-brown-900" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {ticketStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-extrabold text-brown-900" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
            {productOptions.map((product) => <option key={product} value={product}>{product}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/70">
        <div className="grid grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_8rem_8rem_8rem] gap-3 border-b border-brown-700/10 px-4 py-3 text-xs font-black uppercase text-slate-500 max-xl:hidden">
          <span>Ticket</span>
          <span>Race / Horse</span>
          <span>Product</span>
          <span>Stake</span>
          <span>Odds</span>
          <span>Payout</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-brown-700/10">
          {filtered.length === 0 ? (
            <div className="p-8 text-center font-bold text-slate-500">Chưa có vé cược phù hợp.</div>
          ) : filtered.map((ticket) => (
            <div key={ticket.betTicketId} className="grid gap-3 px-4 py-4 xl:grid-cols-[5rem_minmax(0,1fr)_7rem_8rem_8rem_8rem_8rem]">
              <strong className="text-brown-900">#{ticket.betTicketId}</strong>
              <span className="min-w-0">
                <strong className="block truncate text-brown-900">{ticket.raceName}</strong>
                <small className="block truncate font-bold text-slate-500">#{ticket.startingStall} · {ticket.horseName || 'N/A'} · {formatDate(ticket.placedAt)}</small>
              </span>
              <ProductBadge code={ticket.productCode} />
              <strong>{money(ticket.stake)}</strong>
              <strong>{ticket.finalOdds ? Number(ticket.finalOdds).toFixed(2) : ticket.estimatedOddsAtBet ? Number(ticket.estimatedOddsAtBet).toFixed(2) : '-'}</strong>
              <strong>{money(ticket.payoutAmount)}</strong>
              <StatusBadge status={ticket.status} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function BettingPanel() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [ticketStatus, setTicketStatus] = useState('ALL');
  const [ticketProduct, setTicketProduct] = useState('ALL');
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [stake, setStake] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [eventList, ticketList, walletData] = await Promise.all([
        getBettingEvents(),
        getMyBetTickets(),
        getMyWallet().catch(() => null)
      ]);
      setEvents(eventList || []);
      setTickets(ticketList || []);
      setWallet(walletData);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu betting.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function selectEvent(eventId) {
    setIsLoading(true);
    setError('');
    setMessage('');
    setSelectedEntryId('');
    setStake('');
    setFormError('');
    try {
      setSelectedEvent(await getBettingEvent(eventId));
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết betting event.');
    } finally {
      setIsLoading(false);
    }
  }

  function validateBet() {
    const stakeNumber = Number(stake);
    const minStake = Number(selectedEvent?.minStake || 10000);
    const maxDailyStake = Number(selectedEvent?.maxDailyStake || 0);
    const availableBalance = Number(wallet?.availableBalance ?? 0);

    if (!selectedEntryId) return 'Vui lòng chọn ngựa trước khi đặt cược.';
    if (!Number.isFinite(stakeNumber) || stakeNumber <= 0) return 'Số tiền cược phải lớn hơn 0.';
    if (stakeNumber < minStake) return `Số tiền cược tối thiểu là ${money(minStake)}.`;
    if (maxDailyStake > 0 && stakeNumber > maxDailyStake) return `Số tiền cược vượt giới hạn ngày ${money(maxDailyStake)}.`;
    if (availableBalance > 0 && stakeNumber > availableBalance) return 'Số dư ví khả dụng không đủ để đặt cược.';
    return '';
  }

  async function submitBet() {
    const validationError = validateBet();
    setFormError(validationError);
    if (validationError) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      await placeBet(selectedEvent.betEventId, {
        raceEntryId: Number(selectedEntryId),
        stake: Number(stake)
      });
      const [updatedEvent, updatedTickets, updatedWallet] = await Promise.all([
        getBettingEvent(selectedEvent.betEventId),
        getMyBetTickets(),
        getMyWallet().catch(() => wallet)
      ]);
      setSelectedEvent(updatedEvent);
      setTickets(updatedTickets || []);
      setWallet(updatedWallet);
      setSelectedEntryId('');
      setStake('');
      setMessage('Đặt cược thành công. Tiền cược đã được khóa trong ví.');
    } catch (err) {
      setFormError(err.message || 'Không thể đặt cược.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const stats = useMemo(() => ({
    open: events.filter((event) => String(event.status).toUpperCase() === 'OPEN').length,
    tickets: tickets.length,
    placed: tickets.filter((ticket) => String(ticket.status).toUpperCase() === 'PLACED').length,
    balance: wallet?.availableBalance ?? 0
  }), [events, tickets, wallet]);

  return (
    <section className="owner-stack">
      <section className="owner-stats-grid">
        <PanelStat label="Event đang mở" value={stats.open} icon={Clock} />
        <PanelStat label="Vé của tôi" value={stats.tickets} icon={ReceiptText} />
        <PanelStat label="Đang chờ settle" value={stats.placed} icon={Ticket} />
        <PanelStat label="Ví khả dụng" value={money(stats.balance)} icon={Wallet} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button className={selectedEvent ? 'outline-button' : 'primary-button'} type="button" onClick={() => setSelectedEvent(null)}>Events</button>
          <button className="outline-button" type="button" onClick={() => setSelectedEvent(null)}>My Tickets</button>
        </div>
        <button className="refresh-button" type="button" onClick={loadData} disabled={isLoading}>
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}
      {isLoading && <div className="admin-alert success" role="status">Đang tải betting...</div>}

      {selectedEvent ? (
        <BetEventDetail
          event={selectedEvent}
          wallet={wallet}
          selectedEntryId={selectedEntryId}
          setSelectedEntryId={setSelectedEntryId}
          stake={stake}
          setStake={setStake}
          formError={formError}
          isSubmitting={isSubmitting}
          onBack={() => setSelectedEvent(null)}
          onSubmit={submitBet}
        />
      ) : (
        <>
          <BettingEventList
            events={events}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            onSelect={selectEvent}
          />
          <MyTickets
            tickets={tickets}
            statusFilter={ticketStatus}
            setStatusFilter={setTicketStatus}
            productFilter={ticketProduct}
            setProductFilter={setTicketProduct}
          />
        </>
      )}
    </section>
  );
}
