function isPreviewableImage(image) {
  const source = image?.dataUrl || image?.url || '';
  return String(image?.type || '').startsWith('image/') || String(source).startsWith('data:image/');
}

function HealthCertificateUpload({ values, errors, isSaving, onFilesChange, onRemoveImage }) {
  const images = values.horseCertificateImages || [];

  return (
    <div className={errors.horseCertificateImages ? 'horse-upload-group has-error' : 'horse-upload-group'}>
      <div className="horse-upload-header">
        <div>
          <label className="field-label" htmlFor="horseCertificateImages">
            Health Certificate <span className="required">*</span>
          </label>
          <p>Upload one file only. Accepted formats: PDF, JPG, JPEG, PNG.</p>
        </div>

        <label className="outline-button compact-button cursor-pointer">
          Import Image
          <input
            id="horseCertificateImages"
            className="sr-only"
            type="file"
            accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
            onChange={(event) => onFilesChange('horseCertificateImages', event)}
            disabled={isSaving}
          />
        </label>
      </div>

      {errors.horseCertificateImages && <p className="field-error">{errors.horseCertificateImages}</p>}

      {images.length > 0 ? (
        <div className="horse-upload-preview-grid">
          {images.map((image, index) => (
            <article className="horse-upload-preview-card" key={`health-certificate-${image.name}-${index}`}>
              {isPreviewableImage(image) ? (
                <img src={image.dataUrl || image.url} alt={`Health Certificate ${index + 1}`} />
              ) : (
                <div className="horse-upload-empty">PDF</div>
              )}
              <div>
                <strong>{image.name || `Health Certificate ${index + 1}`}</strong>
                <button
                  className="danger-action"
                  type="button"
                  onClick={() => onRemoveImage('horseCertificateImages', index)}
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
  return (
    <div className="horse-form-overlay" role="presentation" onClick={onCancelEdit}>
      <section className="horse-form-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="owner-panel-header horse-modal-header">
          <div>
            <p className="eyebrow">Register New Horse</p>
            <h2>{editingHorse ? 'Cap nhat ho so ngua' : 'Them ngua moi'}</h2>
            <p>Owner enters horse information manually. Admin verifies it using the official horse profile URL.</p>
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
            autoFocus={!editingHorse}
          />
          {errors.horseName && <p className="field-error">{errors.horseName}</p>}

          <div className="owner-form-row">
            <div>
              <label className="field-label" htmlFor="horseAge">
                Age <span className="required">*</span>
              </label>
              <input
                className={errors.age ? 'input has-error' : 'input'}
                id="horseAge"
                name="age"
                type="number"
                min="1"
                step="1"
                value={formValues.age}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.age && <p className="field-error">{errors.age}</p>}
            </div>

            <div>
              <label className="field-label" htmlFor="horseWeight">
                Weight (kg) <span className="required">*</span>
              </label>
              <input
                className={errors.weight ? 'input has-error' : 'input'}
                id="horseWeight"
                name="weight"
                type="number"
                min="1"
                step="0.1"
                value={formValues.weight}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.weight && <p className="field-error">{errors.weight}</p>}
            </div>
          </div>

          <div className="owner-form-row">
            <div>
              <label className="field-label" htmlFor="horseColour">
                Colour <span className="required">*</span>
              </label>
              <input
                className={errors.colour ? 'input has-error' : 'input'}
                id="horseColour"
                name="colour"
                type="text"
                placeholder="Bay, chestnut, grey..."
                value={formValues.colour}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.colour && <p className="field-error">{errors.colour}</p>}
            </div>
          </div>

          <div className="owner-form-row">
            <div>
              <label className="field-label" htmlFor="horseSex">
                Sex <span className="required">*</span>
              </label>
              <select
                className={errors.sex ? 'input has-error' : 'input'}
                id="horseSex"
                name="sex"
                value={formValues.sex}
                onChange={onChange}
                disabled={isSaving}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {errors.sex && <p className="field-error">{errors.sex}</p>}
            </div>

            <div>
              <label className="field-label" htmlFor="horseBreeding">
                Breeding <span className="required">*</span>
              </label>
              <input
                className={errors.breeding ? 'input has-error' : 'input'}
                id="horseBreeding"
                name="breeding"
                type="text"
                placeholder="Thoroughbred..."
                value={formValues.breeding}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.breeding && <p className="field-error">{errors.breeding}</p>}
            </div>
          </div>

          <label className="field-label" htmlFor="horseTrainer">
            Trainer <span className="required">*</span>
          </label>
          <input
            className={errors.trainer ? 'input has-error' : 'input'}
            id="horseTrainer"
            name="trainer"
            type="text"
            value={formValues.trainer}
            onChange={onChange}
            disabled={isSaving}
          />
          {errors.trainer && <p className="field-error">{errors.trainer}</p>}

          <div className="owner-form-row">
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

            <div>
              <label className="field-label" htmlFor="officialHorseProfileUrl">
                Official Horse Profile URL <span className="required">*</span>
              </label>
              <input
                className={errors.officialHorseProfileUrl ? 'input has-error' : 'input'}
                id="officialHorseProfileUrl"
                name="officialHorseProfileUrl"
                type="url"
                placeholder="https://www.racingandsports.com.au/thoroughbred/horse/..."
                value={formValues.officialHorseProfileUrl || ''}
                onChange={onChange}
                disabled={isSaving}
              />
              <p className="field-help">
                Paste the official horse profile URL from Racing & Sports, Racing Post, Equibase, HKJC, or another trusted racing website.
              </p>
              {errors.officialHorseProfileUrl && <p className="field-error">{errors.officialHorseProfileUrl}</p>}
            </div>
          </div>

          <HealthCertificateUpload
            values={formValues}
            errors={errors}
            isSaving={isSaving}
            onFilesChange={onFilesChange}
            onRemoveImage={onRemoveImage}
          />

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
