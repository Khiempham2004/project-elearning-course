import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Course, CourseCategory, CourseListResponse, CourseReviewRequest, CourseReviewResponse, CreateCourseRequest, UpdateCourseRequest } from '../../models/course.model';
import { CreateLessonRequest, Lesson, LessonDeleteResponse, LessonListResponse, LessonSaveResponse, UpdateLessonRequest } from '../../models/lesson.model';

@Injectable({
  providedIn: 'root',
})
export class CorusesService {
  constructor(private http: HttpClient) {}
  private readonly apiCourse = 'http://localhost:3001/api/course';

  getAllCourses(
    keyword: string = '',
    page: number = 1,
    pageSize: number = 10,
  ): Observable<CourseListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
    if (keyword.trim()) {
      params = params.set('q', keyword.trim());
    }
    return this.http.get<CourseListResponse>(this.apiCourse, { params });
  }

  getCourseById(id: any): Observable<Course> {
    return this.http.get<Course>(`${this.apiCourse}/${id}`);
  }

  createCourse(data: CreateCourseRequest): Observable<Course[]> {
    return this.http.post<Course[]>(this.apiCourse, data);
  }

  putCourse(id: string, data: UpdateCourseRequest): Observable<Course> {
    return this.http.put<Course>(`${this.apiCourse}/${id}`, data);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiCourse}/${id}`);
  }

  reviewCourse(
    id: string,
    approvalStatus: 'approved' | 'rejected',
  ): Observable<CourseReviewResponse> {
    const payload :CourseReviewRequest = {
      approvalStatus,
    };
    return this.http.patch<CourseReviewResponse>(`${this.apiCourse}/${id}/review`, payload);
  }

  getCategories(): Observable<CourseCategory[]> {
    return this.http.get<CourseCategory[]>(`${this.apiCourse}/categories?activeOnly=true`);
  }

  getLessons(courseId: string ,page : number = 1 , limit : number = 10): Observable<LessonListResponse> {
    return this.http.get<LessonListResponse>(`${this.apiCourse}/${courseId}/lessons` , {
      params : {
        page : page.toString(),
        limit : limit.toString()
      }
    })
  }
  createLesson(courseId: string, payload: CreateLessonRequest): Observable<LessonSaveResponse> {
    return this.http.post<LessonSaveResponse>(
      `${this.apiCourse}/${courseId}/lessons`,
      payload,
    );
  }
  updateLesson(
    courseId: string,
    lessonId: string,
    payload: UpdateLessonRequest,
  ): Observable<LessonSaveResponse> {
    return this.http.put<LessonSaveResponse>(
      `${this.apiCourse}/${courseId}/lessons/${lessonId}`,
      payload,
    );
  }
  deleteLesson(courseId: string, lessonId: string): Observable<LessonDeleteResponse> {
    return this.http.delete<LessonDeleteResponse>(
      `${this.apiCourse}/${courseId}/lessons/${lessonId}`,
    );
  }
}
