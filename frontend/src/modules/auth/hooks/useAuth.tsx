import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type LoginResponse, type UserResponse } from "../../core/lib/api";

type AuthContextValue = {
  token: string | null;
  user: UserResponse | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { email: string; fullName: string; phone: string; password: string; roleName: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "horse-racing:event-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const stored = JSON.parse(raw) as LoginResponse;
      setToken(stored.token);
      setUser(stored.user);
      void api.me(stored.token).then(setUser).catch(() => localStorage.removeItem(STORAGE_KEY));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAdmin: user?.role?.toUpperCase() === "ADMIN",
      async login(email, password) {
        const response = await api.login({ email, password });
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
      },
      async signup(payload) {
        await api.signup(payload);
      },
      logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
