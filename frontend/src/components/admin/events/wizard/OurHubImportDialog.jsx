import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, Check, ChevronDown, DownloadCloud, LoaderCircle, Search, X } from 'lucide-react';
import { normalizeOurHubRacecardToPreview, ourHubPreviewToRaceDraft } from '../../../../adapters/ourHubRaceAdapter';
import { getOurHubCourseInfo } from '../../../../services/externalRacingService';
import { modalBackdrop, modalPanel } from '../../ui/motion';
import { FIELD_CLASS } from './wizardConstants';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return 'Chưa có giờ';
  return String(value).replace('T', ' ').slice(0, 16);
}

function raceKey(race, index) {
  return race.externalRaceId || `${race.courseName}-${race.raceName}-${race.raceStartTime}-${index}`;
}

function RunnerPreview({ runners }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRunners = expanded ? runners : runners.slice(0, 3);

  if (!runners.length) {
    return (
      <p className="mt-3 rounded-lg bg-cream-100 px-3 py-2 text-xs font-bold text-slate-500">
        OurHub chưa cung cấp danh sách horse / jockey cho Race này.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-brown-700/10 bg-cream-100/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-brown-500">Horse / Jockey preview</p>
        {runners.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-1 text-xs font-black text-brown-700 hover:text-brown-900"
          >
            {expanded ? 'Thu gọn' : `Xem ${runners.length} runner`}
            <ChevronDown size={13} className={expanded ? 'rotate-180' : ''} />
          </button>
        )}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {visibleRunners.map((runner, index) => (
          <div key={`${runner.horseName}-${runner.jockeyName}-${index}`} className="rounded-md bg-white/80 px-3 py-2">
            <p className="truncate text-sm font-black text-brown-900">{runner.horseName || 'Horse chưa rõ'}</p>
            <p className="truncate text-xs font-bold text-slate-500">{runner.jockeyName || 'Jockey chưa rõ'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OurHubImportDialog({ draft, onClose, onImport }) {
  const [date, setDate] = useState(draft.start || todayInputValue());
  const [racecards, setRacecards] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCount = selectedKeys.size;

  const selectedRacecards = useMemo(
    () => racecards.filter((race, index) => selectedKeys.has(raceKey(race, index))),
    [racecards, selectedKeys]
  );

  async function loadRacecards() {
    if (!date) {
      setError('Vui lòng chọn ngày trước khi tải dữ liệu OurHub.');
      return;
    }

    setLoading(true);
    setError('');
    setSelectedKeys(new Set());

    try {
      const response = await getOurHubCourseInfo(date);
      setRacecards(Array.isArray(response) ? response.map(normalizeOurHubRacecardToPreview) : []);
    } catch (loadError) {
      setRacecards([]);
      setError(loadError.message || 'Không thể tải dữ liệu OurHub.');
    } finally {
      setLoading(false);
    }
  }

  function toggleRace(race, index) {
    const key = raceKey(race, index);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function confirmImport() {
    const importedRaces = [];

    selectedRacecards.forEach((racecard) => {
      const raceDraft = ourHubPreviewToRaceDraft(racecard, {
        existingRaces: [...draft.races, ...importedRaces]
      });
      importedRaces.push(raceDraft);
    });

    onImport(importedRaces);
  }

  return (
    <motion.div {...modalBackdrop} className="fixed inset-0 z-[70] grid place-items-center bg-brown-900/55 p-4 backdrop-blur-sm">
      <motion.section
        {...modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ourhub-import-title"
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-white/70 bg-cream-100 shadow-[0_30px_90px_rgba(43,23,16,0.42)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brown-700/10 bg-white/85 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase text-brown-500">OurHub Racing API</p>
            <h3 id="ourhub-import-title" className="mt-1 text-2xl font-black text-brown-900">Import Race từ OurHub</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Tải Race preview từ backend, chọn Race cần thêm, rồi chỉnh sửa lại trong wizard trước khi lưu Tournament.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200"
            aria-label="Đóng import OurHub"
          >
            <X size={18} />
          </button>
        </header>

        <div className="shrink-0 border-b border-brown-700/10 bg-cream-200/50 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="grid gap-1.5 text-sm font-extrabold text-brown-900">
              <span>Ngày Race</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-500" size={17} />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={`${FIELD_CLASS} pl-10`}
                />
              </div>
            </label>
            <button
              type="button"
              onClick={loadRacecards}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-md transition hover:bg-brown-900 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />}
              Tải Race từ OurHub
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-danger">
              <AlertTriangle className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <LoaderCircle className="mx-auto animate-spin text-brown-500" size={30} />
                <h4 className="mt-4 text-lg font-black text-brown-900">Đang tải Race preview</h4>
                <p className="mt-1 text-sm font-semibold text-slate-500">Backend đang gọi OurHub bằng API key bảo mật.</p>
              </div>
            </div>
          ) : racecards.length === 0 ? (
            <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-white/50 p-8 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-lg bg-cream-200 text-brown-700">
                  <DownloadCloud size={23} />
                </span>
                <h4 className="mt-4 text-lg font-black text-brown-900">Chưa có Race preview</h4>
                <p className="mx-auto mt-1 max-w-md text-sm font-semibold leading-6 text-slate-500">
                  Chọn ngày và bấm tải dữ liệu. Nếu OurHub không có dữ liệu cho ngày đó, hãy thử ngày khác.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {racecards.map((race, index) => {
                const key = raceKey(race, index);
                const checked = selectedKeys.has(key);

                return (
                  <article
                    key={key}
                    className={`rounded-lg border bg-white/90 p-4 shadow-[0_10px_24px_rgba(78,44,25,0.08)] transition ${
                      checked ? 'border-brown-500 ring-4 ring-gold-400/15' : 'border-white/80 hover:border-brown-700/20'
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <button
                        type="button"
                        onClick={() => toggleRace(race, index)}
                        className="flex min-w-0 flex-1 gap-3 text-left"
                      >
                        <span className={`mt-1 grid size-6 shrink-0 place-items-center rounded-md border text-white ${
                          checked ? 'border-brown-700 bg-brown-700' : 'border-brown-700/20 bg-white'
                        }`}>
                          {checked && <Check size={15} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base font-black text-brown-900">{race.raceName || 'Race chưa có tên'}</span>
                          <span className="mt-1 block text-sm font-bold text-slate-500">{race.courseName || 'Course chưa rõ'} · {formatDateTime(race.raceStartTime)}</span>
                        </span>
                      </button>

                      <div className="grid shrink-0 grid-cols-2 gap-2 text-sm md:min-w-64">
                        <div className="rounded-lg bg-cream-100 px-3 py-2">
                          <p className="text-xs font-black uppercase text-brown-500">Cự ly</p>
                          <p className="mt-0.5 font-black text-brown-900">{race.distanceMeters ? `${race.distanceMeters}m` : race.distanceText || 'Dùng mặc định'}</p>
                        </div>
                        <div className="rounded-lg bg-cream-100 px-3 py-2">
                          <p className="text-xs font-black uppercase text-brown-500">Runner</p>
                          <p className="mt-0.5 font-black text-brown-900">{race.runnerCount || race.runners.length || 'Dùng mặc định'}</p>
                        </div>
                      </div>
                    </div>

                    <RunnerPreview runners={race.runners} />
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-brown-700/10 bg-white/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-500">
            Đã chọn <span className="font-black text-brown-900">{selectedCount}</span> Race. Chưa lưu database cho đến khi bấm lưu Tournament.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-extrabold text-brown-700 hover:bg-cream-200">
              Hủy
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={selectedCount === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-5 text-sm font-extrabold text-white shadow-md hover:bg-brown-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DownloadCloud size={16} />
              Thêm vào Wizard
            </button>
          </div>
        </footer>
      </motion.section>
    </motion.div>
  );
}
