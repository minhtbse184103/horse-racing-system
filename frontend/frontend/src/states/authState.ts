// File giữ chỗ cho cấu trúc states/ giống prototype.
// Hiện project đang dùng localStorage/sessionStorage trong services/authService.ts.
export const AUTH_STORAGE_KEYS = {
  token: 'token',
  user: 'user'
} as const;
