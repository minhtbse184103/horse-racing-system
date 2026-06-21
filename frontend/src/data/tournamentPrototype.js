export const emptyTournamentForm = {
  name: '',
  description: '',
  venue: '',
  venueImageUrl: '',
  venueImageSrc: '',
  venueImageFile: null,
  venueImageRemoved: false,
  registrationOpen: '',
  registrationClose: '',
  start: '',
  end: '',
  maxRegistration: 80,
  entryFee: 1000000,
  status: 'OPEN_FOR_REGISTRATION',
  conditions: [],
  races: []
};

export const tournamentLifecycle = [
  'OPEN_FOR_REGISTRATION',
  'REGISTRATION_CLOSED',
  'IN_PROGRESS',
  'COMPLETED'
];

export {
  conditionOperatorLabels,
  conditionTypeLabels,
  formatRaceSchedule,
  formatTournamentCondition,
  formatVndCurrency,
  tournamentStatusLabels
} from '../lib/eventFormatters';
