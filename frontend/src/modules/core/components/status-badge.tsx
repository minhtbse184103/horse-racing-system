import { cn } from "@/modules/core/lib/utils";

type Variant = "default" | "success" | "warning" | "destructive" | "muted" | "primary";

const styles: Record<Variant, string> = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary/15 text-primary border border-primary/30",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  destructive: "bg-destructive/15 text-destructive border border-destructive/30",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({ children, variant = "default", className }: { children: React.ReactNode; variant?: Variant; className?: string; }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", styles[variant], className)}>
      {children}
    </span>
  );
}

export function statusVariant(s: string): Variant {
  const x = s.toLowerCase();
  if (["completed", "finalized", "approved", "accepted", "active"].includes(x)) return "success";
  if (["pending", "scheduled", "registrationopen", "upcoming"].includes(x)) return "primary";
  if (["live", "ongoing", "registrationclosed"].includes(x)) return "warning";
  if (["rejected", "suspended", "injured"].includes(x)) return "destructive";
  return "default";
}
