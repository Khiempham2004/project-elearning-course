export type UserRole = 'admin' | 'teacher' | 'student' | 'course' | 'directory';

// Thông tin người dùng
export interface AuthUser {
  id?: string;
  _id?: string;
  userName: string;
  email: string;
  role: UserRole;
  status: boolean;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Request đăng ký
export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

// Request đăng nhập
export interface LoginRequest {
  userName: string;
  password: string;
}

// Response đăng nhập
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// Response lấy profile
export interface ProfileResponse {
  user: AuthUser;
}

// Request cập nhật profile
export interface UpdateProfileRequest {
  userName: string;
  email: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  success?: boolean;
  message?: string;
  user?: AuthUser;
  data?: {
    user?: AuthUser;
  };
}
// Notification
export interface AuthNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}
