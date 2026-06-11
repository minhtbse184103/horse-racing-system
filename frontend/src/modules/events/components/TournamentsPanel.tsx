import { FormEvent, useMemo, useState } from "react";
import { CalendarPlus, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../../core/components/Button";
import { StatusBadge } from "../../core/components/StatusBadge";
import { api, type Tournament, type TournamentFormPayload } from "../../core/lib/api";
import { useAsyncData } from "../../core/hooks/useAsyncData";
import { canEditTournament, validateTournamentForm } from "../utils/validation";

const emptyForm: TournamentFormPayload = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
};

export function TournamentsPanel({ onChanged }: { onChanged: () => void }) {
  const { data, loading, error, reload } = useAsyncData(() => api.tournaments(), []);
  const tournaments = data ?? [];
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<TournamentFormPayload>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(
    () => [...tournaments].sort((a, b) => b.tournamentId - a.tournamentId),
    [tournaments],
  );

  function openForm(tournament?: Tournament) {
    setMessage(null);
    setEditing(tournament ?? null);
    setForm(tournament ? {
      name: tournament.name,
      location: tournament.location,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationDeadline: tournament.registrationDeadline?.slice(0, 10) ?? "",
    } : emptyForm);
    setFormOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const normalized = {
      name: form.name.trim(),
      location: form.location.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      registrationDeadline: form.registrationDeadline,
    };
    const errors = validateTournamentForm(normalized, tournaments, editing?.tournamentId);
    if (errors.length > 0) {
      setMessage(errors[0]);
      return;
    }
    if (editing && !canEditTournament(editing)) {
      setMessage("Only Draft tournaments can be updated.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.updateTournament("", editing.tournamentId, normalized);
      } else {
        await api.createTournament("", normalized);
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await reload();
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cannot save tournament");
    } finally {
      setBusy(false);
    }
  }

  async function cancelTournament(tournament: Tournament) {
    if (!canEditTournament(tournament)) {
      setMessage("Only Draft tournaments can be cancelled.");
      return;
    }
    setBusy(true);
    try {
      await api.deleteTournament("", tournament.tournamentId);
      await reload();
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cannot cancel tournament");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <p className="eyebrow">Event creation</p>
          <h2>Tournaments</h2>
        </div>
        <div className="actions">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void reload()}>Refresh</Button>
          <Button icon={<CalendarPlus size={16} />} onClick={() => openForm()}>New tournament</Button>
        </div>
      </div>

      {message && <p className="message danger">{message}</p>}
      {error && <p className="message danger">{error}</p>}

      {formOpen && (
        <form className="form-grid" onSubmit={submit}>
          <label>
            Tournament name
            <input value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Location
            <input value={form.location} required onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label>
            Start date
            <input type="date" value={form.startDate} required onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
          </label>
          <label>
            End date
            <input type="date" value={form.endDate} required onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
          </label>
          <label>
            Registration deadline
            <input type="date" value={form.registrationDeadline} required onChange={(event) => setForm({ ...form, registrationDeadline: event.target.value })} />
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={busy}>{editing ? "Save changes" : "Create tournament"}</Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Close</Button>
          </div>
        </form>
      )}

      {loading ? <p className="muted">Loading tournaments...</p> : (
        <div className="card-grid">
          {sorted.map((tournament) => (
            <article className="item-card" key={tournament.tournamentId}>
              <div className="item-head">
                <div>
                  <h3>{tournament.name}</h3>
                  <p className="muted">{tournament.location}</p>
                </div>
                <StatusBadge status={tournament.status} />
              </div>
              <dl className="facts">
                <div><dt>Start</dt><dd>{tournament.startDate}</dd></div>
                <div><dt>End</dt><dd>{tournament.endDate}</dd></div>
                <div><dt>Deadline</dt><dd>{tournament.registrationDeadline?.slice(0, 10)}</dd></div>
              </dl>
              <div className="actions">
                <Button variant="secondary" icon={<Pencil size={15} />} disabled={!canEditTournament(tournament)} onClick={() => openForm(tournament)}>Edit</Button>
                <Button variant="danger" icon={<Trash2 size={15} />} disabled={!canEditTournament(tournament)} onClick={() => void cancelTournament(tournament)}>Cancel</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
