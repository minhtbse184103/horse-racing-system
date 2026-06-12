import defaultHorseImage from '../assets/default-horse.svg';
export function formatNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('en-US') : '0';
}
export function formatDate(value) {
    if (!value)
        return 'Not updated';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime()))
        return String(value);
    return date.toLocaleDateString('en-US');
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
        imgUrl: ''
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
        imgUrl: formValues.imgUrl || null
    };
}
