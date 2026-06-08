import { FormEvent, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Clock as ClockIcon, RefreshCw } from "lucide-react";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { WarningPanel } from "@/modules/core/components/warning-panel";
import { Button } from "@/modules/core/design-system/button";
import {
  backendApi,
  type BackendRace,
  type BackendRaceCategory,
  type BackendTournament,
} from "@/modules/core/lib/backend-api";

type RaceForm = {
  tournamentId: string;
  categoryId: string;
  scheduledTime: string;
  maxParticipants: string;
  laneCount: string;
  prizePool: string;
};

const emptyForm: RaceForm = {
  tournamentId: "",
  categoryId: "",
  scheduledTime: "",
  maxParticipants: "6",
  laneCount: "6",
  prizePool: "0",
};

function formatDateTimeInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function validateRace(
  form: RaceForm,
  tournaments: BackendTournament[],
  races: BackendRace[],
  currentId: number | null,
) {
  const errors: Record<string, string> = {};
  const tournamentId = Number(form.tournamentId);
  const categoryId = Number(form.categoryId);
  const maxParticipants = Number(form.maxParticipants);
  const laneCount = Number(form.laneCount);
  const prizePool = Number(form.prizePool);
  const tournament = tournaments.find((item) => item.tournamentId === tournamentId);

  if (!tournamentId) errors.tournamentId = "Tournament is required.";
  if (!categoryId) errors.categoryId = "Race category is required.";
  if (!form.scheduledTime) errors.scheduledTime = "Scheduled time is required.";
  if (!maxParticipants || maxParticipants <= 0) errors.maxParticipants = "Max participants must be greater than 0.";
  if (!laneCount || laneCount <= 0) errors.laneCount = "Lane count must be greater than 0.";
  if (laneCount > maxParticipants) errors.laneCount = "Lane count cannot exceed max participants.";
  if (!Number.isFinite(prizePool) || prizePool < 0) errors.prizePool = "Prize pool must be 0 or greater.";

  if (tournament && form.scheduledTime) {
    const scheduledDate = form.scheduledTime.slice(0, 10);
    if (scheduledDate < tournament.startDate || scheduledDate > tournament.endDate) {
      errors.scheduledTime = "Scheduled date must fall within tournament dates.";
    }
  }

  const duplicate = races.find((race) =>
    race.raceId !== currentId &&
    race.tournamentId === tournamentId &&
    race.status !== "Cancelled" &&
    race.scheduledTime.slice(0, 16) === form.scheduledTime.slice(0, 16),
  );
  if (duplicate) errors.scheduledTime = "A non-cancelled race already exists in this tournament at that time.";

  if (tournament && !["Draft", "OpenForRegistration", "ClosedRegistration"].includes(tournament.status)) {
    errors.tournamentId = "Race setup is allowed only for Draft/OpenForRegistration/ClosedRegistration tournaments.";
  }

  return errors;
}

export const Route = createFileRoute("/admin/races")({
  component: RacesPage,
});

function RacesPage() {
  const [races, setRaces] = useState<BackendRace[]>([]);
  const [tournaments, setTournaments] = useState<BackendTournament[]>([]);
  const [categories, setCategories] = useState<BackendRaceCategory[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RaceForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const editingRace = useMemo(
    () => races.find((race) => race.raceId === editingId) ?? null,
    [editingId, races],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [nextRaces, nextTournaments, nextCategories] = await Promise.all([
        backendApi.races(),
        backendApi.tournaments(),
        backendApi.raceCategories(),
      ]);
      setRaces(nextRaces);
      setTournaments(nextTournaments);
      setCategories(nextCategories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot load races.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const categoryName = (id: number) => categories.find((category) => category.categoryId === id)?.categoryName ?? `Category #${id}`;
  const tournamentName = (id: number) => tournaments.find((tournament) => tournament.tournamentId === id)?.name ?? `Tournament #${id}`;

  const openForm = (race?: BackendRace) => {
    if (race) {
      setEditingId(race.raceId);
      setForm({
        tournamentId: String(race.tournamentId),
        categoryId: String(race.categoryId),
        scheduledTime: formatDateTimeInput(race.scheduledTime),
        maxParticipants: String(race.maxParticipants),
        laneCount: String(race.laneCount),
        prizePool: String(race.prizePool),
      });
    } else {
      setEditingId(null);
      setForm({
        ...emptyForm,
        tournamentId: String(tournaments[0]?.tournamentId ?? ""),
        categoryId: String(categories[0]?.categoryId ?? ""),
      });
    }
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateRace(form, tournaments, races, editingId);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0] ?? "Please fix the form errors.");
      return;
    }
    if (editingRace && editingRace.status !== "Draft") {
      toast.error("Only Draft races can be updated.");
      return;
    }

    const payload = {
      categoryId: Number(form.categoryId),
      scheduledTime: form.scheduledTime,
      maxParticipants: Number(form.maxParticipants),
      laneCount: Number(form.laneCount),
      prizePool: Number(form.prizePool),
    };

    try {
      if (editingId) {
        await backendApi.updateRace(editingId, payload);
        toast.success("Race updated in Today database.");
      } else {
        await backendApi.createRace({ tournamentId: Number(form.tournamentId), ...payload });
        toast.success("Race created in Today database.");
      }
      closeForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot save race.");
    }
  };

  const cancelRace = async (race: BackendRace) => {
    if (race.status !== "Draft") {
      toast.error("Only Draft races can be cancelled.");
      return;
    }
    try {
      await backendApi.cancelRace(race.raceId);
      toast.success("Race cancelled in Today database.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot cancel race.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Race Schedule"
        subtitle="Races are loaded and saved through the backend using Today database"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => openForm()}
              disabled={tournaments.length === 0 || categories.length === 0}
            >
              + Schedule race
            </button>
          </div>
        }
      />

      {formOpen && (
        <section className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl">{editingRace ? "Edit Race" : "Schedule Race"}</h2>
              <p className="text-sm text-muted-foreground">Only fields supported by the current backend API are sent.</p>
            </div>
            <button className="text-sm text-muted-foreground hover:text-foreground" type="button" onClick={closeForm}>
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            {Object.keys(errors).length > 0 && (
              <div className="md:col-span-2">
                <WarningPanel variant="destructive" title="Validation issues" items={Object.values(errors)} />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Tournament</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.tournamentId} disabled={Boolean(editingRace)} onChange={(event) => setForm((prev) => ({ ...prev, tournamentId: event.target.value }))}>
                {tournaments.map((tournament) => <option key={tournament.tournamentId} value={tournament.tournamentId}>{tournament.name} ({tournament.status})</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Category</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.categoryId} onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
                {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Scheduled time</label>
              <div className="relative">
                <input className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm" type="datetime-local" value={form.scheduledTime} onChange={(event) => setForm((prev) => ({ ...prev, scheduledTime: event.target.value }))} />
                <ClockIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Max participants</label>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" type="number" min="1" value={form.maxParticipants} onChange={(event) => setForm((prev) => ({ ...prev, maxParticipants: event.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Lane count</label>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" type="number" min="1" value={form.laneCount} onChange={(event) => setForm((prev) => ({ ...prev, laneCount: event.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Prize pool</label>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" type="number" min="0" value={form.prizePool} onChange={(event) => setForm((prev) => ({ ...prev, prizePool: event.target.value }))} />
            </div>

            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" type="submit">
                {editingRace ? "Save changes" : "Create race"}
              </button>
              {editingRace && editingRace.status === "Draft" && (
                <button type="button" className="rounded-lg border border-destructive bg-background px-4 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={() => void cancelRace(editingRace)}>
                  Cancel race
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading races from Today database...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th>Tournament</th>
                <th>Category</th>
                <th>Race #</th>
                <th>Participants</th>
                <th>Prize</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => {
                const badgeVariant = race.status === "Cancelled" ? "destructive" : statusVariant(race.status);
                return (
                  <tr key={race.raceId} className="border-t border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(race.scheduledTime).toLocaleString()}</td>
                    <td className="text-xs">{tournamentName(race.tournamentId)}</td>
                    <td>{categoryName(race.categoryId)}</td>
                    <td>{race.raceNumber ?? race.raceId}</td>
                    <td>{race.laneCount}/{race.maxParticipants}</td>
                    <td>{Number(race.prizePool).toLocaleString()}</td>
                    <td><StatusBadge variant={badgeVariant}>{race.status}</StatusBadge></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="rounded-lg border border-border bg-background px-3 py-1 text-xs hover:bg-secondary/10" onClick={() => openForm(race)} disabled={race.status !== "Draft"}>
                          Edit
                        </button>
                        <button type="button" className="rounded-lg border border-destructive bg-background px-3 py-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => void cancelRace(race)} disabled={race.status !== "Draft"}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
