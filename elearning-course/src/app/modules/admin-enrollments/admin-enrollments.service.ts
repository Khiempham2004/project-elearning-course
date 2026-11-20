import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface EnrollmentResponse {
  result: {
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
@Injectable({ providedIn: 'root' })
export class AdminEnrollmentsService {
  private readonly api = 'http://localhost:3001/api/admin/enrollments';
  constructor(private readonly http: HttpClient) {}
  list(
    page: number,
    limit: number,
    keyword: string,
    courseId: string,
    status: string,
  ) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (keyword.trim()) params = params.set('q', keyword.trim());
    if (courseId) params = params.set('courseId', courseId);
    if (status) params = params.set('status', status);
    return this.http.get<EnrollmentResponse>(this.api, {
      params: {
        page,
        limit,
        q: keyword,
        courseId,
        status,
      },
    });
  }
  update(id: string, payload: any) {
    return this.http.patch<any>(`${this.api}/${id}`, payload);
  }
}
