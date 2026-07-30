import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  betProductName,
  bettingAvailabilityFilters,
  bettingPhase,
  canReceiveBet,
  formatDate,
  formatDisplayLabel,
  matchesBettingAvailability,
  signedVnd,
  ticketFinancialOutcome
} from '../../lib';
import { formatVndCurrency } from '../../lib/eventFormatters';
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
const dailyLimitTicketStatuses = new Set(['PLACED', 'WON', 'LOST']);

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

function StatusBadge({ status }) {
  return <span className={`status-badge ${String(status || '').toLowerCase()}`}>{formatDisplayLabel(status)}</span>;
}

function ProductBadge({ code }) {
  const { t } = useLanguage();
  const label = betProductName(code, t);
  return <span className="bet-product-badge">{label}</span>;
}

function ticketOdds(ticket) {
  if (['REFUNDED', 'VOID'].includes(String(ticket?.status || '').toUpperCase())) return '-';
  if (ticket?.finalOdds) return Number(ticket.finalOdds).toFixed(2);
  if (ticket?.estimatedOddsAtBet) return Number(ticket.estimatedOddsAtBet).toFixed(2);
  return '-';
}

function refundReasonLabel(reason) {
  const labels = {
    USER_CANCELLED: 'Người chơi hủy vé trong thời gian cho phép',
    RACE_RESULT_REJECTED: 'Kết quả đua bị Admin từ chối',
    NO_WINNING_BETS: 'Không có vé chọn đúng kết quả thắng',
    INSUFFICIENT_SYSTEM_RESERVE: 'Quỹ dự phòng không đủ bảo chứng odds tối thiểu'
  };
  return labels[String(reason || '').toUpperCase()] || reason || 'Không áp dụng';
}

function productKey(item) {
  return String(item?.productCode || item?.betProductId || '').toUpperCase();
}

function isToday(value, today = new Date()) {
  const date = value ? new Date(value) : null;
  return Boolean(date && Number.isFinite(date.getTime())
    && date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate());
}

function TicketFinancialResult({ ticket }) {
  const { t } = useLanguage();
  const outcome = ticketFinancialOutcome(ticket);
  if (!outcome.settled) {
    return <span className="spectator-ticket-financial-result pending">{t('spectatorResultPending')}</span>;
  }

  return (
    <span className={`spectator-ticket-financial-result ${outcome.tone}`}>
      <strong>{signedVnd(outcome.net)}</strong>
      <small>{t('spectatorPayoutReceived')}: {money(outcome.payout)}</small>
    </span>
  );
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

function BettingEventList({
  events,
  availabilityFilter,
  setAvailabilityFilter,
  selectedProduct,
  setSelectedProduct,
  dailyStakeByProduct,
  onSelect
}) {
  const { t } = useLanguage();
  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => (
      matchesBettingAvailability(event, availabilityFilter, now)
      && (selectedProduct === 'ALL'
        || String(event.productCode).toUpperCase() === selectedProduct)
    ));
  }, [availabilityFilter, events, selectedProduct]);

  return (
    <section className="spectator-bet-section">
      <div className="spectator-bet-section-header">
        <div>
          <p className="eyebrow">{t('spectatorBettingEyebrow')}</p>
          <h2>{t('spectatorBettingTitle')}</h2>
          <p>{t('spectatorBettingDesc')}</p>
        </div>
        <div className="spectator-bet-filter-row">
          <label className="spectator-bet-filter-field">
            <span>{t('spectatorAvailabilityFilter')}</span>
            <select
              className="spectator-bet-select"
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value)}
            >
              {bettingAvailabilityFilters.map((option) => (
                <option key={option} value={option}>
                  {t(`spectatorAvailability${option}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="spectator-bet-filter-field">
            <span>{t('spectatorProductFilter')}</span>
            <select
              className="spectator-bet-select"
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
            >
              {productOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? t('spectatorFilterAll') : betProductName(option, t)}
                </option>
              ))}
            </select>
          </label>
        </div>
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
            const phase = bettingPhase(event);
            const isOpen = phase === 'OPEN';
            const isUpcoming = phase === 'UPCOMING';
            const dailyStakeUsed = dailyStakeByProduct[productKey(event)] || 0;
            return (
              <article key={event.betEventId} className={`spectator-bet-event-card ${phase.toLowerCase()}`}>
                <div className="spectator-bet-event-top">
                  <div>
                    <div className="spectator-bet-badge-row">
                      <ProductBadge code={event.productCode} />
                      <StatusBadge status={phase} />
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
                    <span>{t('spectatorBetOpen')}</span>
                    <strong>{dateTime(event.openAt)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorBetClose')}</span>
                    <strong>{dateTime(event.closeAt)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorRaceStart')}</span>
                    <strong>{dateTime(event.raceStartTime)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorEventPool')}</span>
                    <strong>{money(event.totalStake)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorRaceTotalPool')}</span>
                    <strong>{money(event.raceTotalStake)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorDailyMax')}</span>
                    <strong>{money(event.maxDailyStake)}</strong>
                  </div>
                  <div>
                    <span>{t('spectatorDailyStakeUsed')}</span>
                    <strong>{money(dailyStakeUsed)}</strong>
                  </div>
                </div>

                <button
                  className={phase === 'CLOSED' ? 'spectator-bet-primary-action disabled' : 'spectator-bet-primary-action'}
                  type="button"
                  onClick={() => onSelect(event.betEventId)}
                  disabled={phase === 'CLOSED'}
                >
                  {isOpen
                    ? t('spectatorViewBet')
                    : isUpcoming
                      ? t('spectatorViewUpcomingBet')
                      : t('spectatorBetClosed')}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BetEventDetail({
  event,
  wallet,
  dailyStakeUsed,
  selectedEntryId,
  onSelectEntry,
  stake,
  onStakeChange,
  formErrors,
  isSubmitting,
  onBack,
  onSubmit
}) {
  const { t } = useLanguage();
  const selectedEntry = event?.entries?.find((entry) => Number(entry.raceEntryId) === Number(selectedEntryId));
  const stakeNumber = Number(stake || 0);
  const estimatedPayout = selectedEntry?.estimatedOdds && stakeNumber > 0
    ? stakeNumber * Number(selectedEntry.estimatedOdds)
    : 0;
  const availableBalance = Number(wallet?.availableBalance ?? 0);
  const phase = bettingPhase(event);
  const isOpen = canReceiveBet(event);
  const minStake = Number(event.minStake || 10000);
  const maxDailyStake = Number(event.maxDailyStake || 0);
  const dailyStakeRemaining = maxDailyStake > 0
    ? Math.max(maxDailyStake - dailyStakeUsed, 0)
    : null;
  const quickStakeOptions = [...new Set([minStake, 50000, 100000])]
    .filter((value) => value >= minStake
      && (dailyStakeRemaining === null || value <= dailyStakeRemaining)
      && value <= availableBalance)
    .slice(0, 3);

  return (
    <section className="spectator-bet-detail-page">
      <button className="spectator-bet-back-button" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> {t('spectatorBack')}
      </button>

      <section className="spectator-bet-section">
        <div className="spectator-bet-section-header">
          <div>
            <p className="eyebrow">{t('spectatorBetSlip')}</p>
            <h2>{event.raceName}</h2>
            <p>{event.trackName} · {dateTime(event.raceStartTime)}</p>
          </div>
          <div className="spectator-bet-badge-row">
            <ProductBadge code={event.productCode} />
            <StatusBadge status={phase} />
          </div>
        </div>

        <div className="spectator-bet-detail-timing">
          <TicketDetailField label={t('spectatorBetOpen')} value={dateTime(event.openAt)} />
          <TicketDetailField label={t('spectatorBetClose')} value={dateTime(event.closeAt)} />
          <TicketDetailField label={t('spectatorRaceStart')} value={dateTime(event.raceStartTime)} />
          <TicketDetailField label={t('spectatorRaceTotalPool')} value={money(event.raceTotalStake)} emphasis />
        </div>

        {!isOpen && (
          <div className="spectator-bet-availability-notice" role="status">
            <Clock size={18} />
            <div>
              <strong>{phase === 'UPCOMING' ? t('spectatorBetNotOpenTitle') : t('spectatorBetClosed')}</strong>
              <span>
                {phase === 'UPCOMING'
                  ? t('spectatorBetOpensAt').replace('{{time}}', dateTime(event.openAt))
                  : t('spectatorBetClosedAt').replace('{{time}}', dateTime(event.closeAt))}
              </span>
            </div>
          </div>
        )}

        <div className="spectator-bet-slip-layout">
          <div className="spectator-bet-entry-list">
            <div className="spectator-bet-entry-guidance">
              <div>
                <strong>{t('spectatorChooseHorseTitle')}</strong>
                <span>{isOpen ? t('spectatorChooseHorseDesc') : t('spectatorChooseHorsePreview')}</span>
              </div>
              {selectedEntry && <span className="spectator-bet-selection-pill"><Check size={14} /> {selectedEntry.horseName}</span>}
            </div>
            <div className="spectator-bet-entry-head">
              <span>{t('spectatorStallColumn')}</span>
              <span>{t('spectatorHorseColumn')}</span>
              <span>{t('spectatorJockeyColumn')}</span>
              <span>{t('spectatorPoolColumn')}</span>
              <span>{t('spectatorOddsShortColumn')}</span>
            </div>

            <div className="divide-y divide-brown-700/10">
              {(event.entries || []).map((entry) => {
                const selected = Number(entry.raceEntryId) === Number(selectedEntryId);
                return (
                  <button
                    key={entry.raceEntryId}
                    type="button"
                    onClick={() => onSelectEntry(entry.raceEntryId)}
                    className={selected ? 'spectator-bet-entry-row selected' : 'spectator-bet-entry-row'}
                    aria-pressed={selected}
                    disabled={!isOpen || isSubmitting}
                  >
                    <span className="spectator-bet-stall">
                      {selected && <Check size={14} />}
                      #{entry.startingStall}
                    </span>
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
            <FieldError>{formErrors.entry}</FieldError>
          </div>

          <aside className="spectator-bet-slip-card">
            <div className="spectator-bet-slip-title">
              <h3>{t('spectatorBetSlip')}</h3>
              <ReceiptText size={22} />
            </div>

            <div className="spectator-bet-slip-stack">
              <div className={selectedEntry ? 'spectator-bet-slip-selected selected' : 'spectator-bet-slip-selected missing'}>
                <span>{t('spectatorSelectedHorse')}</span>
                <strong>{selectedEntry?.horseName || t('spectatorNoHorseSelected')}</strong>
                {selectedEntry && <small>Stall #{selectedEntry.startingStall} · Odds {selectedEntry.estimatedOdds ? Number(selectedEntry.estimatedOdds).toFixed(2) : '-'}</small>}
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-extrabold text-brown-900">{t('spectatorStakeLabel')}</span>
                <input
                  className={formErrors.stake ? 'spectator-bet-stake-input invalid' : 'spectator-bet-stake-input'}
                  type="number"
                  min={event.minStake || 10000}
                  step="10000"
                  value={stake}
                  onChange={(changeEvent) => onStakeChange(changeEvent.target.value)}
                  placeholder="10000"
                  disabled={!isOpen || isSubmitting}
                  aria-invalid={Boolean(formErrors.stake)}
                />
                <FieldError>{formErrors.stake}</FieldError>
              </label>
              {isOpen && (
                <div className="spectator-bet-quick-stakes">
                  <span>{t('spectatorQuickStake')}</span>
                  <div>
                    {quickStakeOptions.map((value) => (
                      <button key={value} type="button" onClick={() => onStakeChange(String(value))}>
                        {money(value)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {stakeNumber > 0 && <p className="spectator-bet-stake-preview">{t('spectatorStakePreview')}: <strong>{money(stakeNumber)}</strong></p>}
              <FieldError>{formErrors.general}</FieldError>
              <div className="spectator-bet-slip-summary">
                <span className="flex justify-between gap-3"><span>{t('spectatorWalletAvailable')}</span><strong>{money(availableBalance)}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorMinStake')}</span><strong>{money(event.minStake)}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorDailyMax')}</span><strong>{money(event.maxDailyStake)}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorDailyStakeUsed')}</span><strong>{money(dailyStakeUsed)}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorDailyStakeRemaining')}</span><strong>{dailyStakeRemaining === null ? '-' : money(dailyStakeRemaining)}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorEstimatedOdds')}</span><strong>{selectedEntry?.estimatedOdds ? Number(selectedEntry.estimatedOdds).toFixed(2) : '-'}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorMinimumOdds')}</span><strong>{Number(event.minimumOdds || 1.05).toFixed(2)}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorOperatorFee')}</span><strong>{(Number(event.operatorFeeRate || 0) * 100).toFixed(1)}%</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorEstimatedPayout')}</span><strong>{money(estimatedPayout)}</strong></span>
                <span className="flex justify-between gap-3"><span>{t('spectatorEstimatedProfit')}</span><strong>{money(Math.max(estimatedPayout - stakeNumber, 0))}</strong></span>
              </div>
              <div className="spectator-bet-warning">
                <AlertTriangle size={16} />
                <span>{t('spectatorBettingRulesNotice')}</span>
              </div>
              <button
                className="spectator-bet-primary-action"
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || !isOpen}
              >
                {isSubmitting
                  ? t('spectatorSubmittingBet')
                  : isOpen
                    ? t('spectatorPlaceBet')
                    : phase === 'UPCOMING'
                      ? t('spectatorBetNotOpenTitle')
                      : t('spectatorBetClosed')}
              </button>
              <button className="spectator-bet-secondary-action" type="button" onClick={() => onSelectEntry('')} disabled={isSubmitting || !selectedEntryId}>
                {t('spectatorClearSelection')}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}

function BetConfirmationDialog({
  event,
  selectedEntry,
  stake,
  dailyStakeUsed,
  wallet,
  isSubmitting,
  onClose,
  onConfirm
}) {
  const { t } = useLanguage();
  const stakeNumber = Number(stake || 0);
  const estimatedOdds = Number(selectedEntry?.estimatedOdds || 0);
  const estimatedPayout = estimatedOdds > 0 ? stakeNumber * estimatedOdds : 0;
  const maxDailyStake = Number(event?.maxDailyStake || 0);
  const remainingAfterBet = maxDailyStake > 0
    ? Math.max(maxDailyStake - dailyStakeUsed - stakeNumber, 0)
    : null;
  const walletAfterBet = Math.max(Number(wallet?.availableBalance || 0) - stakeNumber, 0);

  useEffect(() => {
    function closeOnEscape(keyEvent) {
      if (keyEvent.key === 'Escape' && !isSubmitting) onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isSubmitting, onClose]);

  return (
    <div
      className="spectator-ticket-detail-backdrop"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <section
        className="spectator-ticket-detail-modal spectator-bet-confirmation-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="spectator-bet-confirmation-title"
        aria-describedby="spectator-bet-confirmation-description"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="spectator-ticket-detail-header">
          <div>
            <p className="eyebrow">{t('spectatorBetConfirmationEyebrow')}</p>
            <h3 id="spectator-bet-confirmation-title">{t('spectatorBetConfirmationTitle')}</h3>
            <p id="spectator-bet-confirmation-description">{t('spectatorBetConfirmationDesc')}</p>
          </div>
          <button
            className="spectator-ticket-detail-close"
            type="button"
            onClick={onClose}
            aria-label={t('spectatorBetConfirmationCancel')}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="spectator-ticket-detail-status-row">
          <ProductBadge code={event.productCode} />
          <StatusBadge status={bettingPhase(event)} />
        </div>

        <div className="spectator-ticket-detail-grid">
          <TicketDetailField label={t('spectatorRaceColumn')} value={event.raceName} />
          <TicketDetailField
            label={t('spectatorSelectedHorse')}
            value={`#${selectedEntry?.startingStall || '-'} · ${selectedEntry?.horseName || '-'}`}
            emphasis
          />
          <TicketDetailField label={t('spectatorStakeColumn')} value={money(stakeNumber)} emphasis />
          <TicketDetailField
            label={t('spectatorEstimatedOdds')}
            value={estimatedOdds > 0 ? estimatedOdds.toFixed(2) : '-'}
          />
          <TicketDetailField label={t('spectatorEstimatedPayout')} value={money(estimatedPayout)} />
          <TicketDetailField label={t('spectatorMinimumOdds')} value={Number(event.minimumOdds || 1.05).toFixed(2)} />
          <TicketDetailField label={t('spectatorEstimatedProfit')} value={money(Math.max(estimatedPayout - stakeNumber, 0))} />
          <TicketDetailField label={t('spectatorWalletAfterBet')} value={money(walletAfterBet)} />
          <TicketDetailField label={t('spectatorDailyStakeUsed')} value={money(dailyStakeUsed)} />
          <TicketDetailField
            label={t('spectatorDailyStakeRemainingAfterBet')}
            value={remainingAfterBet === null ? '-' : money(remainingAfterBet)}
          />
        </div>

        <div className="spectator-ticket-detail-note spectator-bet-confirmation-note">
          <AlertTriangle size={18} />
          <p>{t('spectatorBettingRulesNotice')}</p>
        </div>

        <div className="spectator-ticket-detail-actions">
          <button
            className="spectator-bet-secondary-action"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('spectatorBetConfirmationCancel')}
          </button>
          <button
            className="spectator-bet-primary-action"
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('spectatorSubmittingBet') : t('spectatorBetConfirmationConfirm')}
          </button>
        </div>
      </section>
    </div>
  );
}

function CancelBetConfirmationDialog({
  ticket,
  isCancelling,
  onClose,
  onConfirm
}) {
  const { t } = useLanguage();

  useEffect(() => {
    function closeOnEscape(keyEvent) {
      if (keyEvent.key === 'Escape' && !isCancelling) onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isCancelling, onClose]);

  return (
    <div
      className="spectator-ticket-detail-backdrop"
      role="presentation"
      onClick={() => {
        if (!isCancelling) onClose();
      }}
    >
      <section
        className="spectator-ticket-detail-modal spectator-bet-confirmation-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="spectator-cancel-bet-title"
        aria-describedby="spectator-cancel-bet-description"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="spectator-ticket-detail-header">
          <div>
            <p className="eyebrow">{t('spectatorCancelBetEyebrow')}</p>
            <h3 id="spectator-cancel-bet-title">
              {t('spectatorCancelBetTitle').replace('{{ticketId}}', ticket.betTicketId)}
            </h3>
            <p id="spectator-cancel-bet-description">{t('spectatorCancelBetDesc')}</p>
          </div>
          <button
            className="spectator-ticket-detail-close"
            type="button"
            onClick={onClose}
            aria-label={t('spectatorCancelBetBack')}
            disabled={isCancelling}
          >
            <X size={20} />
          </button>
        </div>

        <div className="spectator-ticket-detail-status-row">
          <ProductBadge code={ticket.productCode} />
          <StatusBadge status={ticket.status} />
        </div>

        <div className="spectator-ticket-detail-grid">
          <TicketDetailField label={t('spectatorTicketColumn')} value={`#${ticket.betTicketId}`} />
          <TicketDetailField label={t('spectatorRaceColumn')} value={ticket.raceName} />
          <TicketDetailField
            label={t('spectatorSelectedHorse')}
            value={`#${ticket.startingStall || '-'} · ${ticket.horseName || '-'}`}
          />
          <TicketDetailField
            label={t('spectatorCancelBetRefundAmount')}
            value={money(ticket.stake)}
            emphasis
          />
        </div>

        <div className="spectator-ticket-detail-note spectator-cancel-bet-note">
          <AlertTriangle size={18} />
          <p>{t('spectatorCancelBetNotice')}</p>
        </div>

        <div className="spectator-ticket-detail-actions">
          <button
            className="spectator-bet-secondary-action"
            type="button"
            onClick={onClose}
            disabled={isCancelling}
          >
            {t('spectatorCancelBetBack')}
          </button>
          <button
            className="spectator-bet-danger-action"
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
          >
            {isCancelling ? t('spectatorCancellingBet') : t('spectatorCancelBetConfirm')}
          </button>
        </div>
      </section>
    </div>
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

function TicketDetailField({ label, value, emphasis = false, valueTone = '' }) {
  return (
    <div className={emphasis ? 'spectator-ticket-detail-field emphasis' : 'spectator-ticket-detail-field'}>
      <span>{label}</span>
      <strong className={valueTone ? `financial-${valueTone}` : undefined}>{value || 'Chưa cập nhật'}</strong>
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
  const { t } = useLanguage();
  const isCancelling = Number(cancellingTicketId) === Number(ticket.betTicketId);
  const financialOutcome = ticketFinancialOutcome(ticket);
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
          <TicketDetailField label="Product" value={betProductName(ticket.productCode, t, ticket.productName)} />
          <TicketDetailField label={t('spectatorStakeColumn')} value={money(ticket.stake)} emphasis />
          <TicketDetailField label={t('spectatorOddsColumn')} value={ticketOdds(ticket)} />
          <TicketDetailField
            label={t('spectatorPayoutReceived')}
            value={financialOutcome.settled ? money(financialOutcome.payout) : t('spectatorResultPending')}
          />
          <TicketDetailField
            label={t('spectatorNetResult')}
            value={financialOutcome.settled ? signedVnd(financialOutcome.net) : t('spectatorResultPending')}
            emphasis
            valueTone={financialOutcome.tone}
          />
          <TicketDetailField label="Placed at" value={dateTime(ticket.placedAt)} />
          <TicketDetailField label="Betting closes" value={dateTime(ticket.bettingCloseAt)} />
          <TicketDetailField label="Settled at" value={dateTime(ticket.settledAt)} />
          {['REFUNDED', 'VOID'].includes(String(ticket.status || '').toUpperCase()) && (
            <TicketDetailField label="Lý do hoàn tiền" value={refundReasonLabel(ticket.refundReason)} emphasis />
          )}
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
  const historyTotals = useMemo(() => tickets.reduce((totals, ticket) => {
    const outcome = ticketFinancialOutcome(ticket);
    totals.stake += Number(ticket.stake || 0);
    if (outcome.settled) {
      totals.payout += Number(outcome.payout || 0);
      totals.net += Number(outcome.net || 0);
      totals.settled += 1;
    }
    return totals;
  }, { stake: 0, payout: 0, net: 0, settled: 0 }), [tickets]);

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
            {productOptions.map((product) => (
              <option key={product} value={product}>
                {product === 'ALL' ? t('spectatorFilterAll') : betProductName(product, t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="spectator-ticket-history-summary">
        <PanelStat label={t('spectatorHistoryTotalStake')} value={money(historyTotals.stake)} icon={CircleDollarSign} />
        <PanelStat label={t('spectatorHistoryTotalPayout')} value={money(historyTotals.payout)} icon={Wallet} />
        <PanelStat label={t('spectatorHistoryNetResult')} value={signedVnd(historyTotals.net)} icon={Check} />
        <PanelStat label={t('spectatorHistorySettledTickets')} value={`${historyTotals.settled}/${tickets.length}`} icon={ReceiptText} />
      </div>

      <div className="spectator-ticket-list">
        <div className="spectator-ticket-head">
          <span>{t('spectatorTicketColumn')}</span>
          <span>{t('spectatorRaceHorseColumn')}</span>
          <span>{t('spectatorProductColumn')}</span>
          <span>{t('spectatorStakeColumn')}</span>
          <span>{t('spectatorOddsColumn')}</span>
          <span>{t('spectatorNetResult')}</span>
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
              <TicketFinancialResult ticket={ticket} />
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
  const [availabilityFilter, setAvailabilityFilter] = useState('AVAILABLE');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [ticketStatus, setTicketStatus] = useState('ALL');
  const [ticketProduct, setTicketProduct] = useState('ALL');
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [stake, setStake] = useState('');
  const [formErrors, setFormErrors] = useState({ entry: '', stake: '', general: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingBet, setIsConfirmingBet] = useState(false);
  const [cancellingTicketId, setCancellingTicketId] = useState(null);
  const [ticketPendingCancellation, setTicketPendingCancellation] = useState(null);
  const submissionInFlightRef = useRef(false);
  const cancellationInFlightRef = useRef(false);
  const dailyStakeByProduct = useMemo(() => {
    const today = new Date();
    return tickets.reduce((totals, ticket) => {
      const status = String(ticket.status || '').toUpperCase();
      const key = productKey(ticket);
      if (key && dailyLimitTicketStatuses.has(status) && isToday(ticket.placedAt, today)) {
        totals[key] = (totals[key] || 0) + Number(ticket.stake || 0);
      }
      return totals;
    }, {});
  }, [tickets]);
  const selectedEventDailyStake = selectedEvent
    ? dailyStakeByProduct[productKey(selectedEvent)] || 0
    : 0;

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
    setFormErrors({ entry: '', stake: '', general: '' });
    try {
      setSelectedEvent(await getBettingEvent(eventId));
    } catch (err) {
      setError(err.message || t('spectatorBetDetailError'));
    } finally {
      setIsLoading(false);
    }
  }

  function selectEntry(entryId) {
    setSelectedEntryId(entryId);
    setFormErrors((current) => ({ ...current, entry: '', general: '' }));
  }

  function changeStake(value) {
    setStake(value);
    setFormErrors((current) => ({ ...current, stake: '', general: '' }));
  }

  function validateBet() {
    const stakeNumber = Number(stake);
    const minStake = Number(selectedEvent?.minStake || 10000);
    const maxDailyStake = Number(selectedEvent?.maxDailyStake || 0);
    const dailyStakeRemaining = Math.max(maxDailyStake - selectedEventDailyStake, 0);
    const availableBalance = Number(wallet?.availableBalance ?? 0);
    const errors = { entry: '', stake: '', general: '' };

    if (!canReceiveBet(selectedEvent)) {
      errors.general = bettingPhase(selectedEvent) === 'UPCOMING'
        ? t('spectatorBetOpensAt').replace('{{time}}', dateTime(selectedEvent?.openAt))
        : t('spectatorBetClosedAt').replace('{{time}}', dateTime(selectedEvent?.closeAt));
    }
    if (!selectedEntryId) {
      errors.entry = t('spectatorSelectHorseError');
    }
    if (!stake || !Number.isFinite(stakeNumber) || stakeNumber <= 0) {
      errors.stake = t('spectatorStakeRequiredError');
    } else if (stakeNumber < minStake) {
      errors.stake = t('spectatorStakeMinError').replace('{{amount}}', money(minStake));
    } else if (maxDailyStake > 0 && stakeNumber > dailyStakeRemaining) {
      errors.stake = t('spectatorStakeDailyRemainingError')
        .replace('{{used}}', money(selectedEventDailyStake))
        .replace('{{remaining}}', money(dailyStakeRemaining));
    } else if (stakeNumber > availableBalance) {
      errors.stake = t('spectatorStakeBalanceError').replace('{{amount}}', money(availableBalance));
    }
    return errors;
  }

  function requestBetConfirmation() {
    const validationErrors = validateBet();
    setFormErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;
    setIsConfirmingBet(true);
  }

  async function submitBet() {
    if (submissionInFlightRef.current) return;

    const validationErrors = validateBet();
    setFormErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) {
      setIsConfirmingBet(false);
      return;
    }

    submissionInFlightRef.current = true;
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
      setFormErrors({ entry: '', stake: '', general: '' });
      setIsConfirmingBet(false);
      setMessage(t('spectatorBetSuccess'));
    } catch (err) {
      setIsConfirmingBet(false);
      setFormErrors((current) => ({
        ...current,
        general: err.message || t('spectatorBetError')
      }));
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  function requestCancelTicket(ticket) {
    if (!ticket?.betTicketId || cancellationInFlightRef.current) return;
    setTicketPendingCancellation(ticket);
  }

  async function cancelTicket() {
    const ticket = ticketPendingCancellation;
    if (!ticket?.betTicketId || cancellationInFlightRef.current) return;

    cancellationInFlightRef.current = true;
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
      setTicketPendingCancellation(null);
      setMessage(t('spectatorCancelBetSuccess'));
    } catch (err) {
      setTicketPendingCancellation(null);
      setError(err.message || t('spectatorCancelBetError'));
    } finally {
      cancellationInFlightRef.current = false;
      setCancellingTicketId(null);
    }
  }

  const stats = useMemo(() => ({
    open: events.filter((event) => canReceiveBet(event)).length,
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
          dailyStakeUsed={selectedEventDailyStake}
          selectedEntryId={selectedEntryId}
          onSelectEntry={selectEntry}
          stake={stake}
          onStakeChange={changeStake}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          onBack={() => setSelectedEvent(null)}
          onSubmit={requestBetConfirmation}
        />
      ) : (
        activeView === 'events' ? (
          <BettingEventList
            events={events}
            availabilityFilter={availabilityFilter}
            setAvailabilityFilter={setAvailabilityFilter}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            dailyStakeByProduct={dailyStakeByProduct}
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
            onCancelTicket={requestCancelTicket}
          />
        )
      )}

      {isConfirmingBet && selectedEvent && (
        <BetConfirmationDialog
          event={selectedEvent}
          selectedEntry={(selectedEvent.entries || []).find(
            (entry) => Number(entry.raceEntryId) === Number(selectedEntryId)
          )}
          stake={stake}
          dailyStakeUsed={selectedEventDailyStake}
          wallet={wallet}
          isSubmitting={isSubmitting}
          onClose={() => setIsConfirmingBet(false)}
          onConfirm={submitBet}
        />
      )}

      {ticketPendingCancellation && (
        <CancelBetConfirmationDialog
          ticket={ticketPendingCancellation}
          isCancelling={Number(cancellingTicketId) === Number(ticketPendingCancellation.betTicketId)}
          onClose={() => setTicketPendingCancellation(null)}
          onConfirm={cancelTicket}
        />
      )}
    </section>
  );
}
