import { FormEvent, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "../../core/components/Button";
import { useAuth } from "../hooks/useAuth";

type Mode = "login" | "signup";

const publicRoles = ["OWNER", "JOCKEY", "SPECTATOR"];

export function AuthPanel() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    roleName: "OWNER",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "login") {
        await auth.login(form.email.trim(), form.password);
      } else {
        await auth.signup({
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          roleName: form.roleName,
        });
        setMessage("Account created. You can sign in now.");
        setMode("login");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  if (auth.user) {
    return (
      <section className="panel compact auth-card">
        <div>
          <p className="eyebrow">Signed in</p>
          <h2>{auth.user.fullName}</h2>
          <p className="muted">{auth.user.email} - {auth.user.role}</p>
        </div>
        <Button variant="secondary" onClick={auth.logout}>Logout</Button>
      </section>
    );
  }

  return (
    <section className="panel auth-card">
      <div className="segmented">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Signup</button>
      </div>
      <form onSubmit={submit} className="form-grid one">
        <label>
          Email
          <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        {mode === "signup" && (
          <>
            <label>
              Full name
              <input required maxLength={255} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </label>
            <label>
              Phone
              <input required pattern="^\+?[0-9]{9,15}$" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label>
              Role
              <select value={form.roleName} onChange={(event) => setForm({ ...form, roleName: event.target.value })}>
                {publicRoles.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
          </>
        )}
        <label>
          Password
          <input type="password" required minLength={6} maxLength={72} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        {message && <p className="message">{message}</p>}
        <Button type="submit" disabled={busy} icon={mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}>
          {busy ? "Please wait" : mode === "login" ? "Login" : "Create account"}
        </Button>
      </form>
    </section>
  );
}
