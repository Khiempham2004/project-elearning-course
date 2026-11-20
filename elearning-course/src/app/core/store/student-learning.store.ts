import { Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { ApiResponse } from '../types/api-response';
import { LearningCourse, StudentLearningService } from '../services/student-learning.service';

@Injectable({ providedIn: 'root' })
export class StudentLearningStore {
  readonly catalog = signal<LearningCourse[]>([]);
  readonly catalogLoading = signal(false);

  constructor(private readonly api: StudentLearningService) {}

  loadCatalog(): Observable<ApiResponse<LearningCourse[]>> {
    this.catalogLoading.set(true);
    return this.api.getCatalog().pipe(
      tap(({ data }) => this.catalog.set(data)),
      finalize(() => this.catalogLoading.set(false)),
    );
  }
}
