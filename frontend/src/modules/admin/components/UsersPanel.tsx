import { FormEvent, useState } from "react";
import { Pencil, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { Button } from "../../core/components/Button";
import { StatusBadge } from "../../core/components/StatusBadge";
import { api, type RoleName, type UserResponse } from "../../core/lib/api";
import { useAsyncData } from "../../core/hooks/useAsyncData";

const roles: RoleName[] = ["ADMIN", "OWNER", "JOCKEY", "REFEREE", "SPECTATOR"];

export function UsersPanel() {
  const { data, loading, error, reload } = useAsyncData(() => api.users(""), []);
  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
    roleName: "OWNER",
    status: "ACTIVE",
  });

  function openForm(user?: UserResponse) {
    setMessage(null);
    setEditing(user ?? null);
    setForm(user ? {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      password: "",
      roleName: user.role || "OWNER",
      status: user.status || "ACTIVE",
    } : {
      email: "",
      fullName: "",
      phone: "",
      password: "",
      roleName: "OWNER",
      status: "ACTIVE",
    });
    setFormOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (editing) {
        await api.updateUser("", editing.id, {
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          roleName: form.roleName,
          status: form.status.trim(),
        });
      } else {
        await api.createUser("", {
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          password: form.password,
          roleName: form.roleName,
        });
      }
      setFormOpen(false);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cannot save user");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: UserResponse) {
    setBusy(true);
    setMessage(null);
    try {
      await api.deleteUser("", user.id);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cannot delete user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Users</h2>
        </div>
        <div className="actions">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void reload()}>Refresh</Button>
          <Button icon={<UserPlus size={16} />} onClick={() => openForm()}>New user</Button>
        </div>
      </div>
      {message && <p className="message danger">{message}</p>}
      {error && <p className="message danger">{error}</p>}

      {formOpen && (
        <form className="form-grid" onSubmit={submit}>
          <label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Full name<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
          <label>Phone<input required pattern="^\+?[0-9]{9,15}$" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          {!editing && <label>Password<input type="password" required minLength={6} maxLength={72} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>}
          <label>Role<select value={form.roleName} onChange={(event) => setForm({ ...form, roleName: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          {editing && <label>Status<input value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} /></label>}
          <div className="form-actions">
            <Button type="submit" disabled={busy}>{editing ? "Save user" : "Create user"}</Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Close</Button>
          </div>
        </form>
      )}

      {loading ? <p className="muted">Loading users...</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                  <td><StatusBadge status={user.status} /></td>
                  <td>
                    <div className="actions">
                      <Button variant="secondary" icon={<Pencil size={14} />} onClick={() => openForm(user)}>Edit</Button>
                      <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => void deleteUser(user)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
