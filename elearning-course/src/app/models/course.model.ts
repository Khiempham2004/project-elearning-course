// Trình độ khóa học
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

// Trạng thái duyệt khóa học
export type CourseApprovalStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected';

// Thông tin khóa học
export interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  category?: string;
  categoryId?: string | null;
  description?: string;
  learningOutcomes?: string[];
  prerequisites?: string[];
  level: CourseLevel;
  thumbnail?: string;
  teacherId: string;
  teacherProfileId?: string | null;
  teacherName?: string;
  duration?: number;
  maxStudents?: number;
  price?: number;
  startDate?: string;
  endDate?: string;
  status: boolean;
  approvalStatus: CourseApprovalStatus;
  createdAt?: string;
  updatedAt?: string;
}

// Dữ liệu tạo khóa học
export interface CreateCourseRequest {
  courseCode: string;
  courseName: string;
  teacherId: string;
  category?: string;
  categoryId?: string | null;
  description?: string;
  learningOutcomes?: string[];
  prerequisites?: string[];
  level?: CourseLevel;
  thumbnail?: string;
  teacherProfileId?: string | null;
  teacherName?: string;
  duration?: number;
  maxStudents?: number;
  price?: number;
  startDate?: string;
  endDate?: string;
  status?: boolean;
  approvalStatus?: CourseApprovalStatus;
}

// Dữ liệu cập nhật khóa học
export type UpdateCourseRequest = Partial<CreateCourseRequest>;

// Dữ liệu duyệt khóa học
export interface CourseReviewRequest {
  approvalStatus: 'approved' | 'rejected';
}

// Thông tin danh mục khóa học
export interface CourseCategory {
  _id: string;
  name: string;
  description?: string;
  status?: boolean;
}

// Tham số tìm kiếm khóa học
export interface CourseQueryParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CourseReviewResponse {
  success?: boolean;
  message: string;
  data?: Course;
}

export interface CoursePagination {
  page: number;
  limit: number;
  totalCourses: number;
  totalPages: number;
}

export interface CourseListResponse {
  success: boolean;
  message: string;
  data: Course[];
  pagination: CoursePagination;
}