const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;
const PUBLIC_ROLES = ['OWNER', 'JOCKEY', 'SPECTATOR'];

export function validateLoginForm(values) {
  const errors = {};

  if (!values.email?.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
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
    errors.fullName = 'Full name cannot exceed 255 characters.';
  }

  if (!values.email?.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.phone?.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = 'Phone number must contain 9-15 digits and may begin with +.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password must be between 6 and 72 characters.';
  }

  if (!values.roleName || !PUBLIC_ROLES.includes(values.roleName)) {
    errors.roleName = 'Role must be Owner, Jockey, or Spectator.';
  }

  return errors;
}

export function validateHorseForm(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = 'Tên ngựa không được để trống.';
  }

  if (!values.breed?.trim()) {
    errors.breed = 'Giống ngựa không được để trống.';
  }

  if (values.age === '') {
    errors.age = 'Tuổi ngựa không được để trống.';
  } else if (Number(values.age) < 0) {
    errors.age = 'Tuổi ngựa phải lớn hơn hoặc bằng 0.';
  }

  if (values.weight === '') {
    errors.weight = 'Cân nặng không được để trống.';
  } else if (Number(values.weight) <= 0) {
    errors.weight = 'Cân nặng phải lớn hơn 0.';
  }

  if (!values.healthCertExpiry) {
    errors.healthCertExpiry = 'Hạn giấy sức khỏe không được để trống.';
  }

  if (!values.status) {
    errors.status = 'Trạng thái ngựa không được để trống.';
  }

  return errors;
}
