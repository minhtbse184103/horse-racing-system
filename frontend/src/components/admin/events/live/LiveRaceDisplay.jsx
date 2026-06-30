import { Activity, CircleDot, Clock3, Flag, Trophy } from 'lucide-react';

function formatElapsedTime(value) {
  const seconds = Number(value || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return '0.0s';
  return `${seconds.toFixed(1)}s`;
}

function normalizeProgress(value) {
  const progress = Number(value || 0);
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(1, progress));
}

function normalizeHorseStatus(horse, index) {
  const finished = Boolean(horse?.finished);
  const progress = finished ? 1 : normalizeProgress(horse?.progress);

  return {
    id: horse?.horseId ?? horse?.startingStall ?? index + 1,
    label: horse?.horseName || `Horse ${horse?.horseId ?? index + 1}`,
    stall: horse?.startingStall ?? horse?.horseId ?? index + 1,
    progress,
    progressPercent: Math.round(progress * 100),
    finished
  };
}

function buildLeaderboard(horses) {
  return horses
    .map((horse, index) => normalizeHorseStatus(horse, index))
    .sort((left, right) => {
      if (left.finished !== right.finished) return left.finished ? -1 : 1;
      return right.progress - left.progress;
    });
}

export default function LiveRaceDisplay({ tick, result }) {
  const horses = Array.isArray(tick?.horses) ? buildLeaderboard(tick.horses) : [];
  const leader = horses[0] || null;
  const elapsedTime = formatElapsedTime(tick?.elapsedTime);

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-brown-700/10 bg-white shadow-[0_14px_34px_rgba(78,44,25,0.08)]">
      <div className="grid gap-3 border-b border-brown-700/10 bg-[linear-gradient(135deg,#fff8ee_0%,#f7ead8_100%)] p-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
            <Clock3 size={14} /> Thời gian
          </p>
          <p className="mt-2 text-2xl font-black text-brown-900">{elapsedTime}</p>
        </div>

        <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
            <Trophy size={14} /> Dẫn đầu
          </p>
          <p className="mt-2 truncate text-2xl font-black text-brown-900">
            {leader ? leader.label : 'Đang chờ'}
          </p>
        </div>

        <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
            <Activity size={14} /> Trạng thái
          </p>
          <p className={`mt-2 text-2xl font-black ${result ? 'text-emerald-700' : 'text-brown-900'}`}>
            {result ? 'Hoàn tất' : 'Đang chạy'}
          </p>
        </div>
      </div>

      {horses.length === 0 ? (
        <div className="grid min-h-36 place-items-center p-6 text-center">
          <div>
            <Flag className="mx-auto text-brown-500" size={24} />
            <p className="mt-3 font-black text-brown-900">Chưa có tick live</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Unity Engine sẽ gửi dữ liệu vị trí sau khi Race bắt đầu chạy.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {result && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <Trophy className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-black">Race đã kết thúc</p>
                <p className="mt-1 text-sm font-semibold">
                  Kết quả đã được backend ghi nhận. Nhấn Làm mới trong Tournament Workspace để cập nhật nút kết quả nếu cần.
                </p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-brown-700/10 bg-[linear-gradient(180deg,#fffaf3_0%,#f8ecd9_100%)] shadow-inner">
            <div className="relative px-3 py-4">
              <div className="pointer-events-none absolute bottom-0 right-[5.5rem] top-0 w-1 bg-white shadow-[0_0_0_1px_rgba(108,63,36,0.16)]">
                <div className="h-full w-full bg-[repeating-linear-gradient(0deg,#ffffff_0_8px,#2b1710_8px_16px)] opacity-70" />
              </div>
              <div className="pointer-events-none absolute bottom-3 right-[3.4rem] text-[0.62rem] font-black uppercase tracking-[0.2em] text-brown-700/55 [writing-mode:vertical-rl]">
                Finish
              </div>

              <div className="space-y-2">
                {horses.map((horse, index) => {
                  const laneLeft = `${Math.min(88, horse.progressPercent * 0.88)}%`;

                  return (
                    <article
                      key={`${horse.id}-${index}`}
                      className={`relative min-h-[4.6rem] overflow-hidden rounded-lg border px-3 py-2 transition-all ${
                        index === 0
                          ? 'border-amber-200 bg-amber-50/80 shadow-[0_10px_24px_rgba(217,164,65,0.16)]'
                          : 'border-brown-700/10 bg-white/75'
                      }`}
                    >
                      <div className="absolute inset-x-0 bottom-4 h-px bg-brown-700/15" />
                      <div className="absolute inset-x-0 bottom-7 h-px bg-white/80" />

                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-black ${index === 0 ? 'bg-gold-400 text-brown-900' : 'bg-cream-200 text-brown-700'}`}>
                            #{index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-brown-900">{horse.label}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[0.66rem] font-black text-brown-700">
                                <CircleDot size={10} /> Stall {horse.stall}
                              </span>
                              {horse.finished && (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.66rem] font-black text-emerald-700">
                                  FINISHED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="shrink-0 text-lg font-black text-brown-900">{horse.progressPercent}%</p>
                      </div>

                      <div className="absolute bottom-2 left-3 right-16 h-6 rounded-full bg-brown-900/5">
                        <div
                          className="absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 transition-[left] duration-500 ease-out"
                          style={{ left: laneLeft }}
                        >
                          <span className={`grid size-9 place-items-center rounded-full border-2 text-lg shadow-[0_8px_18px_rgba(43,23,16,0.18)] ${horse.finished ? 'border-emerald-300 bg-emerald-50' : index === 0 ? 'border-gold-400 bg-white' : 'border-brown-300 bg-white'}`}>
                            🐎
                          </span>
                          {index === 0 && !horse.finished && (
                            <span className="hidden rounded-full bg-brown-900 px-2 py-1 text-[0.62rem] font-black uppercase text-white shadow-sm sm:inline-flex">
                              Leader
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 h-1 rounded-r-full bg-brown-500 transition-all duration-500 ease-out" style={{ width: `${horse.progressPercent}%` }} />
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
