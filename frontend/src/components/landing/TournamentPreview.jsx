import { CalendarDays, Flag, MapPin, Scale } from "lucide-react";
import StatusBadge from "./StatusBadge";

const fmt = (iso) => new Date(iso).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});
const number = (value) => Number(value).toLocaleString("vi-VN");

function formatCondition(condition) {
  const type = String(condition.conditionType || "").toUpperCase();
  const operator = String(condition.operator || "").toUpperCase();

  if (type === "AGE") {
    if (operator === "BETWEEN") return `Tuổi ${number(condition.minValue)}–${number(condition.maxValue)}`;
    if (operator === "LTE") return `Tuổi ≤ ${number(condition.value)}`;
    if (operator === "GTE") return `Tuổi ≥ ${number(condition.value)}`;
  }

  if (type === "WEIGHT") {
    if (operator === "BETWEEN") return `Cân nặng ${number(condition.minValue)}–${number(condition.maxValue)} kg`;
    if (operator === "LTE") return `Cân nặng ≤ ${number(condition.value)} kg`;
    if (operator === "GTE") return `Cân nặng ≥ ${number(condition.value)} kg`;
  }

  if (type === "GENDER") {
    const gender = String(condition.value || "").toUpperCase();
    return gender === "MALE" ? "Ngựa đực" : gender === "FEMALE" ? "Ngựa cái" : `Giới tính ${condition.value}`;
  }

  return [condition.conditionType, condition.operator, condition.value].filter(Boolean).join(" ");
}

export default function TournamentPreview({ tournament }) {
  const {
    tournamentName,
    venue,
    startDate,
    endDate,
    raceCount,
    conditions = [],
    status
  } = tournament;
  const conditionText = conditions.map(formatCondition).filter(Boolean).join(" · ");

  return (
    <article className="group flex flex-col rounded-lg border border-brown-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug text-brown-900">{tournamentName}</h3>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-4 space-y-2.5 text-sm text-brown-900/80">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-brown-500" aria-hidden />
          <dt className="sr-only">Địa điểm</dt>
          <dd>{venue || "Chưa cập nhật địa điểm"}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-4 w-4 shrink-0 text-brown-500" aria-hidden />
          <dt className="sr-only">Thời gian thi đấu</dt>
          <dd>{fmt(startDate)} — {fmt(endDate)}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <Flag className="h-4 w-4 shrink-0 text-brown-500" aria-hidden />
          <dt className="sr-only">Số cuộc đua</dt>
          <dd>{raceCount || 0} cuộc đua</dd>
        </div>
        <div className="flex items-start gap-2.5 border-t border-brown-900/10 pt-3">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-brown-500" aria-hidden />
          <dt className="sr-only">Điều kiện</dt>
          <dd><strong className="font-semibold">Điều kiện:</strong> {conditionText || "Không có điều kiện"}</dd>
        </div>
      </dl>
    </article>
  );
}
