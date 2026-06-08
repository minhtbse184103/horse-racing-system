import { FormEvent, useMemo, useState } from "react";
import { Flag, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../../core/components/Button";
import { StatusBadge } from "../../core/components/StatusBadge";
import { api, type Race, type RaceCategory, type RaceFormPayload, type Tournament } from "../../core/lib/api";
import { useAsyncData } from "../../core/hooks/useAsyncData";
import { canEditRace, validateRaceForm } from "../utils/validation";

const emptyForm: RaceFormPayload = {
  tournamentId: 0,
  categoryId: 0,
  scheduledTime: "",
  maxParticipants: 6,
  laneCount: 6,
  prizePool: 0,
};

export function RacesPanel({
  tournaments,
  categories,
  refreshSignal,
}: {
  tournaments: Tournament[];
  categories: RaceCategory[];
  refreshSignal: number;
}) {
  const { data, loading, error, reload } = useAsyncData(() => api.races(), [refreshSignal]);
  const races = data ?? [];
  const [editing, setEditing] = useState<Race | null>(null);
  const [form, setForm] = useState<RaceFormPayload>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(() => [...races].sort((a, b) => b.raceId - a.raceId), [races]);

  function tournamentName(id: number) {
    return tournaments.find((item) => item.tournamentId === id)?.name ?? `Tournament #${id}`;
  }

  function categoryName(id: number) {
    return categories.find((item) => item.categoryId === id)?.categoryName ?? `Category #${id}`;
  }

  function openForm(race?: Race) {
    setMessage(null);
    setEditing(race ?? null);
    setForm(race ? {
      tournamentId: race.tournamentId,
      categoryId: race.categoryId,
      scheduledTime: race.scheduledTime.slice(0, 16),
      maxParticipants: race.maxParticipants,
      laneCount: race.laneCount,
      prizePool: race.prizePool,
    } : {
      ...emptyForm,
      tournamentId: tournaments[0]?.tournamentId ?? 0,
      categoryId: categories[0]?.categoryId ?? 0,
    });
    setFormOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const normalized: RaceFormPayload = {
      tournamentId: Number(form.tournamentId),
      categoryId: Number(form.categoryId),
      scheduledTime: form.scheduledTime,
      maxParticipants: Number(form.maxParticipants),
      laneCount: Number(form.laneCount),
      prizePool: Number(form.prizePool),
    };
    const errors = validateRaceForm(normalized, races, tournaments, editing?.raceId);
    if (errors.length > 0) {
      setMessage(errors[0]);
      return;
    }
    const tournament = tournaments.find((item) => item.tournamentId === normalized.tournamentId);
    if (editing && !canEditRace(editing, tournament)) {
      setMessage("Only Draft races in an editable tournament can be updated.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.updateRace("", editing.raceId, {
          categoryId: normalized.categoryId,
          scheduledTime: normalized.scheduledTime,
          maxParticipants: normalized.maxParticipants,
          laneCount: normalized.laneCount,
          prizePool: normalized.prizePool,
        });
      } else {
        await api.createRace("", normalized);
      }
      setFormOpen(false);
      setEditing(null);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cannot save race");
    } finally {
      setBusy(false);
    }
  }

  async function cancelRace(race: Race) {
    const tournament = tournaments.find((item) => item.tournamentId === race.tournamentId);
    if (!canEditRace(race, tournament)) {
      setMessage("Only Draft races can be cancelled.");
      return;
    }
    setBusy(true);
    try {
      await api.deleteRace("", race.raceId);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cannot cancel race");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>Races</h2>
        </div>
        <div className="actions">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void reload()}>Refresh</Button>
          <Button icon={<Plus size={16} />} onClick={() => openForm()} disabled={tournaments.length === 0 || categories.length === 0}>New race</Button>
        </div>
      </div>

      {message && <p className="message danger">{message}</p>}
      {error && <p className="message danger">{error}</p>}

      {formOpen && (
        <form className="form-grid" onSubmit={submit}>
          <label>
            Tournament
            <select value={form.tournamentId} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, tournamentId: Number(event.target.value) })}>
              {tournaments.map((tournament) => <option key={tournament.tournamentId} value={tournament.tournamentId}>{tournament.name} ({tournament.status})</option>)}
            </select>
          </label>
          <label>
            Category
            <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })}>
              {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}
            </select>
          </label>
          <label>
            Scheduled time
            <input type="datetime-local" required value={form.scheduledTime} onChange={(event) => setForm({ ...form, scheduledTime: event.target.value })} />
          </label>
          <label>
            Max participants
            <input type="number" min="1" required value={form.maxParticipants} onChange={(event) => setForm({ ...form, maxParticipants: Number(event.target.value) })} />
          </label>
          <label>
            Lane count
            <input type="number" min="1" required value={form.laneCount} onChange={(event) => setForm({ ...form, laneCount: Number(event.target.value) })} />
          </label>
          <label>
            Prize pool
            <input type="number" min="0" step="1000" required value={form.prizePool} onChange={(event) => setForm({ ...form, prizePool: Number(event.target.value) })} />
          </label>
          <div className="form-actions">
            <Button type="submit" disabled={busy} icon={<Flag size={16} />}>{editing ? "Save changes" : "Create race"}</Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Close</Button>
          </div>
        </form>
      )}

      {loading ? <p className="muted">Loading races...</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tournament</th>
                <th>Category</th>
                <th>Scheduled</th>
                <th>Participants</th>
                <th>Prize</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((race) => {
                const tournament = tournaments.find((item) => item.tournamentId === race.tournamentId);
                const editable = canEditRace(race, tournament);
                return (
                  <tr key={race.raceId}>
                    <td>#{race.raceId}</td>
                    <td>{tournamentName(race.tournamentId)}</td>
                    <td>{categoryName(race.categoryId)}</td>
                    <td>{new Date(race.scheduledTime).toLocaleString()}</td>
                    <td>{race.laneCount}/{race.maxParticipants}</td>
                    <td>{Number(race.prizePool).toLocaleString()}</td>
                    <td><StatusBadge status={race.status} /></td>
                    <td>
                      <div className="actions">
                        <Button variant="secondary" icon={<Pencil size={14} />} disabled={!editable} onClick={() => openForm(race)}>Edit</Button>
                        <Button variant="danger" icon={<Trash2 size={14} />} disabled={!editable} onClick={() => void cancelRace(race)}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
