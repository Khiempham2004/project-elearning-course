import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateStudentRequest, DeleteStudentResponse, Student, StudentListResponse, StudentResponse, UpdateStudentRequest } from '../../models/student.model';
import { StudentLearningService } from './student-learning.service';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  constructor(private http: HttpClient) {}
  private readonly apiStudent = 'http://localhost:3001/api/student';

  getAllStudents(
    keyword: string = '',
    page: number = 1,
    pageSize: number = 10,
  ): Observable<StudentListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
    if (keyword.trim()) {
      params = params.set('q', keyword.trim());
    }
    return this.http.get<StudentListResponse>(this.apiStudent, { params });
  }

  getStudentById(id: any): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.apiStudent}/${id}`);
  }

  createStudent(data: CreateStudentRequest): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(this.apiStudent, data);
  }

  putStudents(id: any, data: UpdateStudentRequest): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.apiStudent}/${id}`, data);
  }

  deleteStudent(id: any): Observable<DeleteStudentResponse> {
    return this.http.delete<DeleteStudentResponse>(`${this.apiStudent}/${id}`);
  }

  getAllClass(): Observable<any> {
    return this.http.get<any[]>(this.apiStudent);
  }
}
