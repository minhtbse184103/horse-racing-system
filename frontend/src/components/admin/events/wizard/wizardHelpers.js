import { emptyTournamentForm } from '../../../../data/tournamentPrototype';
import {
  DEFAULT_CONDITION,
  DEFAULT_RACE_DISTANCE,
  DEFAULT_RACE_MAX_RUNNERS,
  DEFAULT_RACE_PRIZES
} from './wizardConstants';

export function createTemporaryId() {
  return Math.random().toString(36).slice(2, 9);
}

export function createInitialTournamentDraft(initialTournament) {
  return {
    ...emptyTournamentForm,
    ...initialTournament,
    conditions: [...(initialTournament?.conditions || [])],
    races: (initialTournament?.races || []).map(({ date, ...race }) => ({
      ...race,
      raceStartTime: race.raceStartTime || (date ? `${date}T09:00` : ''),
      raceEndTime: race.raceEndTime || (date ? `${date}T10:00` : ''),
      status: race.status || 'OPEN_FOR_REGISTRATION',
      prizes: (race.prizes || []).map((prize) => ({ ...prize }))
    }))
  };
}

export function createConditionDraft(type) {
  return {
    type,
    operator: type === 'GENDER' ? 'EQ' : 'BETWEEN',
    minValue: '',
    maxValue: '',
    value: type === 'GENDER' ? 'ANY' : ''
  };
}

export function resetConditionDraft() {
  return { ...DEFAULT_CONDITION };
}

export function validateConditionDraft(conditionDraft) {
  const usesRange = conditionDraft.operator === 'BETWEEN';

  if (usesRange) {
    const min = Number(conditionDraft.minValue);
    const max = Number(conditionDraft.maxValue);
    if (conditionDraft.minValue === '' || conditionDraft.maxValue === '') {
      return 'Nhập đầy đủ giá trị tối thiểu và tối đa.';
    }
    if (min < 0 || max < 0 || min > max) {
      return 'Giá trị tối thiểu phải từ 0 trở lên và không được vượt quá giá trị tối đa.';
    }
  } else if (conditionDraft.value === '') {
    return 'Nhập giá trị cho điều kiện này.';
  }

  return '';
}

export function createCondition(conditionDraft) {
  const usesRange = conditionDraft.operator === 'BETWEEN';

  return {
    id: `condition-${createTemporaryId()}`,
    type: conditionDraft.type,
    operator: conditionDraft.operator,
    ...(usesRange
      ? {
          minValue: Number(conditionDraft.minValue),
          maxValue: Number(conditionDraft.maxValue)
        }
      : {
          value:
            conditionDraft.type === 'GENDER'
              ? conditionDraft.value
              : Number(conditionDraft.value)
        })
  };
}

export function createRace(draft) {
  const initialScheduleDate = draft.start || '';

  return {
    id: `race-${createTemporaryId()}`,
    name: `Race ${draft.races.length + 1}`,
    track: draft.venue || '',
    raceStartTime: initialScheduleDate ? `${initialScheduleDate}T09:00` : '',
    raceEndTime: initialScheduleDate ? `${initialScheduleDate}T10:00` : '',
    distance: DEFAULT_RACE_DISTANCE,
    maxRunners: DEFAULT_RACE_MAX_RUNNERS,
    entries: 0,
    status: 'OPEN_FOR_REGISTRATION',
    prizes: DEFAULT_RACE_PRIZES.map((prize) => ({ ...prize }))
  };
}

export function getPrizeTotal(races) {
  return races.reduce(
    (total, race) => total + race.prizes.reduce((sum, prize) => sum + Number(prize.amount || 0), 0),
    0
  );
}

export function getTotalRunnerCapacity(races) {
  return races.reduce((total, race) => total + Number(race.maxRunners || 0), 0);
}
