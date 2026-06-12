import { Search, ClipboardList, UserPlus, ShieldCheck, Flag, Trophy } from "lucide-react";

const STEPS = [
  { icon: Search, title: "Khám phá giải đấu", desc: "Xem lịch và tìm giải đấu phù hợp." },
  { icon: ClipboardList, title: "Đăng ký ngựa", desc: "Owner gửi hồ sơ ngựa đáp ứng điều kiện." },
  { icon: UserPlus, title: "Mời jockey", desc: "Gửi lời mời đến các jockey đủ điều kiện." },
  { icon: ShieldCheck, title: "Admin xét duyệt", desc: "Các đơn đăng ký được xác minh và phê duyệt." },
  { icon: Flag, title: "Phân công cuộc đua", desc: "Ngựa được xếp vào cuộc đua và phân làn." },
  { icon: Trophy, title: "Thi đấu và xem kết quả", desc: "Thi đấu, ghi nhận kết quả và công bố xếp hạng." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream-200 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">Quy trình</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brown-900 sm:text-4xl">Quy trình hoạt động</h2>
          <p className="mt-3 text-base text-brown-900/70">
            From discovery to the winner's circle — every stage is tracked in one place.
          </p>
        </div>

        <ol className="relative mt-14 hidden lg:grid lg:grid-cols-6 lg:gap-6">
          <div className="pointer-events-none absolute left-0 right-0 top-6 h-px bg-brown-900/15" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex flex-col items-start">
              <div className="relative z-10 grid h-12 w-12 place-items-center rounded-md border border-brown-900/15 bg-white text-brown-900 shadow-sm">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="mt-4 text-xs font-bold uppercase tracking-wider text-brown-500">
                Step {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-base font-bold text-brown-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-brown-900/70">{s.desc}</p>
            </li>
          ))}
        </ol>

        <ol className="relative mt-12 space-y-7 lg:hidden">
          <div className="absolute left-6 top-3 bottom-3 w-px bg-brown-900/15" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-5">
              <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-md border border-brown-900/15 bg-white text-brown-900 shadow-sm">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brown-500">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-base font-bold text-brown-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brown-900/70">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
