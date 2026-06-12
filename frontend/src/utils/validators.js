const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;
const PUBLIC_ROLES = ['OWNER', 'JOCKEY', 'SPECTATOR'];

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
    errors.password = 'Password must be between 6 and 72 characters.';
  }

  return errors;
}

export function validateSignupForm(values) {
  const errors = {};

  if (!values.fullName?.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (values.fullName.trim().length > 255) {
    errors.fullName = 'Full name must not exceed 255 characters.';
  }

  if (!values.email?.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Email format is invalid.';
  }

  if (!values.phone?.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = 'Phone number must contain 9-15 digits and may start with +.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password must be between 6 and 72 characters.';
  }

  if (!values.roleName || !PUBLIC_ROLES.includes(values.roleName)) {
    errors.roleName = 'Role must be OWNER, JOCKEY, or SPECTATOR.';
  }

  return errors;
}

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function todayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function validateHorseForm(values) {
  const errors = {};
  const weight = Number(values.weight);
  const today = todayDateOnly();
  const dayOfBirth = toDateOnly(values.dayOfBirth);
  const healthCertExpiry = toDateOnly(values.healthCertExpiry);

  if (!values.horseName?.trim()) {
    errors.horseName = 'Horse name is required.';
  } else if (values.horseName.trim().length < 2 || values.horseName.trim().length > 100) {
    errors.horseName = 'Horse name must be between 2 and 100 characters.';
  } else if (!/^[\p{L}0-9][\p{L}0-9 .'-]*$/u.test(values.horseName.trim())) {
    errors.horseName = 'Horse name contains invalid characters.';
  }

  if (!values.breed?.trim()) {
    errors.breed = 'Breed is required.';
  } else if (values.breed.trim().length < 2 || values.breed.trim().length > 100) {
    errors.breed = 'Breed must be between 2 and 100 characters.';
  } else if (!/^[\p{L}0-9][\p{L}0-9 .'-]*$/u.test(values.breed.trim())) {
    errors.breed = 'Breed contains invalid characters.';
  }

  if (!values.color?.trim()) {
    errors.color = 'Coat color is required.';
  } else if (values.color.trim().length < 2 || values.color.trim().length > 50) {
    errors.color = 'Coat color must be between 2 and 50 characters.';
  } else if (!/^[\p{L}][\p{L} .'-]*$/u.test(values.color.trim())) {
    errors.color = 'Coat color contains invalid characters.';
  }

  if (!values.dayOfBirth) {
    errors.dayOfBirth = 'Birth date is required.';
  } else if (!dayOfBirth) {
    errors.dayOfBirth = 'Birth date is invalid.';
  } else if (dayOfBirth > today) {
    errors.dayOfBirth = 'Birth date must be today or in the past.';
  }

  if (values.weight === '' || values.weight === null || values.weight === undefined) {
    errors.weight = 'Weight is required.';
  } else if (!Number.isFinite(weight) || weight < 200 || weight > 1000) {
    errors.weight = 'Horse weight must be between 200 and 1000 kg.';
  }

  if (!values.healthCertExpiry) {
    errors.healthCertExpiry = 'Health certificate expiry is required.';
  } else if (!healthCertExpiry) {
    errors.healthCertExpiry = 'Health certificate expiry date is invalid.';
  } else if (healthCertExpiry < today) {
    errors.healthCertExpiry = 'Health certificate expiry must be today or in the future.';
  }
  if (values.imgUrl && !/^https?:\/\/.+/i.test(values.imgUrl.trim())) {
    errors.imgUrl = 'Image URL must start with http:// or https://';
  }

  return errors;
}
