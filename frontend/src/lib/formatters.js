import defaultHorseImage from '../assets/default-horse.svg';
export function formatNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('en-US') : '0';
}
export function formatDate(value) {
    if (!value)
        return 'Chưa cập nhật';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime()))
        return String(value);
    return date.toLocaleDateString('vi-VN');
}

const DISPLAY_LABELS = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    PENDING: 'Đang chờ xử lý',
    UNDER_REVIEW: 'Đang xét duyệt',
    ACCEPTED: 'Đã chấp nhận',
    CONFIRMED: 'Đã xác nhận',
    REJECTED: 'Đã từ chối',
    BLOCKED: 'Đã khóa',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Đã hết hạn',
    ASSIGNED: 'Đã phân công',
    DRAFT: 'Bản nháp',
    OPEN_FOR_REGISTRATION: 'Mở đăng ký',
    OPENFORREGISTRATION: 'Mở đăng ký',
    CLOSED_REGISTRATION: 'Đã đóng đăng ký',
    CLOSEDREGISTRATION: 'Đã đóng đăng ký',
    ONGOING: 'Đang diễn ra',
    FINISHED: 'Đã kết thúc',
    OWNER: 'Chủ ngựa',
    JOCKEY: 'Nài ngựa',
    ADMIN: 'Quản trị viên',
    REFEREE: 'Trọng tài',
    SPECTATOR: 'Khán giả',
    MALE: 'Đực',
    FEMALE: 'Cái',
    BEGINNER: 'Mới bắt đầu',
    INTERMEDIATE: 'Trung cấp',
    PROFESSIONAL: 'Chuyên nghiệp',
    ELITE: 'Tinh anh',
    ALL: 'Tất cả'
};

export function formatDisplayLabel(value, fallback = 'Không có') {
    if (value === null || value === undefined || value === '') return fallback;
    const normalized = String(value)
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toUpperCase();
    return DISPLAY_LABELS[normalized] || String(value).replace(/_/g, ' ');
}
export function getUserId(user) {
    return user?.id ?? user?.Id ?? user?.userID ?? user?.userId;
}
export function getUserRole(user) {
    const rawRole = user?.role ??
        user?.roleName ??
        user?.userRole ??
        user?.authorities?.[0]?.authority ??
        (typeof user?.roles?.[0] === 'object' ? user.roles[0]?.name : user?.roles?.[0]);
    if (!rawRole)
        return '';
    return String(rawRole).replace(/^ROLE_/i, '').trim().toUpperCase();
}
export function getHorseId(horse) {
    return horse?.horseId ?? horse?.horseID ?? horse?.id;
}
export function getHorseName(horse) {
    return String(horse?.horseName ?? horse?.name ?? '').trim();
}
export function emptyHorseForm() {
    return {
        horseName: '',
        breed: '',
        gender: 'MALE',
        color: '',
        dayOfBirth: '',
        weight: '',
        healthCertExpiry: '',
        imgUrl: defaultHorseImage
    };
}
export function toHorsePayload(formValues) {
  const horseName = String(formValues.horseName ?? '').trim();
  const weight = Number(formValues.weight);

  return {
    horseName,
    breed: formValues.breed.trim() || null,
    gender: formValues.gender || null,
    color: formValues.color.trim() || null,
    dayOfBirth: formValues.dayOfBirth || null,
    weight,
    healthCertExpiry: formValues.healthCertExpiry || null,
    imgUrl: formValues.imgUrl || defaultHorseImage
  };
}
