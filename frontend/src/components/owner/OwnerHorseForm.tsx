export default function OwnerHorseForm({
  formValues,
  errors,
  editingHorse,
  isSaving,
  onChange,
  onSubmit,
  onCancelEdit
}) {
  return (
    <form className="owner-panel owner-form" onSubmit={onSubmit}>
      <div className="owner-panel-header">
        <div>
          <h2>{editingHorse ? 'Cập nhật hồ sơ ngựa' : 'Thêm hồ sơ ngựa'}</h2>
          <p>Hồ sơ ngựa gồm tên ngựa, giống, giới tính, màu sắc, ngày sinh, cân nặng, hạn giấy sức khỏe và trạng thái.</p>
        </div>
      </div>

      <label className="field-label" htmlFor="horseName">
        Tên ngựa <span className="required">*</span>
      </label>
      <input
        className={errors.horseName ? 'input has-error' : 'input'}
        id="horseName"
        name="horseName"
        type="text"
        placeholder="Thunder Bolt"
        value={formValues.horseName}
        onChange={onChange}
        disabled={isSaving}
      />
      {errors.horseName && <p className="field-error">{errors.horseName}</p>}

      <div className="owner-form-row">
        <div>
          <label className="field-label" htmlFor="horseBreed">Giống ngựa</label>
          <input
            className="input"
            id="horseBreed"
            name="breed"
            type="text"
            placeholder="Arabian, Thoroughbred..."
            value={formValues.breed}
            onChange={onChange}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="horseColor">Màu sắc</label>
          <input
            className="input"
            id="horseColor"
            name="color"
            type="text"
            placeholder="Brown, Black, White..."
            value={formValues.color}
            onChange={onChange}
            disabled={isSaving}
          />
        </div>
      </div>

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
          <label className="field-label" htmlFor="horseDayOfBirth">Ngày sinh</label>
          <input
            className="input"
            id="horseDayOfBirth"
            name="dayOfBirth"
            type="date"
            value={formValues.dayOfBirth}
            onChange={onChange}
            disabled={isSaving}
          />
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
          <label className="field-label" htmlFor="horseHealthDate">Hết hạn giấy sức khỏe</label>
          <input
            className="input"
            id="horseHealthDate"
            name="healthCertExpiry"
            type="date"
            value={formValues.healthCertExpiry}
            onChange={onChange}
            disabled={isSaving}
          />
        </div>
      </div>

      <label className="field-label" htmlFor="horseStatus">Trạng thái</label>
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
