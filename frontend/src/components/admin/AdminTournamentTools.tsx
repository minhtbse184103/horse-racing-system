import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from 'react';
import {
  createTournament,
  getTournamentConditions,
  getTournaments,
  openTournamentRegistration,
  Tournament,
  TournamentCondition
} from '../../services/adminTournamentService';

interface TournamentFormValues {
  tournamentName: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  minParticipants: string;
  maxParticipants: string;
  conditionId: string;
}

type TournamentFormErrors = Partial<Record<keyof TournamentFormValues, string>>;

function emptyTournamentForm(): TournamentFormValues {
  return {
    tournamentName: '',
    location: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    minParticipants: '2',
    maxParticipants: '8',
    conditionId: ''
  };
}

function getConditionId(condition: TournamentCondition) {
  return condition.conditionId ?? condition.conditionID ?? condition.id ?? '';
}

function getConditionLabel(condition: TournamentCondition) {
  return condition.conditionName || condition.name || `Condition ${getConditionId(condition)}`;
}

function getTournamentId(tournament: Tournament) {
  return tournament.tournamentId ?? tournament.tournamentID ?? tournament.id ?? '';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeStatus(status?: string) {
  return String(status || '').toUpperCase();
}

function canOpenRegistration(tournament: Tournament) {
  return normalizeStatus(tournament.status) === 'DRAFT';
}

function getOpenRegistrationButtonLabel(tournament: Tournament, openingTournamentId: number | string | null) {
  const tournamentId = getTournamentId(tournament);
  const status = normalizeStatus(tournament.status);

  if (openingTournamentId === tournamentId) return 'Đang mở...';
  if (status === 'OPEN_FOR_REGISTRATION' || status === 'OPENFORREGISTRATION') return 'Đã mở đăng ký';
  if (status === 'CANCELLED') return 'Đã hủy';
  if (status && status !== 'DRAFT') return 'Không khả dụng';
  return 'Mở đăng ký';
}

function toDateOnly(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateTournamentForm(values: TournamentFormValues): TournamentFormErrors {
  const errors: TournamentFormErrors = {};
  const startDate = toDateOnly(values.startDate);
  const endDate = toDateOnly(values.endDate);
  const registrationDeadline = toDateOnly(values.registrationDeadline);
  const minParticipants = Number(values.minParticipants);
  const maxParticipants = Number(values.maxParticipants);

  if (!values.tournamentName.trim()) {
    errors.tournamentName = 'Tên giải đấu không được để trống.';
  }

  if (!values.location.trim()) {
    errors.location = 'Địa điểm không được để trống.';
  }

  if (!values.startDate) {
    errors.startDate = 'Ngày bắt đầu không được để trống.';
  } else if (!startDate) {
    errors.startDate = 'Ngày bắt đầu không hợp lệ.';
  }

  if (!values.endDate) {
    errors.endDate = 'Ngày kết thúc không được để trống.';
  } else if (!endDate) {
    errors.endDate = 'Ngày kết thúc không hợp lệ.';
  }

  if (!values.registrationDeadline) {
    errors.registrationDeadline = 'Hạn đăng ký không được để trống.';
  } else if (!registrationDeadline) {
    errors.registrationDeadline = 'Hạn đăng ký không hợp lệ.';
  }

  if (startDate && endDate && startDate > endDate) {
    errors.startDate = 'Ngày bắt đầu không được sau ngày kết thúc.';
    errors.endDate = 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
  }

  if (startDate && registrationDeadline && registrationDeadline > startDate) {
    errors.registrationDeadline = 'Hạn đăng ký không được sau ngày bắt đầu.';
  }

  if (values.minParticipants === '') {
    errors.minParticipants = 'Số người tối thiểu không được để trống.';
  } else if (!Number.isInteger(minParticipants) || minParticipants <= 0) {
    errors.minParticipants = 'Số người tối thiểu phải là số nguyên lớn hơn 0.';
  }

  if (values.maxParticipants === '') {
    errors.maxParticipants = 'Số người tối đa không được để trống.';
  } else if (!Number.isInteger(maxParticipants) || maxParticipants <= 0) {
    errors.maxParticipants = 'Số người tối đa phải là số nguyên lớn hơn 0.';
  }

  if (
    !errors.minParticipants &&
    !errors.maxParticipants &&
    Number.isFinite(minParticipants) &&
    Number.isFinite(maxParticipants) &&
    minParticipants > maxParticipants
  ) {
    errors.minParticipants = 'Số người tối thiểu không được lớn hơn số người tối đa.';
    errors.maxParticipants = 'Số người tối đa phải lớn hơn hoặc bằng số người tối thiểu.';
  }

  if (!values.conditionId) {
    errors.conditionId = 'Bạn phải chọn điều kiện giải đấu.';
  }

  return errors;
}

export default function AdminTournamentTools() {
  const [conditions, setConditions] = useState<TournamentCondition[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [formValues, setFormValues] = useState(emptyTournamentForm());
  const [formErrors, setFormErrors] = useState<TournamentFormErrors>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingConditions, setIsLoadingConditions] = useState(false);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openingTournamentId, setOpeningTournamentId] = useState<number | string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadConditions();
    loadTournaments();
  }, []);

  async function loadConditions() {
    setIsLoadingConditions(true);
    setError('');

    try {
      const data = await getTournamentConditions();
      setConditions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách điều kiện giải đấu.'));
    } finally {
      setIsLoadingConditions(false);
    }
  }

  async function loadTournaments() {
    setIsLoadingTournaments(true);
    setError('');

    try {
      const data = await getTournaments();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách giải đấu.'));
    } finally {
      setIsLoadingTournaments(false);
    }
  }

  function openCreateModal() {
    setIsCreateOpen(true);
    setFormErrors({});
    setModalError('');
    setError('');
    setMessage('');
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
    setModalError('');
    setMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateTournamentForm(formValues);
    setFormErrors(errors);
    setModalError('');
    setMessage('');

    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);

    try {
      await createTournament({
        tournamentName: formValues.tournamentName.trim(),
        location: formValues.location.trim(),
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        registrationDeadline: formValues.registrationDeadline,
        minParticipants: Number(formValues.minParticipants),
        maxParticipants: Number(formValues.maxParticipants),
        conditionId: Number(formValues.conditionId)
      });
      setFormValues(emptyTournamentForm());
      setFormErrors({});
      setModalError('');
      setIsCreateOpen(false);
      setMessage('Tạo giải đấu thành công.');
      await loadTournaments();
    } catch (err) {
      setModalError(getErrorMessage(err, 'Tạo giải đấu thất bại.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenRegistration(tournament: Tournament) {
    const tournamentId = getTournamentId(tournament);
    if (!tournamentId) return;

    setOpeningTournamentId(tournamentId);
    setError('');
    setMessage('');

    try {
      const updatedTournament = await openTournamentRegistration(tournamentId);
      setTournaments((current) =>
        current.map((item) => (getTournamentId(item) === tournamentId ? { ...item, ...updatedTournament } : item))
      );
      setMessage('Đã mở đăng ký giải đấu.');
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể mở đăng ký giải đấu.'));
    } finally {
      setOpeningTournamentId(null);
    }
  }

  function closeModal() {
    if (!isSaving) {
      setIsCreateOpen(false);
      setFormErrors({});
      setModalError('');
    }
  }

  function stopModalClick(event: MouseEvent<HTMLFormElement>) {
    event.stopPropagation();
  }

  return (
    <>
      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <section className="admin-card user-table-card">
        <div className="admin-card-header">
          <div>
            <h2>Giải đấu</h2>
            <p>Những giải đấu hiện đang có trong database.</p>
          </div>
          <div className="tournament-card-actions">
            <button className="outline-button" type="button" onClick={loadTournaments} disabled={isLoadingTournaments}>
              {isLoadingTournaments ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button className="primary-button tournament-create-button" type="button" onClick={openCreateModal}>
              Tạo giải đấu
            </button>
          </div>
        </div>

        {isLoadingTournaments ? (
          <p className="table-empty">Đang tải danh sách giải đấu...</p>
        ) : tournaments.length === 0 ? (
          <p className="table-empty">Chưa có giải đấu nào.</p>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên giải đấu</th>
                  <th>Địa điểm</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => {
                  const tournamentId = getTournamentId(tournament);
                  const isOpening = openingTournamentId === tournamentId;

                  return (
                    <tr key={tournamentId || tournament.tournamentName}>
                      <td>{tournamentId || 'N/A'}</td>
                      <td>{tournament.tournamentName || 'N/A'}</td>
                      <td>{tournament.location || 'N/A'}</td>
                      <td>{tournament.startDate || 'N/A'}</td>
                      <td>{tournament.endDate || 'N/A'}</td>
                      <td><span className={`status-badge ${String(tournament.status || '').toLowerCase()}`}>{tournament.status || 'N/A'}</span></td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => handleOpenRegistration(tournament)}
                            disabled={isOpening || !canOpenRegistration(tournament)}
                          >
                            {getOpenRegistrationButtonLabel(tournament, openingTournamentId)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="admin-modal-overlay" role="presentation" onMouseDown={closeModal}>
          <form className="admin-card admin-form admin-modal" onSubmit={handleSubmit} onMouseDown={stopModalClick} noValidate>
            <div className="admin-card-header">
              <div>
                <h2>Tạo giải đấu</h2>
                <p>Nhập thông tin giải đấu mới và lưu vào database.</p>
              </div>
              <button className="outline-button" type="button" onClick={closeModal} disabled={isSaving}>
                Đóng
              </button>
            </div>

            {modalError && (
              <div className="admin-alert error modal-alert" role="alert">
                {modalError}
              </div>
            )}

            <label className="field-label" htmlFor="tournamentName">Tên giải đấu <span className="required">*</span></label>
            <input
              className={formErrors.tournamentName ? 'input has-error' : 'input'}
              id="tournamentName"
              name="tournamentName"
              type="text"
              value={formValues.tournamentName}
              onChange={handleChange}
              disabled={isSaving}
            />
            {formErrors.tournamentName && <p className="field-error">{formErrors.tournamentName}</p>}

            <label className="field-label" htmlFor="tournamentLocation">Địa điểm <span className="required">*</span></label>
            <input
              className={formErrors.location ? 'input has-error' : 'input'}
              id="tournamentLocation"
              name="location"
              type="text"
              value={formValues.location}
              onChange={handleChange}
              disabled={isSaving}
            />
            {formErrors.location && <p className="field-error">{formErrors.location}</p>}

            <label className="field-label" htmlFor="tournamentStartDate">Ngày bắt đầu <span className="required">*</span></label>
            <input
              className={formErrors.startDate ? 'input has-error' : 'input'}
              id="tournamentStartDate"
              name="startDate"
              type="date"
              value={formValues.startDate}
              onChange={handleChange}
              disabled={isSaving}
            />
            {formErrors.startDate && <p className="field-error">{formErrors.startDate}</p>}

            <label className="field-label" htmlFor="tournamentEndDate">Ngày kết thúc <span className="required">*</span></label>
            <input
              className={formErrors.endDate ? 'input has-error' : 'input'}
              id="tournamentEndDate"
              name="endDate"
              type="date"
              value={formValues.endDate}
              onChange={handleChange}
              disabled={isSaving}
            />
            {formErrors.endDate && <p className="field-error">{formErrors.endDate}</p>}

            <label className="field-label" htmlFor="registrationDeadline">Hạn đăng ký <span className="required">*</span></label>
            <input
              className={formErrors.registrationDeadline ? 'input has-error' : 'input'}
              id="registrationDeadline"
              name="registrationDeadline"
              type="date"
              value={formValues.registrationDeadline}
              onChange={handleChange}
              disabled={isSaving}
            />
            {formErrors.registrationDeadline && <p className="field-error">{formErrors.registrationDeadline}</p>}

            <label className="field-label" htmlFor="minParticipants">Số người tối thiểu <span className="required">*</span></label>
            <input
              className={formErrors.minParticipants ? 'input has-error' : 'input'}
              id="minParticipants"
              min="1"
              name="minParticipants"
              type="number"
              value={formValues.minParticipants}
              onChange={handleChange}
              disabled={isSaving}
            />
            {formErrors.minParticipants && <p className="field-error">{formErrors.minParticipants}</p>}

            <label className="field-label" htmlFor="maxParticipants">Số người tối đa <span className="required">*</span></label>
            <input
              className={formErrors.maxParticipants ? 'input has-error' : 'input'}
              id="maxParticipants"
              min="1"
              name="maxParticipants"
              type="number"
              value={formValues.maxParticipants}
              onChange={handleChange}
              disabled={isSaving}
            />
            {formErrors.maxParticipants && <p className="field-error">{formErrors.maxParticipants}</p>}

            <label className="field-label" htmlFor="conditionId">Điều kiện giải đấu <span className="required">*</span></label>
            <select
              className={formErrors.conditionId ? 'input has-error' : 'input'}
              id="conditionId"
              name="conditionId"
              value={formValues.conditionId}
              onChange={handleChange}
              disabled={isSaving || isLoadingConditions}
            >
              <option value="">{isLoadingConditions ? 'Đang tải điều kiện...' : 'Chọn điều kiện giải đấu'}</option>
              {conditions.map((condition) => {
                const conditionId = getConditionId(condition);
                return <option key={conditionId} value={conditionId}>{getConditionLabel(condition)}</option>;
              })}
            </select>
            {formErrors.conditionId && <p className="field-error">{formErrors.conditionId}</p>}

            <div className="admin-form-actions tournament-modal-actions">
              <button className="outline-button" type="button" onClick={closeModal} disabled={isSaving}>
                Hủy
              </button>
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? 'Đang tạo...' : 'Tạo giải đấu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
