import { ArrowUpRight, CircleDollarSign, Loader2, Settings2, Ticket, X } from 'lucide-react';
import { dateTime, IconButton, money, StatCard, StatusBadge } from './bettingUi';

export default function BettingEventDetailDrawer({ detail, settlementDetail, isLoading, error, onClose, onViewSettlement }) {
  const event = detail?.event;
  const tickets = settlementDetail?.tickets || detail?.tickets || [];
  const settlement = settlementDetail?.settlement || detail?.settlement;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-brown-950/45 backdrop-blur-sm">
      <aside className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-[-24px_0_70px_rgba(43,23,16,0.25)]">
        <header className="sticky top-0 z-10 border-b border-brown-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brown-500">Betting Detail</p>
              <h2 className="mt-1 truncate text-2xl font-black text-brown-950">
                {event?.raceName || settlement?.raceName || 'Chi tiết betting'}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {event ? `${event.trackName} · ${dateTime(event.raceStartTime)}` : settlement ? `${settlement.trackName} · ${dateTime(settlement.raceStartTime)}` : 'Đang tải dữ liệu'}
              </p>
            </div>
            <IconButton label="Đóng" icon={X} onClick={onClose} />
          </div>
        </header>

        <div className="space-y-5 p-6">
          {isLoading && (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-brown-200 bg-cream-50 text-sm font-black text-brown-700">
              <Loader2 className="mr-2 animate-spin" size={18} /> Đang tải chi tiết...
            </div>
          )}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

          {!isLoading && !error && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Total stake" value={money(event?.totalStake || settlement?.totalStake)} description="Tổng tiền cược ghi nhận" icon={CircleDollarSign} tone="text-emerald-700" />
                <StatCard label="Operator fee" value={money(settlement?.operatorFee)} description="Phí hệ thống từ settlement" icon={Settings2} tone="text-amber-700" />
                <StatCard label="Ticket count" value={tickets.length} description="Tổng ticket liên quan" icon={Ticket} tone="text-sky-700" />
              </div>

              {event?.entries?.length > 0 && (
                <section className="rounded-2xl border border-brown-200 bg-white">
                  <div className="border-b border-brown-100 px-5 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-brown-500">Pool by RaceEntry</p>
                    <h3 className="mt-1 text-xl font-black text-brown-950">Tỷ lệ ước tính theo RaceEntry</h3>
                  </div>
                  <div className="divide-y divide-brown-100">
                    {event.entries.map((entry) => (
                      <div className="grid gap-3 px-5 py-4 lg:grid-cols-[4rem_minmax(0,1.5fr)_minmax(0,1fr)_9rem_7rem]" key={entry.raceEntryId}>
                        <strong className="rounded-lg bg-cream-100 px-3 py-2 text-center text-brown-800">#{entry.startingStall}</strong>
                        <div className="min-w-0">
                          <strong className="block truncate text-brown-950">{entry.horseName || 'N/A'}</strong>
                          <span className="text-sm font-semibold text-slate-500">Owner: {entry.ownerName || 'N/A'}</span>
                        </div>
                        <span className="truncate font-bold text-slate-600">Jockey: {entry.jockeyName || 'N/A'}</span>
                        <strong>{money(entry.poolStake)}</strong>
                        <strong className="text-emerald-700">{entry.estimatedOdds ? Number(entry.estimatedOdds).toFixed(2) : '-'}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-brown-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-brown-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-brown-500">Ticket History</p>
                    <h3 className="mt-1 text-xl font-black text-brown-950">Lịch sử ticket</h3>
                  </div>
                  {event?.settlement && (
                    <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brown-200 bg-white px-4 text-sm font-black text-brown-700 transition hover:bg-cream-100" type="button" onClick={() => onViewSettlement(event.settlement.betSettlementId)}>
                      <ArrowUpRight size={16} /> Xem settlement
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full table-fixed">
                    <colgroup>
                      <col className="w-[18%]" />
                      <col className="w-[24%]" />
                      <col className="w-[15%]" />
                      <col className="w-[15%]" />
                      <col className="w-[14%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead className="bg-cream-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Ticket</th>
                        <th className="px-5 py-3">Selection</th>
                        <th className="px-5 py-3">Stake</th>
                        <th className="px-5 py-3">Payout</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3">Placed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown-100 text-sm">
                      {tickets.length === 0 ? (
                        <tr>
                          <td className="px-5 py-10 text-center font-bold text-slate-500" colSpan={6}>Chưa có ticket.</td>
                        </tr>
                      ) : tickets.map((ticket) => (
                        <tr className="hover:bg-cream-50/60" key={ticket.betTicketId}>
                          <td className="px-5 py-4">
                            <strong className="block text-brown-950">#{ticket.betTicketId}</strong>
                            <span className="block truncate text-xs font-semibold text-slate-500" title={ticket.bettorEmail || ''}>{ticket.bettorName || 'N/A'}</span>
                          </td>
                          <td className="px-5 py-4">
                            <strong className="block truncate text-brown-950" title={ticket.horseName || ''}>{ticket.horseName || 'N/A'}</strong>
                            <span className="text-xs font-semibold text-slate-500">Stall {ticket.startingStall || '-'} · Odds {ticket.finalOdds || ticket.estimatedOddsAtBet || '-'}</span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-black text-brown-950">{money(ticket.stake)}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-black text-emerald-700">{money(ticket.payoutAmount)}</td>
                          <td className="px-5 py-4 text-center"><StatusBadge status={ticket.status} /></td>
                          <td className="px-5 py-4 font-semibold text-slate-600">{dateTime(ticket.placedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
