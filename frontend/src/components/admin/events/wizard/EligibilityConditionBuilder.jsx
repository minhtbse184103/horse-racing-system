import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
  conditionOperatorLabels,
  conditionTypeLabels,
  formatTournamentCondition
} from '../../../../lib/eventFormatters';
import {
  CONDITION_OPERATORS_BY_TYPE,
  CONDITION_TYPES,
  FIELD_CLASS
} from './wizardConstants';
import {
  createCondition,
  createConditionDraft,
  resetConditionDraft,
  validateConditionDraft
} from './wizardHelpers';
import { WizardField, WizardValidationBanner } from './WizardPrimitives';

export default function EligibilityConditionBuilder({
  draft,
  setDraft,
  conditionDraft,
  setConditionDraft,
  error,
  setError
}) {
  const selectedType = CONDITION_TYPES.find((item) => item.value === conditionDraft.type);
  const availableOperators = CONDITION_OPERATORS_BY_TYPE[conditionDraft.type];
  const usesRange = conditionDraft.operator === 'BETWEEN';

  function chooseType(type) {
    setConditionDraft(createConditionDraft(type));
    setError('');
  }

  function addCondition() {
    const validationError = validateConditionDraft(conditionDraft);
    if (validationError) {
      setError(validationError);
      return;
    }

    const condition = createCondition(conditionDraft);
    setDraft((current) => ({ ...current, conditions: [...current.conditions, condition] }));
    setConditionDraft(resetConditionDraft());
    setError('');
  }

  return (
    <section className="rounded-lg border border-brown-700/10 bg-cream-200/45 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brown-700 text-white">
          <ShieldCheck size={19} />
        </span>
        <div>
          <h4 className="text-lg font-black text-brown-900">Điều kiện tham gia</h4>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Thêm điều kiện về tuổi, giới tính và cân nặng. Nhiều điều kiện sẽ được kết hợp để xác định khả năng tham gia Tournament.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {CONDITION_TYPES.map((item) => {
          const Icon = item.icon;
          const active = conditionDraft.type === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => chooseType(item.value)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                active
                  ? 'border-brown-700 bg-brown-700 text-white shadow-md'
                  : 'border-brown-700/10 bg-white text-brown-900 hover:border-brown-500/40 hover:bg-cream-100'
              }`}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${active ? 'bg-white/15' : 'bg-cream-200 text-brown-700'}`}>
                <Icon size={16} />
              </span>
              <span>
                <strong className="block text-sm font-black">{item.label}</strong>
                <small className={`block text-[11px] font-semibold ${active ? 'text-white/65' : 'text-slate-500'}`}>
                  {item.description}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-brown-700/10 bg-white/75 p-3.5">
        <div className="grid gap-3 md:grid-cols-[minmax(10rem,.7fr)_minmax(0,1.3fr)_auto] md:items-end">
          <WizardField label="Toán tử">
            <select
              className={FIELD_CLASS}
              value={conditionDraft.operator}
              onChange={(event) =>
                setConditionDraft((current) => ({
                  ...current,
                  operator: event.target.value,
                  minValue: '',
                  maxValue: '',
                  value: current.type === 'GENDER' ? 'ANY' : ''
                }))
              }
            >
              {availableOperators.map((operator) => (
                <option key={operator} value={operator}>{conditionOperatorLabels[operator]}</option>
              ))}
            </select>
          </WizardField>

          {conditionDraft.type === 'GENDER' ? (
            <WizardField label="Giới tính hợp lệ">
              <select
                className={FIELD_CLASS}
                value={conditionDraft.value}
                onChange={(event) => setConditionDraft((current) => ({ ...current, value: event.target.value }))}
              >
                <option value="ANY">Mọi giới tính</option>
                <option value="MALE">Đực</option>
                <option value="FEMALE">Cái</option>
              </select>
            </WizardField>
          ) : usesRange ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <WizardField label={`${selectedType?.label} tối thiểu`}>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className={`${FIELD_CLASS} pr-14`}
                    value={conditionDraft.minValue}
                    onChange={(event) => setConditionDraft((current) => ({ ...current, minValue: event.target.value }))}
                    placeholder="Tối thiểu"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">
                    {conditionDraft.type === 'AGE' ? 'tuổi' : 'kg'}
                  </span>
                </div>
              </WizardField>
              <WizardField label={`${selectedType?.label} tối đa`}>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className={`${FIELD_CLASS} pr-14`}
                    value={conditionDraft.maxValue}
                    onChange={(event) => setConditionDraft((current) => ({ ...current, maxValue: event.target.value }))}
                    placeholder="Tối đa"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">
                    {conditionDraft.type === 'AGE' ? 'tuổi' : 'kg'}
                  </span>
                </div>
              </WizardField>
            </div>
          ) : (
            <WizardField label={`Giá trị ${selectedType?.label}`}>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  className={`${FIELD_CLASS} pr-14`}
                  value={conditionDraft.value}
                  onChange={(event) => setConditionDraft((current) => ({ ...current, value: event.target.value }))}
                  placeholder="Giá trị"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">
                  {conditionDraft.type === 'AGE' ? 'tuổi' : 'kg'}
                </span>
              </div>
            </WizardField>
          )}

          <button
            type="button"
            onClick={addCondition}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-extrabold text-white shadow-md transition hover:bg-brown-900"
          >
            <Plus size={16} /> Thêm điều kiện
          </button>
        </div>
        {error && <WizardValidationBanner message={error} />}
      </div>

      <div className="mt-3 grid gap-2">
        {draft.conditions.map((condition, index) => (
          <div
            key={condition.id || `${condition.type}-${index}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-brown-700/10 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cream-200 text-xs font-black text-brown-700">
                {conditionTypeLabels[condition.type]?.slice(0, 1) || 'R'}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-brown-500">{conditionTypeLabels[condition.type] || 'Điều kiện'}</p>
                <p className="truncate text-sm font-black text-brown-900">{formatTournamentCondition(condition)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDraft((current) => ({
                ...current,
                conditions: current.conditions.filter((_, itemIndex) => itemIndex !== index)
              }))}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-danger"
              aria-label="Xóa điều kiện tham gia"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {draft.conditions.length === 0 && (
          <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-brown-700/20 bg-white/40 p-6 text-center">
            <div>
              <ShieldCheck className="mx-auto text-brown-500" size={22} />
              <p className="mt-3 text-sm font-black text-brown-900">Chưa cấu hình điều kiện tham gia</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Tournament sẽ không giới hạn tuổi, giới tính hoặc cân nặng.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
