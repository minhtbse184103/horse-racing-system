const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

export function validateLoginForm(values) {
  const errors = {};

  if (!values.email?.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Email format is invalid.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password must be 6 to 72 characters.';
  }

  return errors;
}

export function validateSignupForm(values) {
  const errors = {};

  if (!values.username?.trim()) {
    errors.username = 'Tên đăng nhập là bắt buộc.';
  } else if (values.username.trim().length > 255) {
    errors.username = 'Tên đăng nhập không được vượt quá 255 ký tự.';
  }

  if (!values.email?.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Email format is invalid.';
  }

  if (!values.phone?.trim()) {
    errors.phone = 'Phone is required.';
  } else if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = 'Phone must be 9-15 digits and may start with +.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password must be 6 to 72 characters.';
  }

  return errors;
}

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function validateHorseForm(values) {
  const errors = {};
  const weight = Number(values.weight);
  const dayOfBirth = toDateOnly(values.dayOfBirth);
  const healthCertificateExpiryDate = toDateOnly(values.healthCertificateExpiryDate);
  const horseCertificateImages = Array.isArray(values.horseCertificateImages) ? values.horseCertificateImages : [];

  if (!values.horseName?.trim()) {
    errors.horseName = 'Horse Name is required.';
  } else if (values.horseName.trim().length < 2 || values.horseName.trim().length > 100) {
    errors.horseName = 'Horse Name must be 2 to 100 characters.';
  } else if (!/^[\p{L}0-9][\p{L}0-9 .'-]*$/u.test(values.horseName.trim())) {
    errors.horseName = 'Horse Name contains invalid characters.';
  }

  if (!values.dayOfBirth) {
    errors.dayOfBirth = 'Day of Birth is required.';
  } else if (!dayOfBirth) {
    errors.dayOfBirth = 'Day of Birth is invalid.';
  } else if (dayOfBirth >= new Date()) {
    errors.dayOfBirth = 'Day of Birth must be in the past.';
  }

  if (values.weight === '' || values.weight === null || values.weight === undefined) {
    errors.weight = 'Weight is required.';
  } else if (!Number.isFinite(weight) || weight <= 0) {
    errors.weight = 'Weight must be greater than 0.';
  }

  if (!values.colour?.trim()) errors.colour = 'Colour is required.';
  if (!values.sex?.trim()) errors.sex = 'Sex is required.';
  if (!values.breeding?.trim()) errors.breeding = 'Breeding is required.';
  if (!values.trainer?.trim()) errors.trainer = 'Trainer is required.';

  if (!values.healthCertificateExpiryDate) {
    errors.healthCertificateExpiryDate = 'Health Certificate Expiry Date is required.';
  } else if (!healthCertificateExpiryDate) {
    errors.healthCertificateExpiryDate = 'Health Certificate Expiry Date is invalid.';
  }

  if (!values.officialHorseProfileUrl?.trim()) {
    errors.officialHorseProfileUrl = 'Official Horse Profile URL is required.';
  } else {
    try {
      const url = new URL(values.officialHorseProfileUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.officialHorseProfileUrl = 'Official Horse Profile URL must be a valid URL.';
      }
    } catch {
      errors.officialHorseProfileUrl = 'Official Horse Profile URL must be a valid URL.';
    }
  }

  if (horseCertificateImages.length === 0) {
    errors.horseCertificateImages = 'Health Certificate is required. Import one file.';
  } else if (horseCertificateImages.length > 1) {
    errors.horseCertificateImages = 'Upload one Health Certificate file only.';
  }

  return errors;
}
