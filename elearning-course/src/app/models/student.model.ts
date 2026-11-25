export type StudentGender = 'Nam' | 'Nữ';

export interface Student {
  _id: string;
  studentCode: string;
  studentName: string;
  phone: string;
  email: string;
  gender: StudentGender;
  dob: string;
  class: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Dữ liệu gửi lên khi tạo học viên
export interface CreateStudentRequest {
  studentCode: string;
  studentName: string;
  phone: string;
  email: string;
  gender: StudentGender;
  dob: string;
  class: string;
  status?: boolean;
}

// Dữ liệu gửi lên khi cập nhật
export type UpdateStudentRequest = Partial<CreateStudentRequest>;

// Phân trang
export interface StudentPagination {
  page: number;
  limit: number;
  totalStudents: number;
  totalPages: number;
}

// Response danh sách học viên
export interface StudentListResult{
  data: Student[];
  pagination: StudentPagination;
  message: string;
}

// Response chi tiết, tạo và cập nhật
export interface StudentResponse {
  data: Student;
  message: string;
}

// Response xóa học viên
export interface DeleteStudentResponse {
  data: Student;
  message: string;
}

export interface StudentListResponse {
  result: StudentListResult;
}