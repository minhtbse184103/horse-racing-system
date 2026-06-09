import type { ChangeEvent, FormEvent } from 'react';
import type { FormErrors, Horse, HorseFormValues } from '../../types';

interface OwnerHorseFormProps {
  formValues: HorseFormValues;
  errors: FormErrors<HorseFormValues>;
  editingHorse: Horse | null;
  isSaving: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
}

export default function OwnerHorseForm({
  formValues,
  errors,
  editingHorse,
  isSaving,
  onChange,
  onSubmit,
  onCancelEdit
}: OwnerHorseFormProps) {
  return (
    <form className="owner-panel owner-form" onSubmit={onSubmit}>
      <div className="owner-panel-header">
        <div>
          <h2>{editingHorse ? 'Cập nhật hồ sơ ngựa' : 'Thêm hồ sơ ngựa'}</h2>
          <p>Hồ sơ ngựa cần đầy đủ tên, giống, tuổi, cân nặng, hạn giấy sức khỏe và trạng thái.</p>
        </div>
      </div>

      <label className="field-label" htmlFor="horseName">
        Tên ngựa <span className="required">*</span>
      </label>
      <input
        className={errors.name ? 'input has-error' : 'input'}
        id="horseName"
        name="name"
        type="text"
        placeholder="Thunder Bolt"
        value={formValues.name}
        onChange={onChange}
        disabled={isSaving}
      />
      {errors.name && <p className="field-error">{errors.name}</p>}

      <label className="field-label" htmlFor="horseBreed">Giống ngựa <span className="required">*</span></label>
      <input
        className={errors.breed ? 'input has-error' : 'input'}
        id="horseBreed"
        name="breed"
        type="text"
        placeholder="Arabian, Thoroughbred..."
        value={formValues.breed}
        onChange={onChange}
        disabled={isSaving}
      />
      {errors.breed && <p className="field-error">{errors.breed}</p>}

      <div className="owner-form-row">
        <div>
          <label className="field-label" htmlFor="horseGender">Giới tính</label>
          <select
            className="input"
            id="horseGender"
            name="gender"
            value={formValues.gender}
            onChange={onChange}
            disabled={isSaving}
          >
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="horseAge">Tuổi <span className="required">*</span></label>
          <input
            className={errors.age ? 'input has-error' : 'input'}
            id="horseAge"
            name="age"
            type="number"
            min="0"
            placeholder="3"
            value={formValues.age}
            onChange={onChange}
            disabled={isSaving}
          />
          {errors.age && <p className="field-error">{errors.age}</p>}
        </div>
      </div>

      <div className="owner-form-row">
        <div>
          <label className="field-label" htmlFor="horseWeight">Cân nặng <span className="required">*</span></label>
          <input
            className={errors.weight ? 'input has-error' : 'input'}
            id="horseWeight"
            name="weight"
            type="number"
            min="0"
            step="0.1"
            placeholder="450"
            value={formValues.weight}
            onChange={onChange}
            disabled={isSaving}
          />
          {errors.weight && <p className="field-error">{errors.weight}</p>}
        </div>

        <div>
          <label className="field-label" htmlFor="horseHealthDate">Hết hạn giấy sức khỏe <span className="required">*</span></label>
          <input
            className={errors.healthCertExpiry ? 'input has-error' : 'input'}
            id="horseHealthDate"
            name="healthCertExpiry"
            type="date"
            value={formValues.healthCertExpiry}
            onChange={onChange}
            disabled={isSaving}
          />
          {errors.healthCertExpiry && <p className="field-error">{errors.healthCertExpiry}</p>}
        </div>
      </div>

      <label className="field-label" htmlFor="horseStatus">Trạng thái <span className="required">*</span></label>
      <select
        className="input"
        id="horseStatus"
        name="status"
        value={formValues.status}
        onChange={onChange}
        disabled={isSaving}
      >
        <option value="ACTIVE">ACTIVE</option>
        <option value="INJURED">INJURED</option>
        <option value="RETIRED">RETIRED</option>
        <option value="SUSPENDED">SUSPENDED</option>
        <option value="INACTIVE">INACTIVE</option>
      </select>

      <div className="admin-form-actions">
        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : editingHorse ? 'Cập nhật hồ sơ' : 'Thêm hồ sơ'}
        </button>

        {editingHorse && (
          <button className="outline-button" type="button" onClick={onCancelEdit} disabled={isSaving}>
            Hủy sửa
          </button>
        )}
      </div>
    </form>
  );
}
