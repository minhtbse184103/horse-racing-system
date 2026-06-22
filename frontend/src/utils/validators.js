const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

export function validateLoginForm(values) {
  const errors = {};

  if (!values.email?.trim()) {
    errors.email = 'Email là bắt buộc.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Định dạng email không hợp lệ.';
  }

  if (!values.password) {
    errors.password = 'Mật khẩu là bắt buộc.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Mật khẩu phải có từ 6 đến 72 ký tự.';
  }

  return errors;
}

export function validateSignupForm(values) {
  const errors = {};

  if (!values.username?.trim()) {
    errors.username = 'Username la bat buoc.';
  } else if (values.username.trim().length > 255) {
    errors.username = 'Username khong duoc vuot qua 255 ky tu.';
  }

  if (!values.email?.trim()) {
    errors.email = 'Email là bắt buộc.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Định dạng email không hợp lệ.';
  }

  if (!values.phone?.trim()) {
    errors.phone = 'Số điện thoại là bắt buộc.';
  } else if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = 'Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +.';
  }

  if (!values.password) {
    errors.password = 'Mật khẩu là bắt buộc.';
  } else if (values.password.length < 6 || values.password.length > 72) {
    errors.password = 'Mật khẩu phải có từ 6 đến 72 ký tự.';
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
  const healthCertificateExpiryDate = toDateOnly(values.healthCertificateExpiryDate);
  const passportNumber = String(values.passportNumber ?? '').trim();
  const horsePassportImages = Array.isArray(values.horsePassportImages) ? values.horsePassportImages : [];
  const horseCertificateImages = Array.isArray(values.horseCertificateImages) ? values.horseCertificateImages : [];
  const horseImages = Array.isArray(values.horseImages) ? values.horseImages : [];
  const totalImages = horsePassportImages.length + horseCertificateImages.length + horseImages.length;

  if (!passportNumber) {
    errors.passportNumber = 'Passport Number là bắt buộc.';
  } else if (passportNumber.length < 3 || passportNumber.length > 50) {
    errors.passportNumber = 'Passport Number phải có từ 3 đến 50 ký tự.';
  }

  if (!values.horseName?.trim()) {
    errors.horseName = 'Tên ngựa là bắt buộc.';
  } else if (values.horseName.trim().length < 2 || values.horseName.trim().length > 100) {
    errors.horseName = 'Tên ngựa phải có từ 2 đến 100 ký tự.';
  } else if (!/^[\p{L}0-9][\p{L}0-9 .'-]*$/u.test(values.horseName.trim())) {
    errors.horseName = 'Tên ngựa chứa ký tự không hợp lệ.';
  }

  if (!values.breed?.trim()) {
    errors.breed = 'Giống ngựa là bắt buộc.';
  } else if (values.breed.trim().length < 2 || values.breed.trim().length > 100) {
    errors.breed = 'Tên giống ngựa phải có từ 2 đến 100 ký tự.';
  } else if (!/^[\p{L}0-9][\p{L}0-9 .'-]*$/u.test(values.breed.trim())) {
    errors.breed = 'Tên giống ngựa chứa ký tự không hợp lệ.';
  }

  if (!values.color?.trim()) {
    errors.color = 'Màu lông là bắt buộc.';
  } else if (values.color.trim().length < 2 || values.color.trim().length > 50) {
    errors.color = 'Màu lông phải có từ 2 đến 50 ký tự.';
  } else if (!/^[\p{L}][\p{L} .'-]*$/u.test(values.color.trim())) {
    errors.color = 'Màu lông chứa ký tự không hợp lệ.';
  }

  if (!values.gender) {
    errors.gender = 'Gender is required.';
  }

  if (!values.dayOfBirth) {
    errors.dayOfBirth = 'Ngày sinh là bắt buộc.';
  } else if (!dayOfBirth) {
    errors.dayOfBirth = 'Ngày sinh không hợp lệ.';
  } else if (dayOfBirth > today) {
    errors.dayOfBirth = 'Ngày sinh phải là hôm nay hoặc một ngày trong quá khứ.';
  }

  if (values.weight === '' || values.weight === null || values.weight === undefined) {
    errors.weight = 'Cân nặng là bắt buộc.';
  } else if (!Number.isFinite(weight) || weight < 200 || weight > 1000) {
    errors.weight = 'Cân nặng của ngựa phải từ 200 đến 1000 kg.';
  }

  if (!values.healthCertificateExpiryDate) {
    errors.healthCertificateExpiryDate = 'Health Certificate Expiry Date is required.';
  } else if (!healthCertificateExpiryDate) {
    errors.healthCertificateExpiryDate = 'Health Certificate Expiry Date is invalid.';
  }

  if (horsePassportImages.length === 0) {
    errors.horsePassportImages = 'Horse Passport is required. Import at least 1 file.';
  }

  if (horseCertificateImages.length === 0) {
    errors.horseCertificateImages = 'Health Certificate is required. Import at least 1 file.';
  }

  if (horseImages.length === 0) {
    errors.horseImages = 'Horse Image is required. Import at least 1 file.';
  }

  if (totalImages > 10) {
    errors.totalImages = 'Total files for Horse Passport, Health Certificate and Horse Image cannot exceed 10 files.';
  }

  return errors;
}
