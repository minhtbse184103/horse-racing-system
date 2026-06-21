import { Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  X
} from 'lucide-react';
import { tournamentStatusLabels } from '../../../../lib/eventFormatters';
import TournamentStatusBadge from '../TournamentStatusBadge';
import RegistrationCapacity from './RegistrationCapacity';
import TournamentActions from './TournamentActions';
import TournamentDetails from './TournamentDetails';
import TournamentMobileCard from './TournamentMobileCard';
import { formatTournamentDate } from './tournamentWorkspaceUtils';
import VenueImage from './VenueImage';

export default function TournamentPortfolio({
  tournaments,
  filteredTournaments,
  registrationCounts,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  hasFilters,
  onClearFilters,
  expandedId,
  onToggleExpanded,
  onCreate,
  onEdit,
  onClone,
  onDelete,
  operationsProps
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12),0_1px_2px_rgba(43,23,16,0.08)]">
      <div className="border-b border-brown-700/10 bg-white/65 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-black text-brown-900 md:text-2xl">Danh sách Tournament</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Theo dõi toàn bộ chương trình sự kiện và Status vận hành.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(15rem,1fr)_12rem_auto]">
            <label className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-brown-700/15 bg-white py-2.5 pl-10 pr-9 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/70 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15"
                placeholder="Tìm theo tên hoặc địa điểm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-cream-200 hover:text-brown-900"
                  aria-label="Xóa nội dung tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-brown-700/15 bg-white py-2.5 pl-9 pr-8 text-sm font-extrabold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15"
              >
                <option value="ALL">Tất cả Status</option>
                {Object.entries(tournamentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            </label>

            {hasFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="min-h-11 rounded-lg border border-brown-700/15 bg-cream-200 px-3 text-xs font-extrabold text-brown-700 hover:border-brown-500 hover:bg-white"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-brown-700/10 pt-3">
          <p className="text-xs font-bold text-slate-500">
            Hiển thị <strong className="text-brown-900">{filteredTournaments.length}</strong> trên {tournaments.length} Tournament
          </p>
          {statusFilter !== 'ALL' && <TournamentStatusBadge status={statusFilter} />}
        </div>
      </div>

      <div className="xl:hidden">
        {filteredTournaments.map((tournament) => (
          <TournamentMobileCard
            key={tournament.id}
            tournament={tournament}
            registrationCount={registrationCounts.get(tournament.id) || 0}
            expanded={expandedId === tournament.id}
            onToggle={() => onToggleExpanded(tournament.id)}
            onEdit={onEdit}
            onClone={onClone}
            onDelete={onDelete}
            operationsProps={operationsProps}
          />
        ))}
      </div>

      <div className="hidden xl:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[29%]" />
            <col className="w-[16%]" />
            <col className="w-[15%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-cream-200/60 text-left text-[11px] font-black uppercase text-brown-700">
            <tr>
              <th className="px-5 py-4">Tournament</th>
              <th className="px-4 py-4">Địa điểm</th>
              <th className="px-4 py-4">Lịch trình</th>
              <th className="px-4 py-4">Sức chứa</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTournaments.map((tournament) => {
              const expanded = expandedId === tournament.id;

              return (
                <Fragment key={tournament.id}>
                  <motion.tr layout className={`border-t border-brown-700/10 align-middle transition-colors ${expanded ? 'bg-white/85 shadow-[inset_3px_0_0_#d9a441]' : 'hover:bg-white/70'}`}>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => onToggleExpanded(tournament.id)}
                        className="group flex w-full min-w-0 items-start gap-3 text-left"
                      >
                        <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg transition ${expanded ? 'bg-brown-700 text-white' : 'bg-cream-200 text-brown-700 group-hover:bg-brown-700 group-hover:text-white'}`}>
                          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        <VenueImage tournament={tournament} className="size-10 shrink-0 rounded-lg border border-brown-700/10" />
                        <span className="min-w-0">
                          <span className="block truncate font-black leading-5 text-brown-900" title={tournament.name}>{tournament.name}</span>
                          <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{tournament.description}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex min-w-0 items-start gap-2 text-sm font-bold leading-5 text-brown-900">
                        <MapPin className="mt-0.5 shrink-0 text-brown-500" size={15} />
                        <span className="min-w-0 break-words">{tournament.venue}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-black text-brown-900">{formatTournamentDate(tournament.start)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">đến {formatTournamentDate(tournament.end)}</p>
                    </td>
                    <td className="px-3 py-4">
                      <RegistrationCapacity value={registrationCounts.get(tournament.id) || 0} max={tournament.maxRegistration} />
                    </td>
                    <td className="px-3 py-4"><TournamentStatusBadge status={tournament.status} /></td>
                    <td className="px-3 py-4">
                      <TournamentActions tournament={tournament} onEdit={onEdit} onClone={onClone} onDelete={onDelete} />
                    </td>
                  </motion.tr>
                  <tr>
                    <td colSpan="6" className="p-0">
                      <AnimatePresence initial={false}>
                        {expanded && <TournamentDetails tournament={tournament} {...operationsProps} />}
                      </AnimatePresence>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredTournaments.length === 0 && (
        <div className="grid min-h-72 place-items-center border-t border-brown-700/10 px-6 py-12 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-lg bg-cream-200 text-brown-700">
              <Search size={22} />
            </span>
            <h3 className="mt-4 text-lg font-black text-brown-900">Không tìm thấy Tournament</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-500">
              Không có sự kiện nào phù hợp với nội dung tìm kiếm và bộ lọc hiện tại.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {hasFilters && (
                <button type="button" onClick={onClearFilters} className="rounded-lg border border-brown-700/15 bg-white px-4 py-2.5 text-sm font-extrabold text-brown-700 hover:bg-cream-200">
                  Xóa bộ lọc
                </button>
              )}
              <button type="button" onClick={onCreate} className="rounded-lg bg-brown-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-brown-900">
                Tạo Tournament
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
