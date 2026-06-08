const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;
const PUBLIC_ROLES = ['OWNER', 'JOCKEY', 'SPECTATOR'];

export function validateLoginForm(values) {
  const errors = {};

  if (!values.email?.trim()) {
    errors.email = 'Email không được để trống.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Email không đúng định dạng.';
  }

  if (!values.password) {
    errors.password = 'Password không được để trống.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password phải từ 6 đến 72 ký tự.';
  }

  return errors;
}

export function validateSignupForm(values) {
  const errors = {};

  if (!values.fullName?.trim()) {
    errors.fullName = 'Họ tên không được để trống.';
  } else if (values.fullName.trim().length > 255) {
    errors.fullName = 'Họ tên không được vượt quá 255 ký tự.';
  }

  if (!values.email?.trim()) {
    errors.email = 'Email không được để trống.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Email không đúng định dạng.';
  }

  if (!values.phone?.trim()) {
    errors.phone = 'Số điện thoại không được để trống.';
  } else if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = 'Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +.';
  }

  if (!values.password) {
    errors.password = 'Password không được để trống.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Password phải từ 6 đến 72 ký tự.';
  }

  if (!values.roleName || !PUBLIC_ROLES.includes(values.roleName)) {
    errors.roleName = 'Role chỉ được là OWNER, JOCKEY hoặc SPECTATOR.';
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
