import { useEffect, useState } from 'react';
import { CircleDollarSign, RefreshCw, RotateCcw, Trophy, WalletCards } from 'lucide-react';
import { getFinanceOverview, retryPrizeDistribution } from '../../../services/financeService';

function formatVnd(value) {
  const number = Number(value || 0);
  return `${number.toLocaleString('vi-VN')} VND`;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default function FinancialManagement() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [error, setError] = useState('');

  async function loadOverview() {
    setLoading(true);
    setError('');
    try {
      setOverview(await getFinanceOverview());
    } catch (err) {
      setError(err.message || 'Unable to load financial overview.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function retryPayout(distributionId) {
    setRetryingId(distributionId);
    setError('');
    try {
      await retryPrizeDistribution(distributionId);
      await loadOverview();
    } catch (err) {
      setError(err.message || 'Unable to retry prize payout.');
    } finally {
      setRetryingId(null);
    }
  }

  const funds = overview?.tournamentFunds || [];
  const pendingPrizes = overview?.pendingPrizes || [];
  const transactions = overview?.recentTransactions || [];

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase text-brown-500">Financial control</p>
          <h2 className="mt-1 text-2xl font-black text-brown-900">System funds and payouts</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Registration fees fund tournaments. Betting fees fund the platform. Prize payouts are calculated by the system.
          </p>
        </div>
        <button
          className="outline-button compact-button inline-flex items-center gap-2"
          type="button"
          onClick={loadOverview}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {error && <div className="admin-alert error" role="alert">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['System fund', overview?.systemBalance, CircleDollarSign],
          ['Betting fee revenue', overview?.bettingFeeRevenue, WalletCards],
          ['Tournament funds', overview?.totalTournamentFunds, Trophy],
          [`Pending prizes (${overview?.pendingPrizeCount || 0})`, overview?.pendingPrizeAmount, RotateCcw]
        ].map(([label, value, Icon]) => (
          <article className="rounded-lg border border-brown-700/10 bg-white/75 p-5 shadow-sm" key={label}>
            <span className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-500">
              <Icon size={16} /> {label}
            </span>
            <strong className="mt-3 block text-2xl font-black text-brown-900">
              {loading ? '...' : formatVnd(value)}
            </strong>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/70">
        <div className="border-b border-brown-700/10 px-5 py-4">
          <h3 className="font-black text-brown-900">Tournament funds</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Collected registration fees and available prize balances.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream-200/70 text-xs uppercase text-slate-500">
              <tr><th className="p-4">Tournament</th><th className="p-4">Collected</th><th className="p-4">Prizes paid</th><th className="p-4">Available</th></tr>
            </thead>
            <tbody>
              {funds.length === 0 ? (
                <tr><td className="p-6 text-center font-semibold text-slate-500" colSpan="4">No tournament funds recorded.</td></tr>
              ) : funds.map((fund) => (
                <tr className="border-t border-brown-700/10" key={fund.tournamentId}>
                  <td className="p-4 font-extrabold text-brown-900">{fund.tournamentName}</td>
                  <td className="p-4 font-bold">{formatVnd(fund.collectedAmount)}</td>
                  <td className="p-4 font-bold">{formatVnd(fund.paidPrizeAmount)}</td>
                  <td className="p-4 font-black text-green-800">{formatVnd(fund.availableBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/70">
        <div className="border-b border-brown-700/10 px-5 py-4">
          <h3 className="font-black text-brown-900">Pending prize payouts</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">A payout waits until its tournament has enough funds and both recipient wallets are active.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-cream-200/70 text-xs uppercase text-slate-500">
              <tr><th className="p-4">Distribution</th><th className="p-4">Race</th><th className="p-4">Owner</th><th className="p-4">Jockey</th><th className="p-4">Total</th><th className="p-4 text-right">Action</th></tr>
            </thead>
            <tbody>
              {pendingPrizes.length === 0 ? (
                <tr><td className="p-6 text-center font-semibold text-slate-500" colSpan="6">No pending prize payouts.</td></tr>
              ) : pendingPrizes.map((prize) => (
                <tr className="border-t border-brown-700/10" key={prize.prizeDistributionId}>
                  <td className="p-4 font-extrabold">#{prize.prizeDistributionId}</td>
                  <td className="p-4">#{prize.raceId}</td>
                  <td className="p-4">#{prize.ownerId} · {formatVnd(prize.ownerAmount)}</td>
                  <td className="p-4">#{prize.jockeyId} · {formatVnd(prize.jockeyAmount)}</td>
                  <td className="p-4 font-black">{formatVnd(prize.totalPrize)}</td>
                  <td className="p-4 text-right">
                    <button
                      className="outline-button compact-button inline-flex items-center gap-2"
                      type="button"
                      onClick={() => retryPayout(prize.prizeDistributionId)}
                      disabled={retryingId === prize.prizeDistributionId}
                    >
                      <RotateCcw size={15} /> {retryingId === prize.prizeDistributionId ? 'Retrying...' : 'Retry'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/70">
        <div className="border-b border-brown-700/10 px-5 py-4">
          <h3 className="font-black text-brown-900">Fund ledger</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Latest registration income, prize payments, and betting fees.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-cream-200/70 text-xs uppercase text-slate-500">
              <tr><th className="p-4">Time</th><th className="p-4">Fund</th><th className="p-4">Type</th><th className="p-4">Direction</th><th className="p-4">Amount</th><th className="p-4">Balance</th></tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td className="p-6 text-center font-semibold text-slate-500" colSpan="6">No fund transactions recorded.</td></tr>
              ) : transactions.map((transaction) => (
                <tr className="border-t border-brown-700/10" key={transaction.fundTransactionId}>
                  <td className="p-4">{formatDateTime(transaction.createdAt)}</td>
                  <td className="p-4 font-extrabold">{transaction.fundKey}</td>
                  <td className="p-4">{String(transaction.transactionType).replaceAll('_', ' ')}</td>
                  <td className={`p-4 font-black ${transaction.direction === 'CREDIT' ? 'text-green-800' : 'text-red-700'}`}>{transaction.direction}</td>
                  <td className="p-4 font-bold">{formatVnd(transaction.amount)}</td>
                  <td className="p-4 font-bold">{formatVnd(transaction.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
