import { useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, Flag, LayoutDashboard, ListChecks, Users } from "lucide-react";
import { UsersPanel } from "../admin/components/UsersPanel";
import { RaceCategoriesPanel } from "../events/components/RaceCategoriesPanel";
import { TournamentsPanel } from "../events/components/TournamentsPanel";
import { RacesPanel } from "../events/components/RacesPanel";
import { api } from "./lib/api";
import { useAsyncData } from "./hooks/useAsyncData";

type Tab = "overview" | "tournaments" | "races" | "categories" | "users";

function AppContent() {
  const [tab, setTab] = useState<Tab>("overview");
  const [refreshSignal, setRefreshSignal] = useState(0);
  const tournaments = useAsyncData(() => api.tournaments(), [refreshSignal]);
  const categories = useAsyncData(() => api.raceCategories(), []);

  const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={17} /> },
    { id: "tournaments", label: "Tournaments", icon: <CalendarDays size={17} /> },
    { id: "races", label: "Races", icon: <Flag size={17} /> },
    { id: "categories", label: "Categories", icon: <ListChecks size={17} /> },
    { id: "users", label: "Users", icon: <Users size={17} /> },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">HR</div>
          <div>
            <h1>Horse Racing</h1>
            <p>Event Creation</p>
          </div>
        </div>
        <nav>
          {tabs.map((item) => (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main>
        <header className="page-hero">
          <div>
            <p className="eyebrow">Backend aligned frontend</p>
            <h2>Event creation workspace</h2>
            <p>Forms are mapped to the current Spring Boot API and apply the Event Creation BR rules where backend fields exist.</p>
          </div>
          <div className="summary">
            <div><span>{tournaments.data?.length ?? 0}</span><small>Tournaments</small></div>
            <div><span>{categories.data?.length ?? 0}</span><small>Categories</small></div>
          </div>
        </header>

        {tab === "overview" && (
          <div className="stack">
            <RaceCategoriesPanel />
            <TournamentsPanel onChanged={() => setRefreshSignal((value) => value + 1)} />
          </div>
        )}
        {tab === "tournaments" && <TournamentsPanel onChanged={() => setRefreshSignal((value) => value + 1)} />}
        {tab === "races" && (
          <RacesPanel
            tournaments={tournaments.data ?? []}
            categories={categories.data ?? []}
            refreshSignal={refreshSignal}
          />
        )}
        {tab === "categories" && <RaceCategoriesPanel />}
        {tab === "users" && <UsersPanel />}
      </main>
    </div>
  );
}

export function App() {
  return <AppContent />;
}
