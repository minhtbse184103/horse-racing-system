import { CalendarDays, ClipboardCheck, Flag, Medal, Scale, Trophy, Users } from 'lucide-react';

export const WIZARD_STEPS = [
  { id: 1, label: 'Tournament', shortLabel: 'Information', icon: Trophy },
  { id: 2, label: 'Races', shortLabel: 'Configuration', icon: Flag },
  { id: 3, label: 'Prizes', shortLabel: 'By race rank', icon: Medal },
  { id: 4, label: 'Review', shortLabel: 'Confirmation', icon: ClipboardCheck }
];

export const CONDITION_TYPES = [
  { value: 'AGE', label: 'Age', description: 'Horse age in years', icon: CalendarDays },
  { value: 'GENDER', label: 'Gender', description: 'Eligible horse gender', icon: Users },
  { value: 'WEIGHT', label: 'Weight', description: 'Horse weight in kg', icon: Scale }
];

export const CONDITION_OPERATORS_BY_TYPE = {
  AGE: ['BETWEEN', 'EQ', 'GTE', 'LTE'],
  GENDER: ['EQ'],
  WEIGHT: ['BETWEEN', 'GTE', 'LTE']
};

export const FIELD_CLASS =
  'min-h-11 w-full rounded-lg border border-brown-700/15 bg-white px-3.5 py-2.5 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/60 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15 disabled:cursor-not-allowed disabled:bg-cream-200/70 disabled:text-slate-500';

export const DEFAULT_CONDITION = {
  type: 'AGE',
  operator: 'BETWEEN',
  minValue: '',
  maxValue: '',
  value: ''
};

export const DEFAULT_RACE_DISTANCE = 1600;
export const DEFAULT_RACE_MAX_RUNNERS = 12;
export const DEFAULT_RACE_PRIZES = [
  { amount: 50000, ownerPercent: 80, jockeyPercent: 20 },
  { amount: 25000, ownerPercent: 80, jockeyPercent: 20 },
  { amount: 10000, ownerPercent: 80, jockeyPercent: 20 }
];
export const DEFAULT_ADDITIONAL_PRIZE = {
  amount: 10000,
  ownerPercent: 80,
  jockeyPercent: 20
};
