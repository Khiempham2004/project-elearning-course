import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../types/api-response';
import { EnrollmentStatus } from '../utils/enrollment-status.util';

export interface LearningCourse {
  _id: string;
  courseCode: string;
  courseName: string;
  category?: string;
  categoryId?: { _id: string; name: string } | null;
  teacherName?: string;
  teacherProfileId?: { _id: string; fullName: string } | null;
  duration?: number;
  price?: number;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  enrollmentStatus?: EnrollmentStatus | 'NotStarted' | 'InProgress' | 'Completed' | null;
  progress?: number;
  enrolledCount?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  thumbnail?: string;
  lessonCount?: number;
  learningOutcomes?: string[];
  prerequisites?: string[];
}

export interface CourseLesson {
  _id: string;
  section?: string;
  title: string;
  contentType: 'text' | 'video' | 'pdf' | 'quiz';
  textContent?: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  durationMinutes?: number;
}
export interface CourseCurriculumSection {
  _id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
}
export interface CourseDetailData {
  course: LearningCourse;
  approved: boolean;
  enrollment: { _id: string; status: string; progress: number } | null;
  curriculum: CourseCurriculumSection[];
  counts: { sections: number; lessons: number; durationMinutes: number };
}

export interface LearningActivity {
  _id: string;
  kind: 'schedule' | 'assignment' | 'exam';
  title: string;
  description?: string;
  startsAt?: string | null;
  dueAt?: string | null;
  durationMinutes?: number | null;
  passingScore?: number;
  questions?: Array<{
    prompt: string;
    options: string[];
    correctAnswer?: number;
  }>;
  location?: string;
  meetingUrl?: string;
  status?: 'published' | 'draft';
  courseId: LearningCourse;
  submission?: {
    answer: string;
    submittedAt: string;
    score?: number;
    feedback?: string;
    attempts?: Array<{
      answer: string;
      submittedAt: string;
      score?: number;
      feedback?: string;
    }>;
  } | null;
  submissions?: Array<{
    studentId: { _id: string; userName: string; email: string } | string;
    answer: string;
    submittedAt: string;
    score?: number;
    feedback?: string;
  }>;
}

export interface MyLearning {
  student: { id: string; userName: string; email: string };
  enrollments: Array<{
    _id: string;
    status: string;
    progress: number;
    completedLessons: number;
    courseId: LearningCourse;
  }>;
  activities: LearningActivity[];
}

export interface ManagedEnrollment {
  _id: string;
  status: string;
  progress: number;
  completedLessons: number;
  studentId: { _id: string; userName: string; email: string } | string;
  courseId: LearningCourse;
}

export interface LearningActivityPayload {
  courseId: string;
  kind: LearningActivity['kind'];
  title: string;
  description?: string;
  startsAt?: string | null;
  dueAt?: string | null;
  durationMinutes?: number | null;
  passingScore?: number;
  questions?: Array<{
    prompt: string;
    options: string[];
    correctAnswer: number;
  }>;
  location?: string;
  meetingUrl?: string;
  status?: 'published' | 'draft';
}

@Injectable({ providedIn: 'root' })
export class StudentLearningService {
  private readonly api = 'http://localhost:3001/api/student-learning';
  constructor(private readonly http: HttpClient) {}

  getMyLearning(): Observable<ApiResponse<MyLearning>> {
    return this.http.get<ApiResponse<MyLearning>>(`${this.api}/me`);
  }

  getCatalog(): Observable<ApiResponse<LearningCourse[]>> {
    return this.http.get<ApiResponse<LearningCourse[]>>(`${this.api}/catalog`);
  }

  getCourseDetail(courseId: string): Observable<ApiResponse<CourseDetailData>> {
    return this.http.get<ApiResponse<CourseDetailData>>(
      `${this.api}/courses/${courseId}/detail`,
    );
  }

  getCourseLessons(
    courseId: string,
  ): Observable<ApiResponse<{ enrollment: any; lessons: CourseLesson[] }>> {
    return this.http.get<
      ApiResponse<{ enrollment: any; lessons: CourseLesson[] }>
    >(`${this.api}/courses/${courseId}/lessons`);
  }

  completeLesson(
    enrollmentId: string,
    lessonId: string,
  ): Observable<{ data: any; message: string }> {
    return this.http.post<{ data: any; message: string }>(
      `${this.api}/enrollments/${enrollmentId}/lessons/${lessonId}/complete`,
      {},
    );
  }

  rememberLesson(
    enrollmentId: string,
    lessonId: string,
  ): Observable<{ data: any }> {
    return this.http.post<{ data: any }>(
      `${this.api}/enrollments/${enrollmentId}/lessons/${lessonId}/view`,
      {},
    );
  }

  enroll(courseId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.api}/enroll/${courseId}`,
      {},
    );
  }

  submit(activityId: string, answer: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.api}/activities/${activityId}/submit`,
      { answer },
    );
  }

  getManageActivities(): Observable<{
    data: {
      stats: {
        courseCount: number;
        approvedCourseCount: number;
        studentCount: number;
        lessonCount: number;
        scheduleCount: number;
        assignmentCount: number;
        quizCount: number;
      };
      activities: LearningActivity[];
      courses: LearningCourse[];
      enrollments: ManagedEnrollment[];
    };
  }> {
    return this.http.get<{
      data: {
        stats: {
          courseCount: number;
          approvedCourseCount: number;
          studentCount: number;
          lessonCount: number;
          scheduleCount: number;
          assignmentCount: number;
          quizCount: number;
        };
        activities: LearningActivity[];
        courses: LearningCourse[];
        enrollments: ManagedEnrollment[];
      };
    }>(`${this.api}/activities/manage`);
  }

  createActivity(
    activity: LearningActivityPayload,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.api}/activities`,
      activity,
    );
  }

  updateActivity(
    activityId: string,
    activity: LearningActivityPayload,
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.api}/activities/${activityId}`,
      activity,
    );
  }

  deleteActivity(activityId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.api}/activities/${activityId}`,
    );
  }

  grade(
    activityId: string,
    studentId: string,
    score: number,
    feedback: string,
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.api}/activities/${activityId}/submissions/${studentId}/grade`,
      { score, feedback },
    );
  }

  updateProgress(
    enrollmentId: string,
    progress: number,
    completedLessons: number,
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.api}/enrollments/${enrollmentId}/progress`,
      { progress, completedLessons },
    );
  }
}
