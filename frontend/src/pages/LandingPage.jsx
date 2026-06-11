import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Tournaments from "../components/landing/Tournaments";
import HowItWorks from "../components/landing/HowItWorks";
import Roles from "../components/landing/Roles";
import Lifecycle from "../components/landing/Lifecycle";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import {
  getPublicTournamentConditions,
  getPublicTournaments
} from "../services/eventService";

export default function LandingPage({ onGoLogin, onGoRegister }) {
  const [tournaments, setTournaments] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLandingData() {
      setIsLoading(true);
      setError("");

      try {
        const [tournamentData, conditionData] = await Promise.all([
          getPublicTournaments(),
          getPublicTournamentConditions()
        ]);

        setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
        setConditions(Array.isArray(conditionData) ? conditionData : []);
      } catch (err) {
        setError(err.message || "Unable to load tournament information.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLandingData();
  }, []);

  const conditionById = useMemo(
    () =>
      new Map(
        conditions.map((condition) => [
          String(condition.conditionId),
          condition.conditionName
        ])
      ),
    [conditions]
  );

  const visibleTournaments = useMemo(
    () =>
      tournaments
        .filter((tournament) => tournament.status !== "Cancelled")
        .map((tournament) => ({
          ...tournament,
          conditionName:
            conditionById.get(String(tournament.conditionId)) ||
            `Condition ${tournament.conditionId}`
        }))
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))),
    [tournaments, conditionById]
  );

  const heroStats = useMemo(
    () => [
      {
        label: "Active Tournaments",
        value: tournaments.filter((tournament) =>
          ["OpenForRegistration", "ClosedRegistration", "Ongoing"].includes(
            tournament.status
          )
        ).length
      },
      {
        label: "Open Registration",
        value: tournaments.filter(
          (tournament) => tournament.status === "OpenForRegistration"
        ).length
      },
      {
        label: "Available Capacity",
        value: visibleTournaments.reduce(
          (total, tournament) => total + Number(tournament.maxParticipants || 0),
          0
        )
      }
    ],
    [tournaments, visibleTournaments]
  );

  return (
    <div className="min-h-screen bg-cream-100 text-brown-900 font-sans">
      <Navbar onGoLogin={onGoLogin} onGoRegister={onGoRegister} />
      <main>
        <Hero stats={heroStats} isLoading={isLoading} />
        <Tournaments
          tournaments={visibleTournaments}
          isLoading={isLoading}
          error={error}
        />
        <HowItWorks />
        <Roles />
        <Lifecycle />
        <FinalCTA onGoLogin={onGoLogin} onGoRegister={onGoRegister} />
      </main>
      <Footer />
    </div>
  );
}
