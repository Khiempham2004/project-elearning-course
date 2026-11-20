import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface EnrollmentResponse {
  result: {
    data: any[];
    pagination: {
      page: number;
      limit: number;
      keyword : string,
      total: number;
      totalPages: number;
    };
  };
}
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly api = 'http://localhost:3001/api/admin/users';
  constructor(private readonly http: HttpClient) {}

  list(page: number, limit: number, keyword: string, role: string, status: string) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (keyword.trim()) params = params.set('q', keyword.trim());
    if (role) params = params.set('role', role);
    if (status) params = params.set('status', status);
    return this.http.get<EnrollmentResponse>(this.api, { 
      params : {
        page,
        limit,
        keyword,
        role,
        status
      } 
    });
  }
  create(payload: any) {
    return this.http.post<any>(this.api, payload);
  }
  update(id: string, payload: any) {
    return this.http.put<any>(`${this.api}/${id}`, payload);
  }
  remove(id: string) {
    return this.http.delete<any>(`${this.api}/${id}`);
  }
}
