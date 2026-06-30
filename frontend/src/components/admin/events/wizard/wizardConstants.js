import { CalendarDays, ClipboardCheck, Flag, Medal, Scale, Trophy, Users } from 'lucide-react';

export const WIZARD_STEPS = [
  { id: 1, label: 'Tournament', shortLabel: 'Thông tin', icon: Trophy },
  { id: 2, label: 'Race', shortLabel: 'Cấu hình', icon: Flag },
  { id: 3, label: 'Giải thưởng', shortLabel: 'Theo hạng Race', icon: Medal },
  { id: 4, label: 'Xem lại', shortLabel: 'Xác nhận', icon: ClipboardCheck }
];

export const CONDITION_TYPES = [
  { value: 'AGE', label: 'Tuổi', description: 'Tuổi ngựa theo năm', icon: CalendarDays },
  { value: 'GENDER', label: 'Giới tính', description: 'Giới tính ngựa hợp lệ', icon: Users },
  { value: 'WEIGHT', label: 'Cân nặng', description: 'Cân nặng ngựa theo kg', icon: Scale }
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
export const DEFAULT_RACE_MAX_RUNNERS = 6;
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
