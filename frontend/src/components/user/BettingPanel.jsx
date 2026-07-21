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
  Wallet,
  X
} from 'lucide-react';
import { formatDate, formatDisplayLabel, formatNumber } from '../../lib';
import { getMyWallet } from '../../services/walletService';
import {
  cancelBetTicket,
  getBettingEvent,
  getBettingEvents,
  getMyBetTickets,
  placeBet
} from '../../services/bettingService';
import { useLanguage } from '../../context/LanguageContext';

const ticketStatuses = ['ALL', 'PLACED', 'WON', 'LOST', 'REFUNDED', 'VOID'];
const productOptions = ['ALL', 'WIN', 'PLACE'];

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
  return <span className="bet-product-badge">{label}</span>;
}

function ticketOdds(ticket) {
  if (ticket?.finalOdds) return Number(ticket.finalOdds).toFixed(2);
  if (ticket?.estimatedOddsAtBet) return Number(ticket.estimatedOddsAtBet).toFixed(2);
  return '-';
}

function PanelStat({ label, value, icon: Icon }) {
  return (
    <div className="spectator-bet-stat-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {Icon && <div className="spectator-bet-stat-icon"><Icon size={18} /></div>}
    </div>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="text-xs font-bold text-danger">{children}</p>;
}

function BettingEventList({ events, selectedProduct, setSelectedProduct, onSelect }) {
  const { t } = useLanguage();
  const filtered = useMemo(() => {
    if (selectedProduct === 'ALL') return events;
    return events.filter((event) => String(event.productCode).toUpperCase() === selectedProduct);
  }, [events, selectedProduct]);

  return (
    <section className="spectator-bet-section">
      <div className="spectator-bet-section-header">
        <div>
          <p className="eyebrow">{t('spectatorBettingEyebrow')}</p>
          <h2>{t('spectatorBettingTitle')}</h2>
          <p>{t('spectatorBettingDesc')}</p>
        </div>
        <select
          className="spectator-bet-select"
          value={selectedProduct}
          onChange={(event) => setSelectedProduct(event.target.value)}
        >
          {productOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? t('spectatorFilterAll') : option}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="spectator-bet-empty">
          <CircleDollarSign size={30} />
          <h3>{t('spectatorNoBetEvents')}</h3>
          <p>{t('spectatorNoBetEventsDesc')}</p>
        </div>
      ) : (
        <div className="spectator-bet-event-grid">
          {filtered.map((event) => {
            const isOpen = String(event.status).toUpperCase() === 'OPEN';
            return (
              <article key={event.betEventId} className={isOpen ? 'spectator-bet-event-card open' : 'spectator-bet-event-card'}>
                <div className="spectator-bet-event-top">
                  <div>
                    <div className="spectator-bet-badge-row">
                      <ProductBadge code={event.productCode} />
                      <StatusBadge status={event.status} />
                    </div>
                    <h3>{event.raceName}</h3>
                    <p>{event.trackName}</p>
                  </div>
                  <div className="spectator-bet-event-icon">
                    <Ticket size={22} />
                  </div>
                </div>

                <div className="spectator-bet-event-meta">
                  <div>
                    <span>{t('spectatorRaceStart')}</span>
                    <strong>{dateTime(event.raceStartTime)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorBetClose')}</span>
                    <strong>{dateTime(event.closeAt)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorTotalPool')}</span>
                    <strong>{money(event.totalStake)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorDailyMax')}</span>
                    <strong>{money(event.maxDailyStake)}</strong>
                  </div>
                </div>

                <button
                  className={isOpen ? 'spectator-bet-primary-action' : 'spectator-bet-primary-action disabled'}
                  type="button"
                  onClick={() => onSelect(event.betEventId)}
                  disabled={!isOpen}
                >
                  {isOpen ? t('spectatorViewBet') : t('spectatorBetClosed')}
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
    <section className="spectator-bet-detail-page">
      <button className="spectator-bet-back-button" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      <section className="spectator-bet-section">
        <div className="spectator-bet-section-header">
          <div>
            <p className="eyebrow">Bet Slip</p>
            <h2>{event.raceName}</h2>
            <p>{event.trackName} · {dateTime(event.raceStartTime)}</p>
          </div>
          <div className="spectator-bet-badge-row">
            <ProductBadge code={event.productCode} />
            <StatusBadge status={event.status} />
          </div>
        </div>

        <div className="spectator-bet-slip-layout">
          <div className="spectator-bet-entry-list">
            <div className="spectator-bet-entry-head">
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
                    className={selected ? 'spectator-bet-entry-row selected' : 'spectator-bet-entry-row'}
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

          <aside className="spectator-bet-slip-card">
            <div className="spectator-bet-slip-title">
              <h3>Phiếu cược</h3>
              <ReceiptText size={22} />
            </div>

            <div className="spectator-bet-slip-stack">
              <div className="spectator-bet-slip-selected">
                <span>Ngựa đã chọn</span>
                <strong>{selectedEntry?.horseName || 'Chưa chọn'}</strong>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">Stake</span>
                <input
                  className="spectator-bet-stake-input"
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
              <div className="spectator-bet-slip-summary">
                <span className="flex justify-between gap-3"><span>Ví khả dụng</span><strong>{money(availableBalance)}</strong></span>
                <span className="flex justify-between gap-3"><span>Min stake</span><strong>{money(event.minStake)}</strong></span>
                <span className="flex justify-between gap-3"><span>Daily max</span><strong>{money(event.maxDailyStake)}</strong></span>
                <span className="flex justify-between gap-3"><span>Estimated odds</span><strong>{selectedEntry?.estimatedOdds ? Number(selectedEntry.estimatedOdds).toFixed(2) : '-'}</strong></span>
                <span className="flex justify-between gap-3"><span>Estimated payout</span><strong>{money(estimatedPayout)}</strong></span>
              </div>
              <div className="spectator-bet-warning">
                <AlertTriangle size={16} />
                <span>Odds chỉ là ước tính. Payout cuối cùng được tính tự động khi Admin công bố kết quả.</span>
              </div>
              <button
                className="spectator-bet-primary-action"
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || String(event.status).toUpperCase() !== 'OPEN'}
              >
                {isSubmitting ? 'Đang đặt cược...' : 'Đặt cược'}
              </button>
              <button className="spectator-bet-secondary-action" type="button" onClick={() => setSelectedEntryId('')} disabled={isSubmitting}>
                Xóa lựa chọn
              </button>
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}

function canCancelTicket(ticket) {
  const status = String(ticket.status || '').toUpperCase();
  const eventStatus = String(ticket.betEventStatus || '').toUpperCase();
  const closeAt = ticket.bettingCloseAt ? new Date(ticket.bettingCloseAt) : null;
  return status === 'PLACED'
    && eventStatus === 'OPEN'
    && closeAt
    && Number.isFinite(closeAt.getTime())
    && Date.now() < closeAt.getTime();
}

function TicketDetailField({ label, value, emphasis = false }) {
  return (
    <div className={emphasis ? 'spectator-ticket-detail-field emphasis' : 'spectator-ticket-detail-field'}>
      <span>{label}</span>
      <strong>{value || 'Chưa cập nhật'}</strong>
    </div>
  );
}

function RaceDetailSummary({ event }) {
  return (
    <div className="spectator-ticket-race-summary">
      <div className="spectator-ticket-race-summary-header">
        <div>
          <p className="eyebrow">Race details</p>
          <h4>{event.raceName || 'Race chưa cập nhật'}</h4>
          <p>{event.trackName || 'Đường đua chưa cập nhật'} · {dateTime(event.raceStartTime)}</p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="spectator-ticket-race-metrics">
        <TicketDetailField label="Betting opens" value={dateTime(event.openAt)} />
        <TicketDetailField label="Betting closes" value={dateTime(event.closeAt)} />
        <TicketDetailField label="Total pool" value={money(event.totalStake)} emphasis />
        <TicketDetailField label="Daily max" value={money(event.maxDailyStake)} />
      </div>

      <div className="spectator-ticket-race-entry-list">
        <div className="spectator-ticket-race-entry-head">
          <span>Stall</span>
          <span>Horse</span>
          <span>Jockey</span>
          <span>Pool</span>
          <span>Odds</span>
        </div>
        {(event.entries || []).length === 0 ? (
          <div className="spectator-bet-empty compact">Race này chưa có entry để hiển thị.</div>
        ) : event.entries.map((entry) => (
          <div key={entry.raceEntryId} className="spectator-ticket-race-entry-row">
            <strong>#{entry.startingStall || '-'}</strong>
            <span className="min-w-0">
              <strong className="block truncate text-brown-900">{entry.horseName || 'N/A'}</strong>
              <small className="block truncate font-bold text-slate-500">Owner: {entry.ownerName || 'N/A'}</small>
            </span>
            <span className="truncate font-bold text-slate-600">{entry.jockeyName || 'N/A'}</span>
            <strong>{money(entry.poolStake)}</strong>
            <strong>{entry.estimatedOdds ? Number(entry.estimatedOdds).toFixed(2) : '-'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketDetailDialog({ ticket, cancellingTicketId, onCancelTicket, onClose }) {
  const isCancelling = Number(cancellingTicketId) === Number(ticket.betTicketId);
  const [raceDetail, setRaceDetail] = useState(null);
  const [raceError, setRaceError] = useState('');
  const [isRaceLoading, setIsRaceLoading] = useState(false);

  async function handleCancel(event) {
    event.stopPropagation();
    await onCancelTicket(ticket);
    onClose();
  }

  async function openRaceDetails() {
    if (!ticket?.betEventId || isRaceLoading) return;
    if (raceDetail) {
      setRaceDetail(null);
      return;
    }
    setIsRaceLoading(true);
    setRaceError('');
    try {
      setRaceDetail(await getBettingEvent(ticket.betEventId));
    } catch (err) {
      setRaceError(err.message || 'Không thể tải thông tin Race.');
    } finally {
      setIsRaceLoading(false);
    }
  }

  return (
    <div className="spectator-ticket-detail-backdrop" role="presentation" onClick={onClose}>
      <section
        className="spectator-ticket-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spectator-ticket-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="spectator-ticket-detail-header">
          <div>
            <p className="eyebrow">Ticket details</p>
            <h3 id="spectator-ticket-detail-title">Ticket #{ticket.betTicketId}</h3>
            <p>{ticket.raceName || 'Race chưa cập nhật'} · Stall {ticket.startingStall || '-'}</p>
          </div>
          <button className="spectator-ticket-detail-close" type="button" onClick={onClose} aria-label="Close ticket details">
            <X size={18} />
          </button>
        </div>

        <div className="spectator-ticket-detail-status-row">
          <ProductBadge code={ticket.productCode} />
          <StatusBadge status={ticket.status} />
          <StatusBadge status={ticket.betEventStatus} />
        </div>

        <div className="spectator-ticket-detail-grid">
          <button
            className="spectator-ticket-detail-field spectator-ticket-race-link emphasis"
            type="button"
            onClick={openRaceDetails}
            disabled={!ticket?.betEventId || isRaceLoading}
          >
            <span>Race</span>
            <strong>{ticket.raceName || 'Chưa cập nhật'}</strong>
            <small>{isRaceLoading ? 'Đang tải Race...' : raceDetail ? 'Ẩn Race details' : 'Click để xem Race details'}</small>
          </button>
          <TicketDetailField label="Horse" value={ticket.horseName} emphasis />
          <TicketDetailField label="Starting stall" value={ticket.startingStall ? `#${ticket.startingStall}` : '-'} />
          <TicketDetailField label="Product" value={ticket.productName || ticket.productCode} />
          <TicketDetailField label="Stake" value={money(ticket.stake)} emphasis />
          <TicketDetailField label="Odds" value={ticketOdds(ticket)} />
          <TicketDetailField label="Payout" value={money(ticket.payoutAmount)} emphasis />
          <TicketDetailField label="Placed at" value={dateTime(ticket.placedAt)} />
          <TicketDetailField label="Betting closes" value={dateTime(ticket.bettingCloseAt)} />
          <TicketDetailField label="Settled at" value={dateTime(ticket.settledAt)} />
        </div>

        {raceError && <div className="admin-alert error" role="alert">{raceError}</div>}
        {raceDetail && <RaceDetailSummary event={raceDetail} />}

        <div className="spectator-ticket-detail-note">
          <ReceiptText size={18} />
          <p>
            Ticket này theo dõi event cược cho Race đã chọn. Trạng thái payout cuối cùng sẽ được cập nhật sau khi kết quả Race được hệ thống settle.
          </p>
        </div>

        <div className="spectator-ticket-detail-actions">
          <button className="spectator-bet-secondary-action" type="button" onClick={onClose}>
            Đóng
          </button>
          {canCancelTicket(ticket) && (
            <button
              className="spectator-bet-danger-action"
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Đang hủy...' : 'Hủy ticket'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function MyTickets({
  tickets,
  statusFilter,
  setStatusFilter,
  productFilter,
  setProductFilter,
  cancellingTicketId,
  onCancelTicket
}) {
  const { t } = useLanguage();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const filtered = useMemo(() => tickets.filter((ticket) => {
    const status = String(ticket.status || '').toUpperCase();
    const product = String(ticket.productCode || '').toUpperCase();
    return (statusFilter === 'ALL' || status === statusFilter)
      && (productFilter === 'ALL' || product === productFilter);
  }), [tickets, statusFilter, productFilter]);

  function handleTicketKeyDown(event, ticket) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedTicket(ticket);
    }
  }

  return (
    <section className="spectator-bet-section">
      <div className="spectator-bet-section-header">
        <div>
          <p className="eyebrow">{t('spectatorTicketsEyebrow')}</p>
          <h2>{t('spectatorTicketsTitle')}</h2>
          <p>{t('spectatorTicketsDesc')}</p>
        </div>
        <div className="spectator-bet-filter-row">
          <select className="spectator-bet-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {ticketStatuses.map((status) => <option key={status} value={status}>{status === 'ALL' ? t('spectatorFilterAll') : formatDisplayLabel(status)}</option>)}
          </select>
          <select className="spectator-bet-select" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
            {productOptions.map((product) => <option key={product} value={product}>{product === 'ALL' ? t('spectatorFilterAll') : product}</option>)}
          </select>
        </div>
      </div>

      <div className="spectator-ticket-list">
        <div className="spectator-ticket-head">
          <span>{t('spectatorTicketColumn')}</span>
          <span>{t('spectatorRaceHorseColumn')}</span>
          <span>{t('spectatorProductColumn')}</span>
          <span>{t('spectatorStakeColumn')}</span>
          <span>{t('spectatorOddsColumn')}</span>
          <span>{t('spectatorPayoutColumn')}</span>
          <span>{t('spectatorStatusColumn')}</span>
          <span>Thao tác</span>
        </div>
        <div className="spectator-ticket-body">
          {filtered.length === 0 ? (
            <div className="spectator-bet-empty compact">{t('spectatorNoTickets')}</div>
          ) : filtered.map((ticket) => (
            <div
              key={ticket.betTicketId}
              className="spectator-ticket-row"
              role="button"
              tabIndex={0}
              aria-label={`Open betting ticket #${ticket.betTicketId} details`}
              onClick={() => setSelectedTicket(ticket)}
              onKeyDown={(event) => handleTicketKeyDown(event, ticket)}
            >
              <strong className="text-brown-900">#{ticket.betTicketId}</strong>
              <span className="min-w-0">
                <strong className="block truncate text-brown-900">{ticket.raceName}</strong>
                <small className="block truncate font-bold text-slate-500">#{ticket.startingStall} · {ticket.horseName || 'N/A'} · {formatDate(ticket.placedAt)}</small>
              </span>
              <ProductBadge code={ticket.productCode} />
              <strong>{money(ticket.stake)}</strong>
              <strong>{ticketOdds(ticket)}</strong>
              <strong>{money(ticket.payoutAmount)}</strong>
              <StatusBadge status={ticket.status} />
              {canCancelTicket(ticket) ? (
                <button
                  className="spectator-bet-danger-action"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCancelTicket(ticket);
                  }}
                  onKeyDown={(event) => event.stopPropagation()}
                  disabled={Number(cancellingTicketId) === Number(ticket.betTicketId)}
                >
                  {Number(cancellingTicketId) === Number(ticket.betTicketId) ? 'Đang hủy...' : 'Hủy'}
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-400">-</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          cancellingTicketId={cancellingTicketId}
          onCancelTicket={onCancelTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </section>
  );
}

export default function BettingPanel() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeView, setActiveView] = useState('events');
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
  const [cancellingTicketId, setCancellingTicketId] = useState(null);

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
      setError(err.message || t('spectatorBetLoadError'));
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
      setError(err.message || t('spectatorBetDetailError'));
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
      setMessage(t('spectatorBetSuccess'));
    } catch (err) {
      setFormError(err.message || t('spectatorBetError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelTicket(ticket) {
    if (!ticket?.betTicketId || cancellingTicketId) return;
    const confirmed = window.confirm(`Bạn có chắc muốn hủy vé cược #${ticket.betTicketId} không? Tiền cược sẽ được mở khóa trong ví.`);
    if (!confirmed) return;

    setCancellingTicketId(ticket.betTicketId);
    setError('');
    setMessage('');
    try {
      await cancelBetTicket(ticket.betTicketId);
      const [eventList, updatedTickets, updatedWallet, updatedEvent] = await Promise.all([
        getBettingEvents(),
        getMyBetTickets(),
        getMyWallet().catch(() => wallet),
        selectedEvent ? getBettingEvent(selectedEvent.betEventId).catch(() => selectedEvent) : Promise.resolve(null)
      ]);
      setEvents(eventList || []);
      setTickets(updatedTickets || []);
      setWallet(updatedWallet);
      if (selectedEvent) setSelectedEvent(updatedEvent);
      setMessage('Đã hủy vé cược. Tiền cược đã được mở khóa trong ví.');
    } catch (err) {
      setError(err.message || 'Không thể hủy vé cược.');
    } finally {
      setCancellingTicketId(null);
    }
  }

  const stats = useMemo(() => ({
    open: events.filter((event) => String(event.status).toUpperCase() === 'OPEN').length,
    tickets: tickets.length,
    placed: tickets.filter((ticket) => String(ticket.status).toUpperCase() === 'PLACED').length,
    balance: wallet?.availableBalance ?? 0
  }), [events, tickets, wallet]);

  return (
    <section className="spectator-betting-page">
      <section className="spectator-betting-hero">
        <div>
          <p className="eyebrow">{t('spectatorBettingEyebrow')}</p>
          <h2>{t('spectatorBettingTitle')}</h2>
          <p>{t('spectatorBettingDesc')}</p>
        </div>
        <button className="refresh-button" type="button" onClick={loadData} disabled={isLoading}>
          <RefreshCw size={17} /> {t('spectatorRefresh')}
        </button>
      </section>

      <section className="spectator-bet-stat-grid">
        <PanelStat label={t('spectatorOpenEvents')} value={stats.open} icon={Clock} />
        <PanelStat label={t('spectatorMyTickets')} value={stats.tickets} icon={ReceiptText} />
        <PanelStat label={t('spectatorPendingSettle')} value={stats.placed} icon={Ticket} />
        <PanelStat label={t('spectatorAvailableWallet')} value={money(stats.balance)} icon={Wallet} />
      </section>

      <div className="spectator-bet-view-tabs">
        <button
          className={activeView === 'events' && !selectedEvent ? 'active' : ''}
          type="button"
          onClick={() => {
            setSelectedEvent(null);
            setActiveView('events');
          }}
        >
          {t('spectatorEvents')}
        </button>
        <button
          className={activeView === 'tickets' && !selectedEvent ? 'active' : ''}
          type="button"
          onClick={() => {
            setSelectedEvent(null);
            setActiveView('tickets');
          }}
        >
          {t('spectatorMyTickets')}
        </button>
      </div>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}
      {isLoading && <div className="admin-alert success" role="status">{t('spectatorLoadingBetting')}</div>}

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
        activeView === 'events' ? (
          <BettingEventList
            events={events}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            onSelect={selectEvent}
          />
        ) : (
          <MyTickets
            tickets={tickets}
            statusFilter={ticketStatus}
            setStatusFilter={setTicketStatus}
            productFilter={ticketProduct}
            setProductFilter={setTicketProduct}
            cancellingTicketId={cancellingTicketId}
            onCancelTicket={cancelTicket}
          />
        )
      )}
    </section>
  );
}
