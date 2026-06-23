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
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    UNDER_REVIEW: 'UNDER_REVIEW',
    ACCEPTED: 'ACCEPTED',
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    BLOCKED: 'BLOCKED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    ASSIGNED: 'ASSIGNED',
    DRAFT: 'Draft',
    OPEN_FOR_REGISTRATION: 'OpenForRegistration',
    OPENFORREGISTRATION: 'OpenForRegistration',
    CLOSED_REGISTRATION: 'ClosedRegistration',
    CLOSEDREGISTRATION: 'ClosedRegistration',
    ONGOING: 'Ongoing',
    FINISHED: 'Finished',
    OWNER: 'Owner',
    JOCKEY: 'Jockey',
    ADMIN: 'Admin',
    REFEREE: 'Referee',
    SPECTATOR: 'Spectator',
    MALE: 'Đực',
    FEMALE: 'Cái',
    BEGINNER: 'Mới bắt đầu',
    INTERMEDIATE: 'Trung cấp',
    PROFESSIONAL: 'Chuyên nghiệp',
    ELITE: 'Tinh anh',
    ALL: 'ALL'
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
        age: '',
        weight: '',
        colour: '',
        sex: 'MALE',
        breeding: '',
        trainer: '',
        healthCertificateExpiryDate: '',
        officialHorseProfileUrl: '',
        horseCertificateImages: []
    };
}

function cloneImages(images) {
  return Array.isArray(images)
    ? images.map((image) => ({
        name: image.name || '',
        type: image.type || '',
        size: image.size || 0,
        dataUrl: image.dataUrl || image.url || ''
      }))
    : [];
}

export function toHorsePayload(formValues) {
  const horseName = String(formValues.horseName ?? '').trim();
  const horseCertificateImages = Array.isArray(formValues.horseCertificateImages)
    ? formValues.horseCertificateImages.map((image) => ({ ...image }))
    : [];

  return {
    horseName,
    age: Number(formValues.age),
    weight: Number(formValues.weight),
    colour: String(formValues.colour ?? '').trim() || null,
    sex: formValues.sex || null,
    breeding: String(formValues.breeding ?? '').trim() || null,
    trainer: String(formValues.trainer ?? '').trim() || null,
    healthCertificateExpiryDate: formValues.healthCertificateExpiryDate || null,
    horseCertificateImages,
    officialHorseProfileUrl: String(formValues.officialHorseProfileUrl ?? '').trim() || null
  };
}
