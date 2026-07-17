import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Flag, MapPin, Route, Users } from "lucide-react";
import StatusBadge from "./StatusBadge";

const DAYS = [
  { offset: 0, label: "Hôm nay" },
  { offset: 1, label: "Ngày mai" },
  { offset: 2, label: "Ngày kế" }
];

function dateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayKey(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}

const time = (value) => new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
const date = (value) => new Date(value).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });

export default function Racecards({ races, tournaments, isLoading, error }) {
  const [day, setDay] = useState(0);
  const [track, setTrack] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const tournamentById = useMemo(
    () => new Map(tournaments.map((item) => [String(item.tournamentId), item])),
    [tournaments]
  );
  const racesForDay = useMemo(
    () => races
      .filter((race) => String(race.status).toLowerCase() !== "cancelled")
      .filter((race) => dateKey(race.raceStartTime) === dayKey(day))
      .sort((a, b) => new Date(a.raceStartTime) - new Date(b.raceStartTime)),
    [races, day]
  );
  const tracks = [...new Set(racesForDay.map((race) => race.trackName).filter(Boolean))];
  const filtered = track === "all" ? racesForDay : racesForDay.filter((race) => race.trackName === track);
  const displayed = showAll ? filtered : filtered.slice(0, 6);

  function selectDay(offset) {
    setDay(offset);
    setTrack("all");
    setShowAll(false);
  }

  return (
    <section id="racecards" className="bg-cream-100 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-brown-900/10 bg-white shadow-sm">
          <div className="bg-brown-900 px-5 py-4 text-cream-100 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">Lịch thi đấu</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold sm:text-3xl">Race sắp diễn ra</h2>
                <p className="mt-2 text-sm text-cream-100/70">Dữ liệu lịch đua được cập nhật trực tiếp từ hệ thống.</p>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-cream-100/10 p-1">
                {DAYS.map((item) => (
                  <button key={item.offset} type="button" onClick={() => selectDay(item.offset)} className={`rounded-md px-3 py-2.5 text-xs font-bold transition sm:text-sm ${day === item.offset ? "bg-gold-400 text-brown-900" : "text-cream-100/75 hover:bg-cream-100/10"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-brown-900/10 px-5 py-4 sm:px-7">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setTrack("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${track === "all" ? "bg-gold-400 text-brown-900" : "border border-brown-900/15 hover:bg-cream-200"}`}>Tất cả đường đua</button>
              {tracks.map((name) => <button key={name} type="button" onClick={() => setTrack(name)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${track === name ? "bg-gold-400 text-brown-900" : "border border-brown-900/15 hover:bg-cream-200"}`}>{name}</button>)}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-lg bg-cream-200" />)}</div>
            ) : error ? (
              <p className="rounded-lg border border-danger/20 bg-danger/5 px-5 py-4 font-semibold text-danger">{error}</p>
            ) : displayed.length === 0 ? (
              <div className="rounded-lg border border-dashed border-brown-900/20 bg-cream-100 px-6 py-12 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-brown-500" aria-hidden />
                <h3 className="mt-3 font-bold text-brown-900">Chưa có cuộc đua trong ngày này</h3>
                <p className="mt-1 text-sm text-brown-900/60">Hãy chọn ngày khác để xem lịch thi đấu.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {displayed.map((race) => {
                  const tournament = tournamentById.get(String(race.tournamentId));
                  const available = race.availableStalls ?? Math.max(0, Number(race.maxRunners || 0) - Number(race.entryCount || 0));
                  return (
                    <article key={race.raceId} className="overflow-hidden rounded-lg border border-brown-900/15 transition hover:border-gold-400 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3 px-5 py-4">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-extrabold text-brown-500"><Clock3 className="h-4 w-4" aria-hidden />{time(race.raceStartTime)} · {date(race.raceStartTime)}</p>
                          <h3 className="mt-1.5 text-lg font-extrabold text-brown-900">{race.raceName}</h3>
                          <p className="mt-1 text-sm text-brown-900/60">{tournament?.tournamentName || "Giải đua ngựa"}</p>
                        </div>
                        <StatusBadge status={race.status} />
                      </div>
                      <dl className="grid grid-cols-2 border-y border-brown-900/10 bg-cream-200/70 text-sm">
                        <div className="flex items-center gap-2 px-4 py-3"><MapPin className="h-4 w-4 text-brown-500" aria-hidden /><div><dt className="text-xs text-brown-900/50">Đường đua</dt><dd className="font-semibold text-brown-900">{race.trackName}</dd></div></div>
                        <div className="flex items-center gap-2 border-l border-brown-900/10 px-4 py-3"><Route className="h-4 w-4 text-brown-500" aria-hidden /><div><dt className="text-xs text-brown-900/50">Cự ly</dt><dd className="font-semibold text-brown-900">{Number(race.distance || 0).toLocaleString("vi-VN")} m</dd></div></div>
                      </dl>
                      <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
                        <span className="inline-flex items-center gap-2 text-brown-900/70"><Users className="h-4 w-4" aria-hidden />{race.entryCount || 0}/{race.maxRunners || 0} ngựa · còn {available} chỗ</span>
                        <span className="inline-flex items-center gap-1 font-bold text-brown-500"><Flag className="h-4 w-4" aria-hidden />Race {race.raceOrder || "—"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {filtered.length > 6 && <button type="button" onClick={() => setShowAll((value) => !value)} className="mx-auto mt-7 block rounded-md border border-brown-900/15 px-5 py-2.5 text-sm font-bold text-brown-900 hover:bg-cream-200">{showAll ? "Thu gọn" : `Xem thêm ${filtered.length - 6} cuộc đua`}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
