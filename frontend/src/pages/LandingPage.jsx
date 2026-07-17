import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Tournaments from "../components/landing/Tournaments";
import HowItWorks from "../components/landing/HowItWorks";
import Roles from "../components/landing/Roles";
import Lifecycle from "../components/landing/Lifecycle";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import Racecards from "../components/landing/Racecards";
import Leaderboard from "../components/landing/Leaderboard";
import LanguageToggle from "../components/common/LanguageToggle";
import {
  getPublicTournamentConditions,
  getPublicTournaments,
  getPublicRaces,
  getPublicRaceResults
} from "../services/eventService";
import { useLanguage } from "../context/LanguageContext";

export default function LandingPage({ onGoLogin, onGoRegister }) {
  const { t } = useLanguage();
  const [tournaments, setTournaments] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [races, setRaces] = useState([]);
  const [officialResults, setOfficialResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLandingData() {
      setIsLoading(true);
      setError("");

      try {
        const [tournamentData, conditionData, raceData] = await Promise.all([
          getPublicTournaments(),
          getPublicTournamentConditions(),
          getPublicRaces()
        ]);

        setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
        setConditions(Array.isArray(conditionData) ? conditionData : []);
        setRaces(Array.isArray(raceData) ? raceData : []);

        const completedRaces = (Array.isArray(raceData) ? raceData : []).filter(
          (race) => String(race.status).toUpperCase() === "COMPLETED"
        );
        const resultGroups = await Promise.allSettled(
          completedRaces.map((race) => getPublicRaceResults(race.raceId))
        );
        setOfficialResults(
          resultGroups.flatMap((result) =>
            result.status === "fulfilled" && Array.isArray(result.value) ? result.value : []
          )
        );
      } catch (err) {
        setError(err.message || "Không thể tải thông tin giải đấu.");
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
            `Điều kiện ${tournament.conditionId}`
        }))
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))),
    [tournaments, conditionById]
  );

  const heroStats = useMemo(
    () => [
      {
        label: t('homeActiveTournaments'),
        value: tournaments.filter((tournament) =>
          ["OPEN_FOR_REGISTRATION", "REGISTRATION_CLOSED", "IN_PROGRESS"].includes(
            String(tournament.status).toUpperCase()
          )
        ).length
      },
      {
        label: t('homeOpenRegistration'),
        value: tournaments.filter(
          (tournament) => String(tournament.status).toUpperCase() === "OPEN_FOR_REGISTRATION"
        ).length
      }
    ],
    [tournaments, t]
  );

  return (
    <div className="min-h-screen bg-cream-100 text-brown-900 font-sans">
      <div className="fixed right-4 top-20 z-[60]">
        <LanguageToggle />
      </div>
      <Navbar onGoLogin={onGoLogin} onGoRegister={onGoRegister} />
      <main>
        <Hero stats={heroStats} isLoading={isLoading} />
        <Racecards races={races} tournaments={visibleTournaments} isLoading={isLoading} error={error} />
        <Leaderboard results={officialResults} isLoading={isLoading} />
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
