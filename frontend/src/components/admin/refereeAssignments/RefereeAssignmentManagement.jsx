import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  Users
} from 'lucide-react';
import {
  createRefereeAssignment,
  getActiveReferees,
  getAssignableRaces,
  getRefereeAssignments,
  removeRefereeAssignment,
  replaceRefereeAssignment
} from '../../../services/refereeAssignmentService';

function formatDateTime(value) {
  if (!value) return 'Chưa lên lịch';

  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(value) {
  if (!value) return 'Chưa lên lịch';

  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatStatus(status) {
  return normalizeStatus(status);
}

function refereeId(referee) {
  return referee.id ?? referee.Id;
}

function normalizeStatus(status) {
  return String(status || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

function AssignmentModal({
  action,
  races,
  referees,
  isProcessing,
  error,
  onClose,
  onConfirm
}) {
  const [raceId, setRaceId] = useState(action?.assignment?.raceId || '');
  const [selectedRefereeId, setSelectedRefereeId] = useState('');

  useEffect(() => {
    setRaceId(action?.assignment?.raceId || '');
    setSelectedRefereeId('');
  }, [action]);

  if (!action) return null;

  const replacing = action.type === 'replace';

  const availableReferees = replacing
    ? referees.filter(
        (referee) =>
          String(refereeId(referee)) !==
          String(action.assignment.refereeUserId)
      )
    : referees;

  const selectedRace = races.find(
    (race) => String(race.raceId) === String(raceId)
  );
  const selectedReferee = availableReferees.find(
    (referee) => String(refereeId(referee)) === String(selectedRefereeId)
  );

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/80 bg-cream-100 shadow-[0_24px_70px_rgba(43,23,16,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.88))] px-6 py-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
            Phân công Referee
          </p>
          <h2 className="mt-2 text-2xl font-black text-brown-900">
            {replacing ? 'Thay Referee đã phân công' : 'Phân công Referee cho Race'}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Chọn Race cần phân công và Referee ACTIVE để cập nhật lịch phụ trách.
          </p>
        </header>

        <div className="grid gap-5 overflow-y-auto px-6 py-5">
          {replacing && (
            <div className="rounded-lg border border-gold-400/35 bg-gold-400/10 p-4 shadow-[0_8px_22px_rgba(217,164,65,0.08)]">
              <p className="text-xs font-extrabold uppercase tracking-wider text-brown-500">
                Referee hiện tại
              </p>
              <p className="mt-1 font-black text-brown-900">
                {action.assignment.refereeName}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                {action.assignment.refereeEmail}
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-brown-900">Race cần phân công</span>
              {selectedRace && (
                <span className="rounded-full border border-green-700/15 bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">
                  Đã chọn
                </span>
              )}
            </div>

            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
              {races.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                  Không có Race cần phân công Referee.
                </div>
              ) : (
                races.map((race) => {
                  const isSelected = String(race.raceId) === String(raceId);

                  return (
                    <button
                      className={`w-full rounded-lg border p-4 text-left shadow-[0_10px_24px_rgba(78,44,25,0.06)] transition ${
                        isSelected
                          ? 'border-brown-500 bg-cream-200 ring-4 ring-gold-400/20'
                          : 'border-white/80 bg-white hover:-translate-y-0.5 hover:border-brown-700/20 hover:bg-cream-100'
                      } ${replacing ? 'cursor-default' : ''}`}
                      type="button"
                      key={race.raceId}
                      disabled={replacing}
                      onClick={() => setRaceId(race.raceId)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold uppercase tracking-wide text-slate-500">
                            {race.tournamentName}
                          </p>
                          <p className="mt-1 truncate text-lg font-black text-brown-900">
                            {race.raceName}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-green-700/15 bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">
                          {formatStatus(race.raceStatus || race.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={16} className="shrink-0 text-brown-500" />
                          {formatDateTime(race.raceStartTime)}
                          {race.raceEndTime && ` - ${formatTime(race.raceEndTime)}`}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin size={16} className="shrink-0 text-brown-500" />
                          {race.trackName || race.venue || 'Chưa xác định đường đua'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-brown-900">
                Referee ACTIVE
              </span>
              {selectedReferee && (
                <span className="rounded-full border border-green-700/15 bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">
                  Đã chọn
                </span>
              )}
            </div>

            <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {availableReferees.map((referee) => {
                const id = refereeId(referee);
                const isSelected = String(id) === String(selectedRefereeId);

                return (
                  <button
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left shadow-[0_10px_24px_rgba(78,44,25,0.06)] transition ${
                      isSelected
                        ? 'border-brown-500 bg-cream-200 ring-4 ring-gold-400/20'
                        : 'border-white/80 bg-white hover:-translate-y-0.5 hover:border-brown-700/20 hover:bg-cream-100'
                    }`}
                    type="button"
                    key={id}
                    onClick={() => setSelectedRefereeId(id)}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brown-700 text-sm font-black text-white">
                      {(referee.username || 'R').charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black text-brown-900">{referee.username}</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold text-slate-500">{referee.email}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-extrabold text-green-800">
                      ACTIVE
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {availableReferees.length === 0 && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-[0_8px_20px_rgba(217,164,65,0.08)]">
              <AlertTriangle className="mt-0.5 shrink-0" size={19} />
              <p className="text-sm font-bold">Không còn Referee ACTIVE khả dụng cho phân công này.</p>
            </div>
          )}

          {error && (
            <div className="flex gap-3 rounded-lg border border-danger/25 bg-danger-bg p-4 text-danger shadow-[0_8px_24px_rgba(185,28,28,0.08)]" role="alert">
              <AlertTriangle className="mt-0.5 shrink-0" size={19} />
              <div>
                <p className="font-extrabold">Không thể lưu phân công</p>
                <p className="mt-1 text-sm font-semibold">{error}</p>
              </div>
            </div>
          )}

        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-brown-700/10 bg-white/60 px-6 py-4">
          <button
            className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:opacity-60"
            type="button"
            disabled={isProcessing}
            onClick={onClose}
          >
            Đóng
          </button>

          <button
            className="rounded-lg bg-brown-700 px-4 py-3 font-extrabold text-white shadow-[0_12px_28px_rgba(108,63,36,0.22)] transition hover:-translate-y-0.5 hover:bg-brown-900 disabled:translate-y-0 disabled:opacity-50"
            type="button"
            disabled={isProcessing || !raceId || !selectedRefereeId}
            onClick={() => onConfirm(Number(raceId), Number(selectedRefereeId))}
          >
            {isProcessing
              ? 'Đang lưu...'
              : replacing
                ? 'Thay Referee'
                : 'Xác nhận phân công'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function RemoveModal({ assignment, isProcessing, error, onClose, onConfirm }) {
  if (!assignment) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-lg border border-white/80 bg-cream-100 shadow-[0_24px_70px_rgba(43,23,16,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.88))] px-6 py-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-danger">Gỡ phân công</p>
          <h2 className="mt-2 text-2xl font-black text-brown-900">Gỡ Referee?</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Race sẽ quay lại danh sách cần phân công sau khi gỡ Referee.
          </p>
        </header>

        <div className="px-6 py-5">
          <p className="font-semibold leading-6 text-slate-500">
            Gỡ <strong className="text-brown-900">{assignment.refereeName}</strong> khỏi{' '}
            <strong className="text-brown-900">{assignment.raceName}</strong>?
          </p>

          <div className="mt-4 rounded-lg border border-white/80 bg-white p-4 text-sm shadow-[0_12px_28px_rgba(78,44,25,0.08)]">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{assignment.tournamentName}</p>
            <p className="mt-1 font-black text-brown-900">{assignment.raceName}</p>
            <p className="mt-2 flex items-center gap-2 font-semibold text-slate-500">
              <CalendarDays size={15} className="text-brown-500" />
              {formatDateTime(assignment.raceStartTime)}
            </p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-slate-500">
              <MapPin size={15} className="text-brown-500" />
              {assignment.trackName || 'Chưa xác định đường đua'}
            </p>
          </div>

          {error && (
            <div className="mt-4 flex gap-3 rounded-lg border border-danger/25 bg-danger-bg p-4 text-danger shadow-[0_8px_24px_rgba(185,28,28,0.08)]" role="alert">
              <AlertTriangle className="mt-0.5 shrink-0" size={19} />
              <div>
                <p className="font-extrabold">Không thể gỡ phân công</p>
                <p className="mt-1 text-sm font-semibold">{error}</p>
              </div>
            </div>
          )}
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-brown-700/10 bg-white/60 px-6 py-4">
          <button
            className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:opacity-60"
            type="button"
            disabled={isProcessing}
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            className="rounded-lg bg-danger px-4 py-3 font-extrabold text-white shadow-[0_12px_28px_rgba(194,65,53,0.2)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
          >
            {isProcessing ? 'Đang gỡ...' : 'Gỡ bỏ'}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function RefereeAssignmentManagement() {
  const [assignments, setAssignments] = useState([]);
  const [referees, setReferees] = useState([]);
  const [eligibleRaces, setEligibleRaces] = useState([]);
  const [action, setAction] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [assignmentData, refereeData, allAssignableRaces] = await Promise.all([
        getRefereeAssignments(),
        getActiveReferees(),
        getAssignableRaces()
      ]);

      const nextAssignments = Array.isArray(assignmentData) ? assignmentData : [];
      const assignedRaceIds = new Set(
        nextAssignments.map((assignment) => String(assignment.raceId))
      );

      const eligibleRaceList = (Array.isArray(allAssignableRaces) ? allAssignableRaces : [])
        .filter((race) => !assignedRaceIds.has(String(race.raceId)));

      setAssignments(nextAssignments);
      setReferees(Array.isArray(refereeData) ? refereeData : []);
      setEligibleRaces(eligibleRaceList);
    } catch (err) {
      setError(err.message || 'Không thể tải phân công referee.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) =>
      [
        assignment.tournamentName,
        assignment.raceName,
        assignment.refereeName,
        assignment.refereeEmail
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [assignments, search]);

  const assignDisabledReason = !isLoading && referees.length === 0
    ? 'Không có Referee ACTIVE để phân công.'
    : !isLoading && eligibleRaces.length === 0
      ? 'Không có Race cần phân công Referee.'
      : '';

  async function confirmAssignment(raceId, selectedRefereeId) {
    setIsProcessing(true);
    setActionError('');
    setMessage('');

    try {
      if (action.type === 'replace') {
        await replaceRefereeAssignment(raceId, selectedRefereeId);
        setMessage('Đã thay referee thành công.');
      } else {
        await createRefereeAssignment({
          raceId,
          refereeUserId: selectedRefereeId
        });
        setMessage('Đã phân công referee thành công.');
      }

      setAction(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Không thể lưu phân công Referee này.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function confirmRemove() {
    setIsProcessing(true);
    setActionError('');
    setMessage('');

    try {
      await removeRefereeAssignment(removeTarget.raceId);
      setMessage('Đã gỡ phân công referee.');
      setRemoveTarget(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Không thể gỡ phân công Referee này.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="space-y-5 text-brown-900">
      <header className="flex flex-col gap-4 border-b border-brown-700/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
            <span className="h-px w-7 bg-brown-500" /> Admin
          </div>

          <h1 className="mt-2 text-3xl font-black leading-none text-brown-900 md:text-4xl">
            Phân công Referee
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Quản lý Referee phụ trách từng Race, thay thế lịch trực và theo dõi trạng thái phân công trong một màn hình.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-extrabold text-brown-700 shadow-[0_10px_24px_rgba(78,44,25,0.08)] transition hover:-translate-y-0.5 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLoading}
            onClick={loadData}
          >
            <RefreshCw size={17} strokeWidth={2.5} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Đang làm mới' : 'Làm mới'}
          </button>

          <div className="max-w-xs sm:min-w-80">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(108,63,36,0.24)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-[0_16px_34px_rgba(43,23,16,0.25)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 disabled:shadow-none"
              type="button"
              disabled={eligibleRaces.length === 0 || referees.length === 0}
              title={assignDisabledReason || undefined}
              onClick={() => {
                setActionError('');
                setAction({ type: 'assign' });
              }}
            >
              <ShieldCheck size={18} />
              Phân công Referee
            </button>
            {assignDisabledReason && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold leading-5 text-amber-900 shadow-[0_8px_20px_rgba(217,164,65,0.08)]">
                {assignDisabledReason}
              </p>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
          {error}
          {assignments.length > 0 && (
            <p className="mt-1 text-xs font-extrabold text-red-700">
              Dữ liệu phân công bên dưới có thể chưa được cập nhật.
            </p>
          )}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-3 rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700 shadow-[0_8px_24px_rgba(5,150,105,0.1)]">
          <CheckCircle2 size={19} />
          <span>{message}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, label: 'Race đã phân công', value: assignments.length },
          { icon: CalendarDays, label: 'Race cần phân công', value: eligibleRaces.length },
          { icon: Users, label: 'Referee ACTIVE', value: referees.length }
        ].map(({ icon: Icon, label, value }) => (
          <article className="rounded-lg border border-white/80 bg-cream-100/90 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]" key={label}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-brown-900">{isLoading ? '—' : value}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-lg border border-brown-700/10 bg-cream-200 text-brown-700">
                <Icon size={21} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.78))] px-6 py-5 max-sm:grid">
          <div>
            <h2 className="text-2xl font-black">Phân công hiện tại</h2>
            <p className="mt-2 font-semibold text-slate-500">
              {assignments.length} Race hiện đã có Referee phụ trách
            </p>
          </div>

          <label className="relative block w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />

            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 font-bold shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Tìm Race, Tournament hoặc Referee"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <div className="grid gap-3 px-6 py-8" aria-label="Đang tải phân công Referee">
            {[1, 2, 3].map((item) => (
              <div className="h-16 animate-pulse rounded-lg bg-cream-200/70" key={item} />
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="grid place-items-center px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-cream-200 text-brown-700">
              <ShieldCheck size={23} />
            </span>
            <p className="mt-4 font-black text-brown-900">
              {search ? 'Không có phân công phù hợp' : 'Chưa có phân công Referee'}
            </p>
            <p className="mt-1 max-w-md text-sm font-semibold text-slate-500">
              {search
                ? 'Hãy thử tên Tournament, Race hoặc Referee khác.'
                : eligibleRaces.length > 0
                  ? 'Chọn Race cần phân công rồi gán Referee ACTIVE.'
                  : 'Hiện không có Race cần phân công Referee.'}
            </p>
          </div>
        ) : (
          <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[27%]" />
                <col className="w-[25%]" />
                <col className="w-[20%]" />
                <col className="w-[13%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead className="bg-cream-200/50">
                <tr>
                  {[
                    'Tournament & Race',
                    'Lịch trình & đường đua',
                    'Referee',
                    'Status',
                    'Thao tác'
                  ].map((heading) => {
                    const isStatus = heading === 'Status';
                    const isActions = heading === 'Thao tác';
                    return (
                    <th
                      className={`border-b border-brown-700/10 px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-brown-700 ${
                        isActions ? 'text-right' : isStatus ? 'text-center' : 'text-left'
                      }`}
                      key={heading}
                    >
                      {heading}
                    </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr
                    className="transition hover:bg-white/70"
                    key={assignment.assignmentId}
                  >
                    <td className="border-b border-brown-700/10 px-5 py-4">
                      <p className="truncate text-xs font-extrabold uppercase tracking-wide text-slate-500">{assignment.tournamentName}</p>
                      <p className="mt-1 truncate font-black text-brown-900">{assignment.raceName}</p>
                    </td>

                    <td className="border-b border-brown-700/10 px-5 py-4 text-sm">
                      <p className="flex items-center gap-2 font-bold text-brown-900"><CalendarDays size={15} className="shrink-0 text-brown-500" />{formatDateTime(assignment.raceStartTime)}</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-slate-500"><MapPin size={15} className="shrink-0 text-brown-500" />{assignment.trackName || 'Chưa xác định đường đua'}</p>
                    </td>

                    <td className="border-b border-brown-700/10 px-5 py-4">
                      <strong className="block truncate">{assignment.refereeName}</strong>
                      <small className="mt-1 block truncate font-semibold text-slate-500">
                        {assignment.refereeEmail}
                      </small>
                    </td>

                    <td className="border-b border-brown-700/10 px-5 py-4 text-center">
                      <span className="inline-flex rounded-full border border-green-700/15 bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800 shadow-[0_6px_16px_rgba(5,150,105,0.08)]">
                        {formatStatus(assignment.assignmentStatus)}
                      </span>
                    </td>

                    <td className="border-b border-brown-700/10 px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          className="grid size-9 place-items-center rounded-lg border border-brown-700/15 bg-white text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] transition hover:-translate-y-0.5 hover:border-brown-500 hover:bg-cream-200"
                          type="button"
                          title="Thay Referee"
                          aria-label={`Thay Referee cho ${assignment.raceName}`}
                          onClick={() => {
                            setActionError('');
                            setAction({ type: 'replace', assignment });
                          }}
                        >
                          <UserRoundCog size={15} />
                        </button>

                        <button
                          className="grid size-9 place-items-center rounded-lg border border-red-200 bg-red-50 text-danger shadow-[0_8px_18px_rgba(185,28,28,0.05)] transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100"
                          type="button"
                          title="Gỡ Referee"
                          aria-label={`Gỡ Referee khỏi ${assignment.raceName}`}
                          onClick={() => {
                            setActionError('');
                            setRemoveTarget(assignment);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 lg:hidden">
            {filteredAssignments.map((assignment) => (
              <article className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_12px_28px_rgba(78,44,25,0.08)]" key={assignment.assignmentId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold uppercase tracking-wide text-slate-500">{assignment.tournamentName}</p>
                    <h3 className="mt-1 truncate text-lg font-black text-brown-900">{assignment.raceName}</h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-green-700/15 bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">{formatStatus(assignment.assignmentStatus)}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
                  <p className="flex items-center gap-2"><CalendarDays size={16} className="text-brown-500" />{formatDateTime(assignment.raceStartTime)}</p>
                  <p className="flex items-center gap-2"><MapPin size={16} className="text-brown-500" />{assignment.trackName || 'Chưa xác định đường đua'}</p>
                  <p className="flex items-center gap-2"><Users size={16} className="text-brown-500" />{assignment.refereeName} · {assignment.refereeEmail}</p>
                </div>
                <div className="mt-4 flex justify-end gap-1.5">
                  <button
                    className="grid size-10 place-items-center rounded-lg border border-brown-700/15 bg-white text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)]"
                    type="button"
                    title="Thay Referee"
                    aria-label={`Thay Referee cho ${assignment.raceName}`}
                    onClick={() => { setActionError(''); setAction({ type: 'replace', assignment }); }}
                  >
                    <UserRoundCog size={16} />
                  </button>
                  <button
                    className="grid size-10 place-items-center rounded-lg border border-red-200 bg-red-50 text-danger shadow-[0_8px_18px_rgba(185,28,28,0.05)]"
                    type="button"
                    title="Gỡ Referee"
                    aria-label={`Gỡ Referee khỏi ${assignment.raceName}`}
                    onClick={() => { setActionError(''); setRemoveTarget(assignment); }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          </>
        )}
      </section>

      <AssignmentModal
        action={action}
        races={
          action?.type === 'replace'
            ? [action.assignment]
            : eligibleRaces
        }
        referees={referees}
        isProcessing={isProcessing}
        error={actionError}
        onClose={() => {
          if (!isProcessing) {
            setAction(null);
            setActionError('');
          }
        }}
        onConfirm={confirmAssignment}
      />

      <RemoveModal
        assignment={removeTarget}
        isProcessing={isProcessing}
        error={actionError}
        onClose={() => {
          if (!isProcessing) {
            setRemoveTarget(null);
            setActionError('');
          }
        }}
        onConfirm={confirmRemove}
      />
    </section>
  );
}
