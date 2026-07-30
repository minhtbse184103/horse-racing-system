import { formatVndCurrency } from './eventFormatters.js';

export function ticketFinancialOutcome(ticket) {
  const status = String(ticket?.status || '').toUpperCase();
  const stake = Number(ticket?.stake || 0);
  const payout = Number(ticket?.payoutAmount || 0);

  if (status === 'WON') {
    const net = payout - stake;
    return { settled: true, payout, net, tone: net >= 0 ? 'positive' : 'negative' };
  }
  if (status === 'LOST') {
    return { settled: true, payout: 0, net: -stake, tone: 'negative' };
  }
  if (status === 'REFUNDED' || status === 'VOID') {
    return { settled: true, payout: stake, net: 0, tone: 'neutral' };
  }
  return { settled: false, payout: null, net: null, tone: 'pending' };
}

export function signedVnd(value) {
  const amount = Number(value || 0);
  if (amount > 0) return `+${formatVndCurrency(amount)}`;
  if (amount < 0) return `−${formatVndCurrency(Math.abs(amount))}`;
  return formatVndCurrency(0);
}
