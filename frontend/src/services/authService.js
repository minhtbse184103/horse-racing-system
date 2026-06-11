import API_BASE_URL from '../configs/apiConfig';
import { httpRequest } from '../api/httpClient';
export function login({ email, password }) {
    return httpRequest('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
        fallbackError: 'Đăng nhập thất bại. Vui lòng thử lại.'
    }).then((data) => {
        if (!data?.token || !data?.user) {
            throw new Error('Đăng nhập thất bại. Hệ thống chưa trả đủ thông tin đăng nhập.');
        }
        return data;
    });
}
export function signup({ email, fullName, phone, password, roleName }) {
    return httpRequest('/api/auth/signup', {
        method: 'POST',
        auth: false,
        body: { email, fullName, phone, password, roleName },
        fallbackError: 'Đăng ký thất bại. Vui lòng thử lại.'
    });
}
export function startGoogleLogin() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}
export function saveAuthSession(loginResponse, rememberMe) {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');
    storage.setItem('token', loginResponse.token);
    storage.setItem('user', JSON.stringify(loginResponse.user));
}
export function getCurrentUser() {
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userJson)
        return null;
    try {
        return JSON.parse(userJson);
    }
    catch {
        return null;
    }
}
export function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
}
export function getMe() {
    return httpRequest('/api/user/me', {
        fallbackError: 'Không thể lấy thông tin user hiện tại.'
    });
}
export function updateStoredUser(user) {
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(user));
}
