export function formatTournamentDate(value) {
  if (!value) return 'Chưa xác định';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
}

export function getCapacityTone(percentage) {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 75) return 'bg-gold-400';
  return 'bg-emerald-600';
}

export function getTournamentPrizeTotal(tournament) {
  return tournament.races.reduce(
    (total, race) => total + race.prizes.reduce((sum, prize) => sum + Number(prize.amount || 0), 0),
    0
  );
}

export function buildRegistrationCounts(registrations) {
  return registrations.reduce((counts, registration) => {
    counts.set(registration.tournamentId, (counts.get(registration.tournamentId) || 0) + 1);
    return counts;
  }, new Map());
}
