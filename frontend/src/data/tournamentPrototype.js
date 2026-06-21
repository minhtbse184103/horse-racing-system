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
  entryFee: 2000,
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
  tournamentStatusLabels
} from '../lib/eventFormatters';
