import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateTeacherRequest, Teacher, TeacherListResponse, UpdateTeacherRequest } from '../../models/teacher.model';

@Injectable({
  providedIn: 'root',
})
export class TeachersService {
  constructor(private http: HttpClient) {}
  private readonly apiTeacher = 'http://localhost:3001/api/teacher';

  getAllTeachers(
    keyword: string = '',
    page: number = 1,
    pageSize: number = 10,
  ): Observable<TeacherListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
    if (keyword.trim()) {
      params = params.set('q', keyword.trim());
    }
    return this.http.get<TeacherListResponse>(this.apiTeacher, { params });
  }

  getTeacherById(id: any): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiTeacher}/${id}`);
  }

  createTeacher(data: CreateTeacherRequest): Observable<Teacher[]> {
    return this.http.post<Teacher[]>(this.apiTeacher, data);
  }

  putTeacher(id: any, data: UpdateTeacherRequest): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.apiTeacher}/${id}`, data);
  }

  deleteTeacher(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiTeacher}/${id}`);
  }
}
