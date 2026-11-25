// Loại nội dung bài học
export type LessonContentType = 'text' | 'video' | 'pdf';

// Model bài học
export interface Lesson {
  _id: string;
  courseId: string;
  sectionId?: string | null;
  section: string;
  title: string;
  contentType: LessonContentType;
  durationMinutes: number;
  textContent?: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Request tạo bài học
export interface CreateLessonRequest {
  section?: string;
  title: string;
  contentType: LessonContentType;
  durationMinutes?: number;
  textContent?: string;
  videoUrl?: string;
  pdfUrl?: string;
  order?: number;
}

// Request cập nhật bài học
export type UpdateLessonRequest = Partial<CreateLessonRequest>;

// Phân trang
export interface LessonPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Response danh sách bài học
export interface LessonListResult {
  data: Lesson[];
  pagination: LessonPagination;
}

export interface LessonListResponse {
  result: LessonListResult;
}

// Response tạo/cập nhật bài học
export interface LessonSaveResponse {
  data: Lesson;
  message: string;
}

// Response xóa bài học
export interface LessonDeleteResponse {
  message: string;
}