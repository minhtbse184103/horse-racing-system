export default function OwnerHorseForm({
  formValues,
  errors,
  submitError,
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
          <h2>{editingHorse ? 'Cập nhật hồ sơ ngựa' : 'Thêm ngựa mới'}</h2>
          <p>
            New and edited horse profiles are submitted as PENDING for admin approval.
            Owners cannot choose the horse status manually.
          </p>
        </div>
      </div>

      {submitError && (
        <div className="admin-alert error modal-alert" role="alert">
          {submitError}
        </div>
      )}

      <label className="field-label" htmlFor="horseName">
        Horse Name <span className="required">*</span>
      </label>
      <input
        className={errors.horseName ? 'input has-error' : 'input'}
        id="horseName"
        name="horseName"
        type="text"
        placeholder="Ví dụ: Thunder Bolt"
        value={formValues.horseName}
        onChange={onChange}
        disabled={isSaving}
      />
      {errors.horseName && <p className="field-error">{errors.horseName}</p>}

      <div className="owner-form-row">
        <div>
          <label className="field-label" htmlFor="horseBreed">
            Breed <span className="required">*</span>
          </label>
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
        </div>

        <div>
          <label className="field-label" htmlFor="horseColor">
            Coat Color <span className="required">*</span>
          </label>
          <input
            className={errors.color ? 'input has-error' : 'input'}
            id="horseColor"
            name="color"
            type="text"
            placeholder="Nâu, đen, trắng..."
            value={formValues.color}
            onChange={onChange}
            disabled={isSaving}
          />
          {errors.color && <p className="field-error">{errors.color}</p>}
        </div>
      </div>

      <label className="field-label" htmlFor="horseGender">
        Giới tính
      </label>
      <select
        className="input"
        id="horseGender"
        name="gender"
        value={formValues.gender}
        onChange={onChange}
        disabled={isSaving}
      >
        <option value="MALE">Đực</option>
        <option value="FEMALE">Cái</option>
      </select>

      <div className="owner-form-row">
        <div>
          <label className="field-label" htmlFor="horseBirthDate">
            Birth Date <span className="required">*</span>
          </label>
          <input
            className={errors.dayOfBirth ? 'input has-error' : 'input'}
            id="horseBirthDate"
            name="dayOfBirth"
            type="date"
            value={formValues.dayOfBirth}
            onChange={onChange}
            disabled={isSaving}
          />
          {errors.dayOfBirth && <p className="field-error">{errors.dayOfBirth}</p>}
        </div>

        <div>
          <label className="field-label" htmlFor="horseWeight">
            Weight <span className="required">*</span>
          </label>
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
      </div>

      <label className="field-label" htmlFor="horseHealthDate">
        Health Certificate Expiry <span className="required">*</span>
      </label>
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

      <label className="field-label" htmlFor="horseImageUrl">
        Health Certificate URL <span className="required">*</span>
      </label>

      <input
        className={errors.imgUrl ? 'input has-error' : 'input'}
        id="horseImageUrl"
        name="imgUrl"
        type="text"
        placeholder="https://example.com/health-certificate.jpg"
        value={formValues.imgUrl || ''}
        onChange={onChange}
        disabled={isSaving}
      />

      {errors.imgUrl && <p className="field-error">{errors.imgUrl}</p>}

      <div className="admin-form-actions">
        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : editingHorse ? 'Cập nhật hồ sơ' : 'Gửi hồ sơ ngựa'}
        </button>

        <button className="outline-button" type="button" onClick={onCancelEdit} disabled={isSaving}>
          {editingHorse ? 'Hủy chỉnh sửa' : 'Đóng biểu mẫu'}
        </button>
      </div>
    </form>
  );
}
