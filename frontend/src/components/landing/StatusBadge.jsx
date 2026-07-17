const STYLES = {
  openforregistration: { label: "Mở đăng ký", cls: "bg-emerald-50 text-emerald-800 border-emerald-700/20" },
  registrationclosed: { label: "Đã đóng đăng ký", cls: "bg-cream-200 text-brown-900 border-brown-900/20" },
  closedregistration: { label: "Đã đóng đăng ký", cls: "bg-cream-200 text-brown-900 border-brown-900/20" },
  inprogress: { label: "Đang diễn ra", cls: "bg-gold-400/20 text-brown-900 border-gold-400/40" },
  ongoing: { label: "Đang diễn ra", cls: "bg-gold-400/20 text-brown-900 border-gold-400/40" },
  completed: { label: "Đã kết thúc", cls: "bg-brown-900/5 text-brown-900 border-brown-900/20" },
  finished: { label: "Đã kết thúc", cls: "bg-brown-900/5 text-brown-900 border-brown-900/20" },
  cancelled: { label: "Đã hủy", cls: "bg-danger/10 text-danger border-danger/30" },
};

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const key = String(status || "openforregistration").replace(/[_\s-]/g, "").toLowerCase();
  const s = STYLES[key] ?? STYLES.openforregistration;
  const translationKeys = {
    openforregistration: "status_OPEN_FOR_REGISTRATION",
    registrationclosed: "status_REGISTRATION_CLOSED",
    closedregistration: "status_REGISTRATION_CLOSED",
    inprogress: "status_IN_PROGRESS",
    ongoing: "status_IN_PROGRESS",
    completed: "status_COMPLETED",
    finished: "status_COMPLETED",
    cancelled: "status_CANCELLED"
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {translationKeys[key] ? t(translationKeys[key]) : s.label}
    </span>
  );
}
import { useLanguage } from "../../context/LanguageContext";
