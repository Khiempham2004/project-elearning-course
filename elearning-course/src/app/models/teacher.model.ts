// Giới tính
export type TeacherGender = 'Nam' | 'Nữ';

// Thông tin tài khoản liên kết (nếu API populate userId)
export interface TeacherAccount {
  _id: string;
  userName: string;
  email: string;
}

// Model giảng viên
export interface Teacher {
  _id: string;
  teacherCode: string;
  userId?: string | TeacherAccount | null;
  fullName: string;
  gender: TeacherGender;
  dateOfBirth: string;
  hometown: string;
  address: string;
  phone: string;
  email: string;
  department: string;
  specialization: string;
  degree: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Dữ liệu tạo giảng viên
export interface CreateTeacherRequest {
  teacherCode: string;
  userId?: string;
  fullName: string;
  gender: TeacherGender;
  dateOfBirth: string;
  hometown: string;
  address: string;
  phone: string;
  email: string;
  department: string;
  specialization: string;
  degree: string;
  status?: boolean;
}

// Dữ liệu cập nhật giảng viên
export type UpdateTeacherRequest = Partial<CreateTeacherRequest>;

// Tham số tìm kiếm và phân trang
export interface TeacherQueryParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// Response danh sách giảng viên có phân trang
export interface TeacherListResponse {
  success: boolean;
  message: string;
  data: Teacher[];
  pagination: {
    page: number;
    limit: number;
    totalTeachers: number;
    totalPages: number;
  };
}
