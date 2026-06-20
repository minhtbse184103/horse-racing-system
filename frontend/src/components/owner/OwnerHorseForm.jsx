import { useMemo } from 'react';

const MAX_TOTAL_IMAGES = 10;

function countAllImages(values) {
  return (
    (values.horsePassportImages?.length || 0) +
    (values.horseCertificateImages?.length || 0) +
    (values.horseImages?.length || 0)
  );
}

function getImageLabel(type) {
  if (type === 'horsePassportImages') return 'Horse Passport';
  if (type === 'horseCertificateImages') return 'Health Certificate';
  return 'Horse Image';
}

function getImageHelpText(type) {
  if (type === 'horsePassportImages') return 'Upload the horse passport document. Supported: PDF, JPG, PNG. Required.';
  if (type === 'horseCertificateImages') return 'Upload the horse health certificate. Supported: PDF, JPG, PNG. Required.';
  return 'Upload a clear image of the horse. Supported: JPG, PNG. Required.';
}

function getFileAccept(type) {
  if (type === 'horseImages') return 'image/jpeg,image/png,.jpg,.jpeg,.png';
  return 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png';
}

function isPreviewableImage(image) {
  const source = image?.dataUrl || image?.url || '';
  return String(image?.type || '').startsWith('image/') || String(source).startsWith('data:image/');
}

function ImageUploadGroup({ type, values, errors, isSaving, onFilesChange, onRemoveImage }) {
  const images = values[type] || [];
  const totalImages = countAllImages(values);
  const remaining = Math.max(0, MAX_TOTAL_IMAGES - totalImages);

  return (
    <div className={errors[type] ? 'horse-upload-group has-error' : 'horse-upload-group'}>
      <div className="horse-upload-header">
        <div>
          <label className="field-label" htmlFor={type}>
            {getImageLabel(type)} <span className="required">*</span>
          </label>
          <p>{getImageHelpText(type)}</p>
          <small>Tong so file con co the import: {remaining}</small>
        </div>

        <label className="outline-button compact-button cursor-pointer">
          Import Image
          <input
            id={type}
            className="sr-only"
            type="file"
            accept={getFileAccept(type)}
            multiple
            onChange={(event) => onFilesChange(type, event)}
            disabled={isSaving || remaining <= 0}
          />
        </label>
      </div>

      {errors[type] && <p className="field-error">{errors[type]}</p>}

      {images.length > 0 ? (
        <div className="horse-upload-preview-grid">
          {images.map((image, index) => (
            <article className="horse-upload-preview-card" key={`${type}-${image.name}-${index}`}>
              {isPreviewableImage(image) ? (
                <img src={image.dataUrl || image.url} alt={`${getImageLabel(type)} ${index + 1}`} />
              ) : (
                <div className="horse-upload-empty">PDF</div>
              )}
              <div>
                <strong>{image.name || `${getImageLabel(type)} ${index + 1}`}</strong>
                <button
                  className="danger-action"
                  type="button"
                  onClick={() => onRemoveImage(type, index)}
                  disabled={isSaving}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="horse-upload-empty">Chua import file.</div>
      )}
    </div>
  );
}

export default function OwnerHorseForm({
  formValues,
  errors,
  submitError,
  editingHorse,
  isSaving,
  onChange,
  onSubmit,
  onCancelEdit,
  onFilesChange,
  onRemoveImage
}) {
  const totalImages = useMemo(() => countAllImages(formValues), [formValues]);

  return (
    <div className="horse-form-overlay" role="presentation" onClick={onCancelEdit}>
      <section className="horse-form-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="owner-panel-header horse-modal-header">
          <div>
            <p className="eyebrow">Register New Horse</p>
            <h2>{editingHorse ? 'Cap nhat ho so ngua' : 'Them ngua moi'}</h2>
            <p>
              Nhap Passport Number o dau form. Khi submit, he thong se kiem tra Passport Number co bi trung khong va bao loi ngay trong window nay.
            </p>
          </div>

          <button className="outline-button compact-button" type="button" onClick={onCancelEdit} disabled={isSaving}>
            Dong
          </button>
        </div>

        <form className="owner-form horse-registration-form" onSubmit={onSubmit} noValidate>
          {submitError && (
            <div className="admin-alert error modal-alert" role="alert">
              {submitError}
            </div>
          )}

          <label className="field-label" htmlFor="horsePassportNumber">
            Passport Number <span className="required">*</span>
          </label>
          <input
            className={errors.passportNumber ? 'input has-error' : 'input'}
            id="horsePassportNumber"
            name="passportNumber"
            type="text"
            placeholder="Vi du: VN-HORSE-0001"
            value={formValues.passportNumber || ''}
            onChange={onChange}
            disabled={isSaving}
            autoFocus={!editingHorse}
          />
          {errors.passportNumber && <p className="field-error">{errors.passportNumber}</p>}

          <label className="field-label" htmlFor="horseName">
            Horse Name <span className="required">*</span>
          </label>
          <input
            className={errors.horseName ? 'input has-error' : 'input'}
            id="horseName"
            name="horseName"
            type="text"
            placeholder="Vi du: Thunder Bolt"
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
                placeholder="Brown, black, white..."
                value={formValues.color}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.color && <p className="field-error">{errors.color}</p>}
            </div>
          </div>

          <div className="owner-form-row">
            <div>
              <label className="field-label" htmlFor="horseGender">
                Gender <span className="required">*</span>
              </label>
              <select
                className={errors.gender ? 'input has-error' : 'input'}
                id="horseGender"
                name="gender"
                value={formValues.gender}
                onChange={onChange}
                disabled={isSaving}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {errors.gender && <p className="field-error">{errors.gender}</p>}
            </div>

            <div>
              <label className="field-label" htmlFor="horseBirthDate">
                Date of Birth <span className="required">*</span>
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
          </div>

          <div className="owner-form-row">
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

            <div>
              <label className="field-label" htmlFor="healthCertificateExpiryDate">
                Health Certificate Expiry Date <span className="required">*</span>
              </label>
              <input
                className={errors.healthCertificateExpiryDate ? 'input has-error' : 'input'}
                id="healthCertificateExpiryDate"
                name="healthCertificateExpiryDate"
                type="date"
                value={formValues.healthCertificateExpiryDate || ''}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.healthCertificateExpiryDate && <p className="field-error">{errors.healthCertificateExpiryDate}</p>}
            </div>
          </div>

          <div className="horse-upload-summary">
            Da import {totalImages}/{MAX_TOTAL_IMAGES} file. Tong so file cua Horse Passport, Health Certificate va Horse Image khong duoc vuot qua {MAX_TOTAL_IMAGES}.
          </div>

          <ImageUploadGroup
            type="horsePassportImages"
            values={formValues}
            errors={errors}
            isSaving={isSaving}
            onFilesChange={onFilesChange}
            onRemoveImage={onRemoveImage}
          />

          <ImageUploadGroup
            type="horseCertificateImages"
            values={formValues}
            errors={errors}
            isSaving={isSaving}
            onFilesChange={onFilesChange}
            onRemoveImage={onRemoveImage}
          />

          <ImageUploadGroup
            type="horseImages"
            values={formValues}
            errors={errors}
            isSaving={isSaving}
            onFilesChange={onFilesChange}
            onRemoveImage={onRemoveImage}
          />

          {errors.totalImages && <p className="field-error">{errors.totalImages}</p>}

          <div className="admin-form-actions sticky-modal-actions">
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Dang gui...' : editingHorse ? 'Cap nhat ho so' : 'Submit Horse'}
            </button>

            <button className="outline-button" type="button" onClick={onCancelEdit} disabled={isSaving}>
              {editingHorse ? 'Huy chinh sua' : 'Cancel'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
