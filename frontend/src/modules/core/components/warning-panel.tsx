import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/modules/core/lib/utils";

export function WarningPanel({
  title, items, variant = "warning", className,
}: {
  title: string;
  items: string[];
  variant?: "warning" | "destructive" | "info";
  className?: string;
}) {
  const map = {
    warning: "border-warning/40 bg-warning/10 text-warning",
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
    info: "border-primary/40 bg-primary/10 text-primary",
  } as const;
  const Icon = variant === "info" ? Info : AlertTriangle;
  return (
    <div className={cn("rounded-xl border p-4", map[variant], className)}>
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
