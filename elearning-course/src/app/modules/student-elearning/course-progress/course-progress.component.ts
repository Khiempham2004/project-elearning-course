import { Component, OnInit, signal } from '@angular/core';
import { MyLearning, StudentLearningService } from '../../../core/services/student-learning.service';
import { normalizeEnrollmentStatus } from '../../../core/utils/enrollment-status.util';

@Component({
  selector: 'app-course-progress',
  standalone: true,
  imports: [],
  templateUrl: './course-progress.component.html',
  styleUrl: './course-progress.component.css'
})
export class CourseProgressComponent implements OnInit {
  readonly learning = signal<MyLearning | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor(private readonly learningService: StudentLearningService) {}
  ngOnInit(): void {
    this.learningService.getMyLearning().subscribe({
      next: ({ data }) => { this.learning.set(data); this.loading.set(false); },
      error: (error) => { this.error.set(error?.error?.message ?? 'Không tải được kết quả học tập.'); this.loading.set(false); },
    });
  }

  statusLabel(status: string): string {
    switch (normalizeEnrollmentStatus(status)) {
      case 'not-started':
        return 'Chưa bắt đầu';
      case 'completed':
        return 'Đã hoàn thành';
      case 'active':
        return 'Đang học';
      default:
        return 'Không xác định';
    }
  }
}
