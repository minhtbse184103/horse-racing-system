import type { ReactNode } from 'react';

export type Id = number | string;

export type UserRole = 'ADMIN' | 'OWNER' | 'JOCKEY' | 'REFEREE' | 'SPECTATOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'BANNED' | string;
export type HorseStatus = 'ACTIVE' | 'INJURED' | 'RETIRED' | 'SUSPENDED' | 'INACTIVE' | string;
export type HorseGender = 'MALE' | 'FEMALE' | 'UNKNOWN' | string;

export interface AuthUser {
  id?: Id;
  Id?: Id;
  userID?: Id;
  userId?: Id;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: UserRole | string;
  roleName?: UserRole | string;
  userRole?: UserRole | string;
  status?: UserStatus;
  authorities?: Array<{ authority?: string }>;
  roles?: Array<{ name?: string } | string>;
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SignupRequest {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  roleName: 'OWNER' | 'JOCKEY' | 'SPECTATOR';
}

export interface AdminUserFormValues {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  roleName: 'OWNER' | 'JOCKEY' | 'REFEREE' | 'SPECTATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface AdminCreateUserRequest {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  roleName: AdminUserFormValues['roleName'];
}

export interface AdminUpdateUserRequest {
  email: string;
  fullName: string;
  phone: string;
  roleName: AdminUserFormValues['roleName'];
  status: AdminUserFormValues['status'];
}

export interface Horse {
  horseId?: Id;
  horseID?: Id;
  id?: Id;
  horseName?: string;
  name?: string; // giữ lại để đọc dữ liệu cũ nếu có
  breed?: string | null;
  gender?: HorseGender | null;
  color?: string | null;
  dayOfBirth?: string | null;
  weight?: number | string | null;
  healthCertExpiry?: string | null;
  status?: HorseStatus | null;
  registrationCount?: number | string | null;
  participated?: boolean;
  [key: string]: unknown;
}

export interface HorseFormValues {
  horseName: string;
  breed: string;
  gender: HorseGender;
  color: string;
  dayOfBirth: string;
  weight: number | string;
  healthCertExpiry: string;
  status: HorseStatus;
}

// Map đúng CreateHorseRequest / UpdateHorseRequest trong BE hiện tại.
// BE nhận horseName, breed, gender, color, dayOfBirth, weight, healthCertExpiry, status.
export interface HorsePayload {
  horseName: string;
  breed: string | null;
  gender: HorseGender | null;
  color: string | null;
  dayOfBirth: string | null;
  weight: number;
  healthCertExpiry: string | null;
  status: HorseStatus | null;
}

export interface OwnerDashboardData {
  ownerId?: Id;
  ownerName?: string;
  totalHorses?: number;
  totalRegistrations?: number;
  registeredHorses?: number;
  participatedHorses?: number;
  [key: string]: unknown;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
}
