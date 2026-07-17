import { useLanguage } from '../../context/LanguageContext';

function isPreviewableImage(image) {
  const source = image?.dataUrl || image?.url || '';
  return String(image?.type || '').startsWith('image/') || String(source).startsWith('data:image/');
}

function HealthCertificateUpload({ values, errors, isSaving, onFilesChange, onRemoveImage }) {
  const { t } = useLanguage();
  const images = values.horseCertificateImages || [];

  return (
    <div className={errors.horseCertificateImages ? 'horse-upload-group has-error' : 'horse-upload-group'}>
      <div className="horse-upload-header">
        <div>
          <label className="field-label" htmlFor="horseCertificateImages">
            {t('ownerHorseHealthCertificate')} <span className="required">*</span>
          </label>
          <p>{t('ownerHorseUploadHint')}</p>
        </div>

        <label className="outline-button compact-button cursor-pointer">
          {t('ownerHorseImportImage')}
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
                <img src={image.dataUrl || image.url} alt={`${t('ownerHorseHealthCertificate')} ${index + 1}`} />
              ) : (
                <div className="horse-upload-empty">PDF</div>
              )}
              <div>
                <strong>{image.name || `${t('ownerHorseHealthCertificate')} ${index + 1}`}</strong>
                <button
                  className="danger-action"
                  type="button"
                  onClick={() => onRemoveImage('horseCertificateImages', index)}
                  disabled={isSaving}
                >
                  {t('ownerHorseRemove')}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="horse-upload-empty">{t('ownerHorseNoFile')}</div>
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
  const { t } = useLanguage();

  return (
    <div className="horse-form-overlay" role="presentation" onClick={onCancelEdit}>
      <section className="horse-form-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="owner-panel-header horse-modal-header">
          <div>
            <p className="eyebrow">{t('ownerHorseFormEyebrow')}</p>
            <h2>{editingHorse ? t('ownerHorseFormEditTitle') : t('ownerHorseFormCreateTitle')}</h2>
            <p>{t('ownerHorseFormDesc')}</p>
          </div>

          <button className="outline-button compact-button" type="button" onClick={onCancelEdit} disabled={isSaving}>
            {t('close')}
          </button>
        </div>

        <form className="owner-form horse-registration-form" onSubmit={onSubmit} noValidate>
          {submitError && (
            <div className="admin-alert error modal-alert" role="alert">
              {submitError}
            </div>
          )}

          <label className="field-label" htmlFor="horseName">
            {t('ownerHorseName')} <span className="required">*</span>
          </label>
          <input
            className={errors.horseName ? 'input has-error' : 'input'}
            id="horseName"
            name="horseName"
            type="text"
            placeholder={t('ownerHorseExampleName')}
            value={formValues.horseName}
            onChange={onChange}
            disabled={isSaving}
            autoFocus={!editingHorse}
          />
          {errors.horseName && <p className="field-error">{errors.horseName}</p>}

          <div className="owner-form-row">
            <div>
              <label className="field-label" htmlFor="horseAge">
                {t('ownerHorseDayOfBirth')} <span className="required">*</span>
              </label>
              <input
                className={errors.dayOfBirth ? 'input has-error' : 'input'}
                id="horseAge"
                name="dayOfBirth"
                type="date"
                value={formValues.dayOfBirth || ''}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.dayOfBirth && <p className="field-error">{errors.dayOfBirth}</p>}
            </div>

            <div>
              <label className="field-label" htmlFor="horseWeight">
                {t('ownerHorseWeight')} (kg) <span className="required">*</span>
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
                {t('ownerHorseColour')} <span className="required">*</span>
              </label>
              <input
                className={errors.colour ? 'input has-error' : 'input'}
                id="horseColour"
                name="colour"
                type="text"
                placeholder={t('ownerHorseColourPlaceholder')}
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
                {t('ownerHorseSex')} <span className="required">*</span>
              </label>
              <select
                className={errors.sex ? 'input has-error' : 'input'}
                id="horseSex"
                name="sex"
                value={formValues.sex}
                onChange={onChange}
                disabled={isSaving}
              >
                <option value="MALE">{t('ownerHorseSexMale')}</option>
                <option value="FEMALE">{t('ownerHorseSexFemale')}</option>
              </select>
              {errors.sex && <p className="field-error">{errors.sex}</p>}
            </div>

            <div>
              <label className="field-label" htmlFor="horseBreeding">
                {t('ownerHorseBreeding')} <span className="required">*</span>
              </label>
              <input
                className={errors.breeding ? 'input has-error' : 'input'}
                id="horseBreeding"
                name="breeding"
                type="text"
                placeholder={t('ownerHorseBreedingPlaceholder')}
                value={formValues.breeding}
                onChange={onChange}
                disabled={isSaving}
              />
              {errors.breeding && <p className="field-error">{errors.breeding}</p>}
            </div>
          </div>

          <label className="field-label" htmlFor="horseTrainer">
            {t('ownerHorseTrainer')} <span className="required">*</span>
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
                {t('ownerHorseHealthExpiry')} <span className="required">*</span>
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
                {t('ownerHorseOfficialProfileUrl')} <span className="required">*</span>
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
                {t('ownerHorseProfileHelp')}
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
              {isSaving ? t('ownerHorseSubmitting') : editingHorse ? t('ownerHorseUpdate') : t('ownerHorseSubmit')}
            </button>

            <button className="outline-button" type="button" onClick={onCancelEdit} disabled={isSaving}>
              {editingHorse ? t('ownerHorseCancelEdit') : t('cancel')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
