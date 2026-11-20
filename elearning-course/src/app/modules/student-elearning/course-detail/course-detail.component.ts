import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CourseLesson,
  LearningCourse,
  StudentLearningService,
} from '../../../core/services/student-learning.service';
import { formatVnd } from '../../../core/utils/format-currency.util';
import { StudentLearningStore } from '../../../core/store/student-learning.store';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css',
})
export class CourseDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly course = signal<LearningCourse | null>(null);
  readonly lessons = signal<CourseLesson[]>([]);
  readonly enrollment = signal<any>(null);
  readonly enrolling = signal(false);
  readonly notice = signal('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: StudentLearningService,
    private readonly learningStore: StudentLearningStore,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (!courseId) {
      this.error.set('Không tìm thấy mã khóa học.');
      this.loading.set(false);
      return;
    }

    this.learningStore.loadCatalog().subscribe({
      next: ({ data }) => {
        this.course.set(data.find((course) => course._id === courseId) ?? null);
        this.api.getCourseLessons(courseId).subscribe({
          next: ({ data: detail }) => {
            this.lessons.set(detail.lessons);
            this.enrollment.set(detail.enrollment);
            this.loading.set(false);
          },
          error: (error) => {
            this.error.set(
              error?.error?.message ?? 'Không tải được chương trình học.',
            );
            this.loading.set(false);
          },
        });
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'Không tải được khóa học.');
        this.loading.set(false);
      },
    });
  }

  levelLabel(level?: string): string {
    const labels: Record<string, string> = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao',
    };
    return labels[level ?? ''] ?? 'Mọi cấp độ';
  }

  formatPrice(price: number): string {
    return formatVnd(price);
  }

  enroll(): void {
    const course = this.course();
    if (!course || course.price) {
      this.error.set('Khóa học có phí chưa được kết nối cổng thanh toán.');
      return;
    }

    this.enrolling.set(true);
    this.api.enroll(course._id).subscribe({
      next: ( data ) => {
        this.enrolling.set(false);
        this.enrollment.set(data);
        if (this.lessons().length) {
          void this.router.navigate(['/student/learn', course._id]);
        } else {
          this.notice.set('Đăng ký thành công. Giảng viên chưa đăng bài học cho khóa này.');
        }
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'Đăng ký thất bại.');
        this.enrolling.set(false);
      },
    });
  }
}
