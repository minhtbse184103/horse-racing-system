import { Crown, Medal, ShieldCheck, Gavel } from "lucide-react";

const ROLES = [
  { icon: Crown, title: "Owner", desc: "Đăng ký ngựa, tham gia giải đấu và mời jockey thi đấu." },
  { icon: Medal, title: "Jockey", desc: "Nhận lời mời, chấp nhận thi đấu và tham gia các cuộc đua đã lên lịch." },
  { icon: ShieldCheck, title: "Admin", desc: "Tạo giải đấu, xét duyệt đơn đăng ký và quản lý phân công cuộc đua." },
  { icon: Gavel, title: "Referee", desc: "Ghi nhận kết quả cuộc đua và công bố kết quả chính thức." },
];

export default function Roles() {
  return (
    <section id="roles" className="bg-cream-100 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brown-500">User roles</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brown-900 sm:text-4xl">
            Built for every role in the paddock
          </h2>
          <p className="mt-3 text-base text-brown-900/70">Bốn không gian làm việc chuyên biệt trên cùng một tiến trình giải đấu.</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-lg border border-brown-900/10 bg-white p-6 shadow-sm transition hover:border-gold-400 hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-brown-900 text-gold-400">
                <r.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-bold text-brown-900">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brown-900/70">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
