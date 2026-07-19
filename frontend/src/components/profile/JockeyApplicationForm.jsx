import { useMemo, useState } from 'react';
import { uploadFile } from '../../services/uploadService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const inputClass = 'w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-slate-500';
const licenceTypeOptions = [{ value: 'TRAINEE', vi: 'Tập sự', en: 'Trainee' }, { value: 'AMATEUR', vi: 'Nghiệp dư', en: 'Amateur' }, { value: 'PROFESSIONAL', vi: 'Chuyên nghiệp', en: 'Professional' }];

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function tomorrowInputValue() {
  const tomorrow = startOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function makeInitialValues(user, application) {
  const files = Array.isArray(application?.files) ? application.files : [];
  const verificationLinks = String(application?.verificationLink || '')
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);

  return {
    applicantEmail: user?.email || '',
    trainerName: application?.trainerName || '',
    trainerEmail: application?.trainerEmail || '',
    academyStableAddress: application?.academyStableAddress || '',
    issuingAuthority: application?.issuingAuthority || '',
    verificationLinks: verificationLinks.length > 0 ? verificationLinks : [''],
    licenceType: application?.licenceType || 'TRAINEE',
    expiryDate: application?.expiryDate || '',
    weight: application?.weight == null ? '55' : String(application.weight),
    biography: application?.biography || '',
    licenseFiles: files.map((file) => ({
      url: file.fileUrl || '',
      name: file.fileUrl ? file.fileUrl.split('/').pop() : 'Licence image',
      fileType: file.fileType || 'IMAGE',
      previewUrl: file.fileUrl || ''
    })).filter((file) => file.url)
  };
}

export default function JockeyApplicationForm({ user, application, mode = 'submit', formError = '', onSubmit, onCancel, isSubmitting }) {
  const { language } = useLanguage();
  const tr = (en, vi) => language === 'en' ? en : vi;
  const [values, setValues] = useState(() => makeInitialValues(user, application));
  const [errors, setErrors] = useState({});
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const isReady = useMemo(() => {
    const weight = Number(values.weight);
    const expiryDate = parseLocalDate(values.expiryDate);

    return (
      values.trainerName.trim() &&
      values.trainerEmail.trim() &&
      values.issuingAuthority.trim() &&
      values.licenceType.trim() &&
      expiryDate &&
      expiryDate > startOfToday() &&
      Number.isFinite(weight) &&
      weight >= 35 &&
      weight <= 90 &&
      values.licenseFiles.length > 0 &&
      values.licenseFiles.length <= 5
    );
  }, [values]);

  function validate() {
    const nextErrors = {};
    const weight = Number(values.weight);
    if (!values.trainerName.trim()) nextErrors.trainerName = tr('Trainer name is required.', 'Vui lòng nhập tên huấn luyện viên.');
    if (!values.trainerEmail.trim()) nextErrors.trainerEmail = tr('Trainer email is required.', 'Vui lòng nhập email huấn luyện viên.');
    if (values.trainerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.trainerEmail)) {
      nextErrors.trainerEmail = tr('Trainer email is invalid.', 'Email huấn luyện viên không hợp lệ.');
    }
    if (!values.issuingAuthority.trim()) nextErrors.issuingAuthority = tr('Issuing authority is required.', 'Vui lòng nhập cơ quan cấp phép.');
    if (!values.licenceType.trim()) nextErrors.licenceType = tr('Licence type is required.', 'Vui lòng chọn loại giấy phép.');
    if (!values.expiryDate) {
      nextErrors.expiryDate = tr('Expiry date is required.', 'Vui lòng chọn ngày hết hạn.');
    } else {
      const expiryDate = parseLocalDate(values.expiryDate);
      if (!expiryDate || expiryDate <= startOfToday()) {
        nextErrors.expiryDate = tr('Expiry date must be in the future.', 'Ngày hết hạn phải là một ngày trong tương lai.');
      }
    }
    if (!Number.isFinite(weight) || weight < 35 || weight > 90) {
      nextErrors.weight = tr('Jockey weight must be between 35 and 90 kg.', 'Cân nặng Jockey phải từ 35 đến 90 kg.');
    }
    const links = values.verificationLinks.map((link) => link.trim()).filter(Boolean);
    const invalidLink = links.find((link) => !/^https?:\/\/.+/i.test(link));
    if (invalidLink) {
      nextErrors.verificationLinks = tr('Every verification link must start with http:// or https://.', 'Mỗi liên kết xác minh phải bắt đầu bằng http:// hoặc https://.');
    }
    if (values.licenseFiles.length === 0) nextErrors.licenseFiles = tr('At least one jockey licence image is required.', 'Vui lòng tải lên ít nhất một ảnh giấy phép Jockey.');
    if (values.licenseFiles.length > 5) nextErrors.licenseFiles = tr('You can upload at most 5 licence images.', 'Bạn chỉ có thể tải lên tối đa 5 ảnh giấy phép.');

    setErrors(nextErrors);
    return nextErrors;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleVerificationLinkChange(index, nextValue) {
    setValues((current) => ({
      ...current,
      verificationLinks: current.verificationLinks.map((link, linkIndex) =>
        linkIndex === index ? nextValue : link
      )
    }));
    setErrors((current) => ({ ...current, verificationLinks: '' }));
  }

  function handleAddVerificationLink() {
    setValues((current) => ({
      ...current,
      verificationLinks: [...current.verificationLinks, '']
    }));
  }

  function handleRemoveVerificationLink(index) {
    setValues((current) => ({
      ...current,
      verificationLinks: current.verificationLinks.length === 1
        ? ['']
        : current.verificationLinks.filter((_, linkIndex) => linkIndex !== index)
    }));
    setErrors((current) => ({ ...current, verificationLinks: '' }));
  }

  async function handleLicenseFileChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) return;

    if (values.licenseFiles.length + files.length > 5) {
      setErrors((current) => ({ ...current, licenseFiles: tr('You can upload at most 5 licence images.', 'Bạn chỉ có thể tải lên tối đa 5 ảnh giấy phép.') }));
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setErrors((current) => ({ ...current, licenseFiles: tr('Only image files are supported.', 'Chỉ hỗ trợ tệp hình ảnh.') }));
      return;
    }

    setIsUploadingLicense(true);

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const uploaded = await uploadFile(file, 'jockey-license');
          const uploadedUrl = uploaded.url || '';
          return {
            url: uploadedUrl,
            name: uploaded.originalFilename || file.name,
            fileType: 'IMAGE',
            previewUrl: uploadedUrl
          };
        })
      );

      setValues((current) => ({
        ...current,
        licenseFiles: [...current.licenseFiles, ...uploadedFiles].slice(0, 5)
      }));
      setErrors((current) => ({ ...current, licenseFiles: '' }));
    } catch (error) {
      setErrors((current) => ({ ...current, licenseFiles: error.message || tr('Cannot upload licence images.', 'Không thể tải ảnh giấy phép lên.') }));
    } finally {
      setIsUploadingLicense(false);
    }
  }

  function handleRemoveLicense(index) {
    setValues((current) => ({
      ...current,
      licenseFiles: current.licenseFiles.filter((_, fileIndex) => fileIndex !== index)
    }));
    setErrors((current) => ({ ...current, licenseFiles: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      trainerName: values.trainerName.trim(),
      trainerEmail: values.trainerEmail.trim(),
      academyStableAddress: values.academyStableAddress.trim(),
      issuingAuthority: values.issuingAuthority.trim(),
      verificationLink: values.verificationLinks.map((link) => link.trim()).filter(Boolean).join('\n'),
      licenceType: values.licenceType.trim(),
      expiryDate: values.expiryDate,
      weight: Number(values.weight),
      biography: values.biography.trim(),
      files: values.licenseFiles.map((file) => ({
        fileUrl: file.url,
        fileType: file.fileType
      }))
    });
  }

  function renderError(name) {
    if (!errors[name]) return null;
    return <span className="text-xs font-bold text-danger">{errors[name]}</span>;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <div className="flex flex-col gap-3 border-b border-brown-700/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">{tr('Jockey Application', 'Hồ sơ Jockey')}</p>
            <h2 className="text-3xl font-black text-brown-900">
              {mode === 'resubmit' ? tr('Apply Again as Jockey', 'Đăng ký lại làm Jockey') : tr('Become a Jockey', 'Trở thành Jockey')}
            </h2>
            <p className="mt-2 max-w-2xl font-medium text-slate-500">
              {tr('Submit licence and trainer information for administrator approval. After approval, sign in again to enter the Jockey workspace.', 'Gửi giấy phép và thông tin huấn luyện viên để quản trị viên phê duyệt. Sau khi được duyệt, hãy đăng nhập lại để vào khu vực Jockey.')}
            </p>
          </div>
          <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>
            {tr('Cancel', 'Hủy')}
          </button>
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
          {formError && <div className="admin-alert error" role="alert">{formError}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Applicant Email', 'Email người đăng ký')}</span>
              <input className={inputClass} value={values.applicantEmail || tr('Not updated', 'Chưa cập nhật')} readOnly disabled />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Trainer Name', 'Tên huấn luyện viên')}</span>
              <input className={inputClass} name="trainerName" value={values.trainerName} onChange={handleChange} disabled={isSubmitting} />
              {renderError('trainerName')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Trainer Email', 'Email huấn luyện viên')}</span>
              <input className={inputClass} name="trainerEmail" type="email" value={values.trainerEmail} onChange={handleChange} disabled={isSubmitting} />
              {renderError('trainerEmail')}
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Academy / Stable Address', 'Học viện / Địa chỉ chuồng ngựa')}</span>
              <input className={inputClass} name="academyStableAddress" value={values.academyStableAddress} onChange={handleChange} disabled={isSubmitting} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Issuing Authority', 'Cơ quan cấp phép')}</span>
              <input className={inputClass} name="issuingAuthority" value={values.issuingAuthority} onChange={handleChange} disabled={isSubmitting} />
              {renderError('issuingAuthority')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Licence Type', 'Loại giấy phép')}</span>
              <select className={inputClass} name="licenceType" value={values.licenceType} onChange={handleChange} disabled={isSubmitting}>
                {licenceTypeOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option[language] || option.vi}</option>
                ))}
              </select>
              {renderError('licenceType')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Expiry Date', 'Ngày hết hạn')}</span>
              <input className={inputClass} name="expiryDate" type="date" min={tomorrowInputValue()} value={values.expiryDate} onChange={handleChange} disabled={isSubmitting} />
              {renderError('expiryDate')}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Weight (kg)', 'Cân nặng (kg)')}</span>
              <input className={inputClass} name="weight" type="number" min="35" max="90" step="0.01" value={values.weight} onChange={handleChange} disabled={isSubmitting} />
              {renderError('weight')}
            </label>

            <div className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Verification Link', 'Liên kết xác minh')}</span>
              <div className="grid gap-2">
                {values.verificationLinks.map((link, index) => (
                  <div className="flex gap-2 max-sm:flex-col" key={`verification-link-${index}`}>
                    <input
                      className={inputClass}
                      placeholder="https://authority.example/verify/your-license"
                      value={link}
                      onChange={(event) => handleVerificationLinkChange(index, event.target.value)}
                      disabled={isSubmitting}
                    />
                    <button
                      className="outline-button compact-button"
                      type="button"
                      onClick={() => handleRemoveVerificationLink(index)}
                      disabled={isSubmitting}
                    >
                      {tr('Remove', 'Xóa')}
                    </button>
                  </div>
                ))}
              </div>
              <button className="outline-button compact-button justify-self-start" type="button" onClick={handleAddVerificationLink} disabled={isSubmitting}>
                {tr('Add Link', 'Thêm liên kết')}
              </button>
              <span className="text-xs font-semibold text-slate-500">{tr('Enter verification links manually. Uploaded licence images will not be copied here automatically.', 'Nhập liên kết xác minh thủ công. Ảnh giấy phép đã tải lên sẽ không tự động được sao chép vào đây.')}</span>
              {renderError('verificationLinks')}
            </div>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Biography', 'Tiểu sử')}</span>
              <textarea className={`${inputClass} min-h-28 resize-none`} name="biography" value={values.biography} onChange={handleChange} disabled={isSubmitting} />
            </label>

            <div className="grid gap-2 md:col-span-2">
              <span className="text-sm font-extrabold text-brown-900">{tr('Jockey Licence File', 'Tệp giấy phép Jockey')}</span>
              <div className="identity-upload-box">
                <div>
                  <strong>{tr('Upload licence proof', 'Tải lên bằng chứng giấy phép')}</strong>
                  <p>{tr('Upload up to 5 images of your jockey licence for admin review.', 'Tải lên tối đa 5 ảnh giấy phép Jockey để quản trị viên xét duyệt.')}</p>
                  <small>{tr('Supported formats: JPG, PNG, WebP.', 'Định dạng hỗ trợ: JPG, PNG, WebP.')} {values.licenseFiles.length}/5 {tr('uploaded', 'đã tải lên')}.</small>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="outline-button compact-button cursor-pointer">
                    {isUploadingLicense ? tr('Uploading...', 'Đang tải lên...') : tr('Choose Images', 'Chọn ảnh')}
                    <input className="sr-only" type="file" accept="image/*" multiple onChange={handleLicenseFileChange} disabled={isSubmitting || isUploadingLicense || values.licenseFiles.length >= 5} />
                  </label>
                </div>
              </div>
              {values.licenseFiles.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {values.licenseFiles.map((file, index) => (
                    <div className="identity-preview-card flex h-full min-h-[19rem] flex-col" key={file.url || index}>
                      <img
                        className="h-56 w-full rounded-lg bg-white object-contain"
                        src={file.previewUrl || file.url}
                        alt={tr(`Jockey licence preview ${index + 1}`, `Xem trước giấy phép Jockey ${index + 1}`)}
                      />
                      <div className="mt-auto flex min-h-12 items-center justify-between gap-2 pt-3">
                        <a className="min-w-0 flex-1 truncate font-bold text-green-700 underline" href={file.url} target="_blank" rel="noreferrer">
                          {file.name || tr(`Licence image ${index + 1}`, `Ảnh giấy phép ${index + 1}`)}
                        </a>
                        <button className="outline-button danger-action compact-button w-24 shrink-0" type="button" onClick={() => handleRemoveLicense(index)} disabled={isSubmitting}>
                          {tr('Remove', 'Xóa')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {renderError('licenseFiles')}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
            <button className="outline-button" type="button" onClick={onCancel} disabled={isSubmitting}>
              {tr('Cancel', 'Hủy')}
            </button>
            <button className="primary-button sm:w-auto" type="submit" disabled={!isReady || isSubmitting || isUploadingLicense}>
              {isSubmitting ? tr('Submitting...', 'Đang gửi...') : mode === 'resubmit' ? tr('Submit Again', 'Gửi lại') : tr('Submit Application', 'Gửi hồ sơ')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
