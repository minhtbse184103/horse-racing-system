export function StatusBadge({ status }: { status?: string }) {
  const value = status || "Unknown";
  const normalized = value.toLowerCase();
  const tone =
    normalized.includes("cancel") || normalized.includes("inactive")
      ? "danger"
      : normalized.includes("draft")
        ? "draft"
        : normalized.includes("finish") || normalized.includes("complete")
          ? "success"
          : "info";

  return <span className={`status status-${tone}`}>{value}</span>;
}
