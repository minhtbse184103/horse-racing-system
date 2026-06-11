import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "admin" | "owner" | "jockey" | "referee" | "spectator";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  // Convenience: tied identity per role for the demo
  activeId: string;
}

const RoleContext = createContext<RoleCtx | null>(null);

const ID_FOR_ROLE: Record<Role, string> = {
  admin: "admin",
  owner: "o1",
  jockey: "j1",
  referee: "r1",
  spectator: "spectator",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  return (
    <RoleContext.Provider value={{ role, setRole, activeId: ID_FOR_ROLE[role] }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const c = useContext(RoleContext);
  if (!c) throw new Error("useRole must be inside RoleProvider");
  return c;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  owner: "Horse Owner",
  jockey: "Jockey",
  referee: "Referee",
  spectator: "Spectator",
};
