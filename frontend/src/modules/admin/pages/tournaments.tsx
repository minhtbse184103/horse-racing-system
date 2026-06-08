import { FormEvent, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { PageHeader } from "@/modules/core/components/app-shell";
import { StatusBadge, statusVariant } from "@/modules/core/components/status-badge";
import { Calendar } from "@/modules/core/design-system/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/core/design-system/popover";
import { Button } from "@/modules/core/design-system/button";
import { backendApi, type BackendTournament } from "@/modules/core/lib/backend-api";

type TournamentForm = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
};

const emptyForm: TournamentForm = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
};

function formatDateInput(value: string) {
  return value ? value.slice(0, 10) : "";
}

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatLocalDateToISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatDateDisplay(value: string) {
  if (!value) return "Select date";
  const [year, month, day] = value.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
}

function parseDateInput(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function DatePickerField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const selectedDate = value ? parseISODate(value) : undefined;
  const [dateInput, setDateInput] = useState(value ? formatDateDisplay(value) : "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDateInput(value ? formatDateDisplay(value) : "");
  }, [value]);

  const handleDateInput = (nextValue: string) => {
    setDateInput(nextValue);
    const parsed = parseDateInput(nextValue);
    if (parsed) onChange(parsed);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground"
          value={dateInput}
          onChange={(event) => handleDateInput(event.target.value)}
          onBlur={() => {
            const parsed = parseDateInput(dateInput);
            if (!parsed) setDateInput(value ? formatDateDisplay(value) : "");
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center p-0 text-white"
            >
              <CalendarIcon className="h-4 w-4 text-white" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto bg-slate-950 p-0 text-white">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                const isoValue = formatLocalDateToISO(date);
                setDateInput(formatDateDisplay(isoValue));
                onChange(isoValue);
                setOpen(false);
              }}
              className="bg-slate-950 text-white"
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function validateTournament(form: TournamentForm, tournaments: BackendTournament[], currentId: number | null) {
  const errors: Record<string, string> = {};
  const name = form.name.trim();
  const location = form.location.trim();

  if (!name) errors.name = "Tournament name is required.";
  if (!location) errors.location = "Location is required.";
  if (!form.startDate) errors.startDate = "Start date is required.";
  if (!form.endDate) errors.endDate = "End date is required.";
  if (!form.registrationDeadline) errors.registrationDeadline = "Registration deadline is required.";

  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    errors.startDate = "Start date cannot be after end date.";
    errors.endDate = "End date cannot be before start date.";
  }

  if (form.registrationDeadline && form.startDate && form.registrationDeadline > form.startDate) {
    errors.registrationDeadline = "Registration deadline cannot be after start date.";
  }

  const duplicate = tournaments.find((tournament) =>
    tournament.tournamentId !== currentId &&
    tournament.status !== "Cancelled" &&
    tournament.location?.trim().toLowerCase() === location.toLowerCase() &&
    tournament.startDate === form.startDate &&
    tournament.endDate === form.endDate,
  );

  if (duplicate) errors.location = "A non-cancelled tournament already exists at this location and dates.";

  return errors;
}

export const Route = createFileRoute("/admin/tournaments")({
  component: TournamentsPage,
});

function TournamentsPage() {
  const [tournaments, setTournaments] = useState<BackendTournament[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TournamentForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const editingTournament = useMemo(
    () => tournaments.find((tournament) => tournament.tournamentId === editingId) ?? null,
    [editingId, tournaments],
  );

  const loadTournaments = async () => {
    setLoading(true);
    try {
      setTournaments(await backendApi.tournaments());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot load tournaments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTournaments();
  }, []);

  const openForm = (tournament?: BackendTournament) => {
    if (tournament) {
      setEditingId(tournament.tournamentId);
      setForm({
        name: tournament.name ?? "",
        location: tournament.location ?? "",
        startDate: formatDateInput(tournament.startDate),
        endDate: formatDateInput(tournament.endDate),
        registrationDeadline: formatDateInput(tournament.registrationDeadline),
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
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

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = {
      name: form.name.trim(),
      location: form.location.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      registrationDeadline: form.registrationDeadline,
    };

    const validationErrors = validateTournament(normalized, tournaments, editingId);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0] ?? "Please fix the form errors.");
      return;
    }

    if (editingTournament && editingTournament.status !== "Draft") {
      toast.error("Only Draft tournaments can be updated.");
      return;
    }

    try {
      if (editingId) {
        await backendApi.updateTournament(editingId, normalized);
        toast.success("Tournament updated in Today database.");
      } else {
        await backendApi.createTournament(normalized);
        toast.success("Tournament created in Today database.");
      }
      closeForm();
      await loadTournaments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot save tournament.");
    }
  };

  const cancelTournament = async (tournament: BackendTournament) => {
    if (tournament.status !== "Draft") {
      toast.error("Only Draft tournaments can be cancelled.");
      return;
    }
    try {
      await backendApi.cancelTournament(tournament.tournamentId);
      toast.success("Tournament cancelled in Today database.");
      await loadTournaments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot cancel tournament.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Tournaments"
        subtitle="Manage tournament lifecycle using the backend and Today database"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadTournaments()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              onClick={() => openForm()}
            >
              + New tournament
            </button>
          </div>
        }
      />

      {formOpen && (
        <section className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl">{editingTournament ? "Edit Tournament" : "Create Tournament"}</h2>
              <p className="text-sm text-muted-foreground">Rules are validated before sending to backend.</p>
            </div>
            <button className="text-sm text-muted-foreground hover:text-foreground" type="button" onClick={closeForm}>
              Close
            </button>
          </div>

          <form onSubmit={submitForm} className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Tournament name</label>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Location</label>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
              {errors.location && <p className="mt-1 text-sm text-destructive">{errors.location}</p>}
            </div>

            <DatePickerField label="Start date" value={form.startDate} onChange={(value) => setForm((prev) => ({ ...prev, startDate: value }))} error={errors.startDate} />
            <DatePickerField label="End date" value={form.endDate} onChange={(value) => setForm((prev) => ({ ...prev, endDate: value }))} error={errors.endDate} />
            <DatePickerField label="Registration deadline" value={form.registrationDeadline} onChange={(value) => setForm((prev) => ({ ...prev, registrationDeadline: value }))} error={errors.registrationDeadline} />

            <div className="flex flex-wrap items-end gap-3 md:col-span-2">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" type="submit">
                {editingTournament ? "Save changes" : "Create tournament"}
              </button>
              {editingTournament && editingTournament.status === "Draft" && (
                <button type="button" className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-secondary/10" onClick={() => void cancelTournament(editingTournament)}>
                  Cancel tournament
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading tournaments from Today database...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tournaments.map((tournament) => (
            <article key={tournament.tournamentId} className="rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl">{tournament.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tournament.location}</p>
                </div>
                <StatusBadge variant={statusVariant(tournament.status)}>{tournament.status}</StatusBadge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-secondary/50 p-2"><div className="text-muted-foreground">ID</div><div className="font-display text-lg">#{tournament.tournamentId}</div></div>
                <div className="rounded-lg bg-secondary/50 p-2"><div className="text-muted-foreground">Start</div><div className="text-xs font-medium pt-1">{tournament.startDate}</div></div>
                <div className="rounded-lg bg-secondary/50 p-2"><div className="text-muted-foreground">End</div><div className="text-xs font-medium pt-1">{tournament.endDate}</div></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-secondary/10" type="button" onClick={() => openForm(tournament)} disabled={tournament.status !== "Draft"}>
                  Edit
                </button>
                <button className="rounded-lg border border-destructive bg-background px-4 py-2 text-sm text-destructive hover:bg-destructive/10" type="button" onClick={() => void cancelTournament(tournament)} disabled={tournament.status !== "Draft"}>
                  Cancel
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
