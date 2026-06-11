const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;
const PUBLIC_ROLES = ['OWNER', 'JOCKEY', 'SPECTATOR'];
export function validateLoginForm(values) {
    const errors = {};
    if (!values.email?.trim()) {
        errors.email = 'Email không được để trống.';
    }
    else if (!EMAIL_REGEX.test(values.email.trim())) {
        errors.email = 'Email không đúng định dạng.';
    }
    if (!values.password) {
        errors.password = 'Password không được để trống.';
    }
    else if (values.password.length < 6 || values.password.length > 72) {
        errors.password = 'Password phải từ 6 đến 72 ký tự.';
    }
    return errors;
}
export function validateSignupForm(values) {
    const errors = {};
    if (!values.fullName?.trim()) {
        errors.fullName = 'Họ tên không được để trống.';
    }
    else if (values.fullName.trim().length > 255) {
        errors.fullName = 'Họ tên không được vượt quá 255 ký tự.';
    }
    if (!values.email?.trim()) {
        errors.email = 'Email không được để trống.';
    }
    else if (!EMAIL_REGEX.test(values.email.trim())) {
        errors.email = 'Email không đúng định dạng.';
    }
    if (!values.phone?.trim()) {
        errors.phone = 'Số điện thoại không được để trống.';
    }
    else if (!PHONE_REGEX.test(values.phone.trim())) {
        errors.phone = 'Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +.';
    }
    if (!values.password) {
        errors.password = 'Password không được để trống.';
    }
    else if (values.password.length < 6 || values.password.length > 72) {
        errors.password = 'Password phải từ 6 đến 72 ký tự.';
    }
    if (!values.roleName || !PUBLIC_ROLES.includes(values.roleName)) {
        errors.roleName = 'Role chỉ được là OWNER, JOCKEY hoặc SPECTATOR.';
    }
    return errors;
}
function toDateOnly(value) {
    if (!value)
        return null;
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
        errors.horseName = 'Tên ngựa không được để trống.';
    }
    else if (values.horseName.trim().length < 2 || values.horseName.trim().length > 100) {
        errors.horseName = 'Tên ngựa phải từ 2 đến 100 ký tự.';
    }
    else if (!/^[\p{L}0-9][\p{L}0-9 .'-]*$/u.test(values.horseName.trim())) {
        errors.horseName = 'Tên ngựa chứa ký tự không hợp lệ.';
    }
    if (!values.breed?.trim()) {
        errors.breed = 'Giống ngựa không được để trống.';
    }
    else if (values.breed.trim().length < 2 || values.breed.trim().length > 100) {
        errors.breed = 'Giống ngựa phải từ 2 đến 100 ký tự.';
    }
    else if (!/^[\p{L}0-9][\p{L}0-9 .'-]*$/u.test(values.breed.trim())) {
        errors.breed = 'Giống ngựa chứa ký tự không hợp lệ.';
    }
    if (!values.color?.trim()) {
        errors.color = 'Màu lông không được để trống.';
    }
    else if (values.color.trim().length < 2 || values.color.trim().length > 50) {
        errors.color = 'Màu lông phải từ 2 đến 50 ký tự.';
    }
    else if (!/^[\p{L}][\p{L} .'-]*$/u.test(values.color.trim())) {
        errors.color = 'Màu lông chứa ký tự không hợp lệ.';
    }
    if (!values.dayOfBirth) {
        errors.dayOfBirth = 'Ngày sinh không được để trống.';
    }
    else if (!dayOfBirth) {
        errors.dayOfBirth = 'Ngày sinh không hợp lệ.';
    }
    else if (dayOfBirth > today) {
        errors.dayOfBirth = 'Ngày sinh phải là hôm nay hoặc trong quá khứ.';
    }
    if (values.weight === '' || values.weight === null || values.weight === undefined) {
        errors.weight = 'Cân nặng không được để trống.';
    }
    else if (!Number.isFinite(weight) || weight < 200 || weight > 1000) {
        errors.weight = 'Cân nặng ngựa phải từ 200 đến 1000 kg.';
    }
    if (!values.healthCertExpiry) {
        errors.healthCertExpiry = 'Hạn giấy chứng nhận sức khỏe không được để trống.';
    }
    else if (!healthCertExpiry) {
        errors.healthCertExpiry = 'Hạn giấy chứng nhận sức khỏe không hợp lệ.';
    }
    else if (healthCertExpiry < today) {
        errors.healthCertExpiry = 'Hạn giấy chứng nhận sức khỏe phải là hôm nay hoặc trong tương lai.';
    }
    if (!values.imgUrl?.trim()) {
        errors.imgUrl = 'Image URL không được để trống.';
    }
    else if (!/^https?:\/\/.+/i.test(values.imgUrl.trim())) {
        errors.imgUrl = 'Image URL phải bắt đầu bằng http:// hoặc https://.';
    }
    return errors;
}
