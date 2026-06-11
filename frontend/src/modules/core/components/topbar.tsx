import { useRole, ROLE_LABELS, type Role } from "@/modules/core/lib/role-context";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const ROLES: Role[] = ["admin", "owner", "jockey", "referee", "spectator"];
const ROUTE_FOR_ROLE: Record<Role, string> = {
  admin: "/admin", owner: "/owner", jockey: "/jockey", referee: "/referee", spectator: "/spectator",
};

export function Topbar() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Viewing as</div>
        <div className="font-display text-lg text-foreground">{ROLE_LABELS[role]}</div>
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary/40"
        >
          Switch role <ChevronDown className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setOpen(false);
                  navigate({ to: ROUTE_FOR_ROLE[r] });
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
