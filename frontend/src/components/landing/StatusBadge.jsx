const STYLES = {
  draft: { label: "Draft", cls: "bg-cream-200 text-brown-700 border-brown-700/20" },
  openforregistration: { label: "Open for Registration", cls: "bg-emerald-50 text-emerald-800 border-emerald-700/20" },
  closedregistration: { label: "Registration Closed", cls: "bg-cream-200 text-brown-900 border-brown-900/20" },
  ongoing: { label: "Ongoing", cls: "bg-gold-400/20 text-brown-900 border-gold-400/40" },
  finished: { label: "Finished", cls: "bg-brown-900/5 text-brown-900 border-brown-900/20" },
  cancelled: { label: "Cancelled", cls: "bg-danger/10 text-danger border-danger/30" },
};

export default function StatusBadge({ status }) {
  const key = String(status || "draft").replace(/[_\s-]/g, "").toLowerCase();
  const s = STYLES[key] ?? STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {s.label}
    </span>
  );
}
