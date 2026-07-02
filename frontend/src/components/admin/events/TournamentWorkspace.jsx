import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, CheckCircle2, Flag, Info, LoaderCircle, Plus, RefreshCw, Trophy, Users, X } from 'lucide-react';
import TournamentWizard from './TournamentWizard';
import DeleteTournamentDialog from './workspace/DeleteTournamentDialog';
import TournamentPortfolio from './workspace/TournamentPortfolio';
import WorkspaceMetricCard from './workspace/WorkspaceMetricCard';
import useTournamentWorkspace from './workspace/useTournamentWorkspace';
import { pageTransition, staggerContainer } from '../ui/motion';

export default function TournamentWorkspace({ adminName = 'Admin Test', focus = null, onFocusHandled, onNavigateToResultReview }) {
  const workspace = useTournamentWorkspace();
  const operationsProps = {
    registrations: workspace.registrations,
    registrationsLoading: workspace.registrationsLoading,
    registrationsError: workspace.registrationsError,
    retryRegistrations: workspace.retryRegistrations,
    approveRegistration: workspace.approveRegistration,
    rejectRegistration: workspace.rejectRegistration,
    onRaceEntryCountChange: workspace.updateRaceEntryCount,
    onRaceStatusChange: workspace.updateRaceStatus,
    onNavigateToResultReview,
    adminName,
    onLifecycleAction: workspace.transitionTournament,
    lifecycleProcessingId: workspace.lifecycleProcessingId
  };

  return (
    <motion.section {...pageTransition} className="space-y-5 text-brown-900">
      <header className="flex flex-col gap-4 border-b border-brown-700/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
            <span className="h-px w-7 bg-brown-500" /> Quản trị Race
          </div>
          <h1 className="mt-2 text-3xl font-black leading-none text-brown-900 md:text-4xl">
            Quản lý Tournament
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Lập kế hoạch sự kiện, cấu hình Race và theo dõi sức chứa Registration trong một khu vực quản lý thống nhất.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={workspace.refreshWorkspace}
            disabled={workspace.refreshing}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-extrabold text-brown-700 shadow-[0_10px_24px_rgba(78,44,25,0.08)] transition hover:-translate-y-0.5 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              strokeWidth={2.5}
              className={workspace.refreshing ? 'animate-spin' : ''}
            />
            {workspace.refreshing ? 'Đang làm mới' : 'Làm mới'}
          </button>
          <button
            type="button"
            onClick={workspace.openCreate}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(108,63,36,0.24)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-[0_16px_34px_rgba(43,23,16,0.25)]"
          >
            <Plus size={18} strokeWidth={2.5} /> Tạo Tournament
          </button>
        </div>
      </header>

      <AnimatePresence>
        {focus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900 shadow-[0_8px_24px_rgba(37,99,235,0.08)]"
          >
            <span className="flex items-start gap-2">
              <Info className="mt-0.5 shrink-0" size={17} />
              {focus === 'raceEntries'
                ? 'Từ danh sách Tournament, mở Tournament và chọn Race trong khu vực Phân công RaceEntry để xử lý queue.'
                : 'Từ danh sách Tournament, mở Tournament liên quan rồi mở khu vực Duyệt Registration để xem hồ sơ đang chờ.'}
            </span>
            <button
              type="button"
              onClick={onFocusHandled}
              className="grid size-7 shrink-0 place-items-center rounded-md text-blue-800 hover:bg-blue-100"
              aria-label="Đóng hướng dẫn"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {workspace.notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 shadow-[0_8px_24px_rgba(5,150,105,0.1)]"
          >
            <span className="flex items-center gap-2"><CheckCircle2 size={17} /> {workspace.notice}</span>
            <button
              type="button"
              onClick={workspace.dismissNotice}
              className="grid size-7 shrink-0 place-items-center rounded-md text-emerald-800 hover:bg-emerald-100"
              aria-label="Đóng thông báo"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {workspace.mutationError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900 shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
            <span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 shrink-0" size={17} /> {workspace.mutationError}</span>
            <button type="button" onClick={workspace.dismissMutationError} className="grid size-7 shrink-0 place-items-center rounded-md text-red-800 hover:bg-red-100" aria-label="Đóng thông báo lỗi"><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {workspace.isLoading ? (
        <div className="grid min-h-80 place-items-center rounded-lg border border-white/80 bg-cream-100/90 px-6 text-center shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
          <div>
            <LoaderCircle className="mx-auto animate-spin text-brown-500" size={30} />
            <h2 className="mt-4 text-lg font-black text-brown-900">Đang tải danh sách Tournament</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Đang tải thông tin Tournament và chương trình Race.</p>
          </div>
        </div>
      ) : workspace.loadError ? (
        <div className="grid min-h-80 place-items-center rounded-lg border border-red-200 bg-red-50/80 px-6 text-center shadow-[0_20px_52px_rgba(78,44,25,0.1)]">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-lg bg-red-100 text-danger"><AlertTriangle size={23} /></span>
            <h2 className="mt-4 text-lg font-black text-brown-900">Không thể tải dữ liệu Tournament</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{workspace.loadError}</p>
            <button type="button" onClick={workspace.retryLoad} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-md hover:bg-brown-900">
              <RefreshCw size={16} /> Thử lại
            </button>
          </div>
        </div>
      ) : (
        <>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <WorkspaceMetricCard icon={Trophy} label="Tournament" value={workspace.metrics.tournamentCount} hint="Trong tất cả giai đoạn vận hành" />
            <WorkspaceMetricCard icon={Users} label="Registration" value={workspace.metrics.registrationCount} hint="Danh mục sự kiện hiện tại" tone="gold" />
            <WorkspaceMetricCard icon={Flag} label="Race đã cấu hình" value={workspace.metrics.raceCount} hint="Trong toàn bộ Tournament" tone="green" />
            <WorkspaceMetricCard
              icon={CalendarDays}
              label="RaceEntry chính thức"
              value={workspace.metrics.raceEntryCount}
              hint="Đã phân công trong toàn bộ Race"
              tone="cream"
            />
          </motion.div>

          <TournamentPortfolio
            tournaments={workspace.tournaments}
            filteredTournaments={workspace.filteredTournaments}
            registrationCounts={workspace.registrationCounts}
            search={workspace.search}
            onSearchChange={workspace.setSearch}
            statusFilter={workspace.statusFilter}
            onStatusFilterChange={workspace.setStatusFilter}
            hasFilters={workspace.hasFilters}
            onClearFilters={workspace.clearFilters}
            expandedId={workspace.expandedId}
            onToggleExpanded={workspace.toggleExpanded}
            onCreate={workspace.openCreate}
            onEdit={workspace.openEdit}
            onClone={workspace.openClone}
            onDelete={workspace.setDeleteTarget}
            operationsProps={operationsProps}
          />
        </>
      )}

      <AnimatePresence>
        {workspace.wizardOpen && (
          <TournamentWizard
            initialTournament={workspace.wizardTournament}
            onClose={workspace.closeWizard}
            onSave={workspace.saveTournament}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {workspace.deleteTarget && (
          <DeleteTournamentDialog
            tournament={workspace.deleteTarget}
            onCancel={() => workspace.setDeleteTarget(null)}
            onConfirm={workspace.deleteTournament}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
