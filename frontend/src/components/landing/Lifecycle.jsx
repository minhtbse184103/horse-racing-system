import { ChevronRight, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";

const LIFECYCLE_STAGES = [
  { key: "openforregistration", description: "Owner đăng ký ngựa và mời jockey." },
  { key: "closedregistration", description: "Khóa đơn đăng ký để admin xét duyệt danh sách tham gia." },
  { key: "ongoing", description: "Các cuộc đua diễn ra và referee ghi nhận kết quả." },
  { key: "finished", description: "Công bố kết quả chính thức, xếp hạng và giải thưởng." },
];

export default function Lifecycle() {
  return (
    <section className="bg-cream-200 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">Vòng đời giải đấu</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brown-900 sm:text-4xl">Từ mở đăng ký đến vạch đích</h2>
          <p className="mt-3 text-base text-brown-900/70">Mỗi giải đấu tiến triển qua các giai đoạn rõ ràng, có thể kiểm tra.</p>
        </div>

        <div className="mt-10 flex flex-wrap items-stretch gap-3">
          {LIFECYCLE_STAGES.map((s, i) => (
            <div key={s.key} className="flex items-stretch gap-3">
              <div className="flex w-64 flex-col rounded-lg border border-brown-900/10 bg-white p-4 shadow-sm">
                <StatusBadge status={s.key} />
                <p className="mt-3 text-sm leading-relaxed text-brown-900/75">{s.description}</p>
              </div>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <div className="hidden items-center text-brown-900/30 sm:flex" aria-hidden>
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 inline-flex items-center gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          <XCircle className="h-4 w-4" aria-hidden />
          <span><strong className="font-bold">Đã hủy</strong> - trạng thái kết thúc khi giải đấu không thể diễn ra.</span>
        </div>
      </div>
    </section>
  );
}
