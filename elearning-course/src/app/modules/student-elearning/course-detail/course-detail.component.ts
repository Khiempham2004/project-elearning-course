import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseCurriculumSection, CourseDetailData, LearningCourse, StudentLearningService } from '../../../core/services/student-learning.service';
import { CourseInfoComponent } from '../course-info/course-info.component';
import { CourseCurriculumComponent } from '../course-curriculum/course-curriculum.component';

@Component({
  selector: 'app-course-detail-page',
  standalone: true,
  imports: [RouterLink, CourseInfoComponent, CourseCurriculumComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css',
})
export class CourseDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly course = signal<LearningCourse | null>(null);
  readonly curriculum = signal<CourseCurriculumSection[]>([]);
  readonly enrollment = signal<CourseDetailData['enrollment']>(null);
  readonly approved = signal(false);
  readonly counts = signal<CourseDetailData['counts']>({ sections: 0, lessons: 0, durationMinutes: 0 });
  readonly enrolling = signal(false);
  readonly notice = signal('');

  constructor(private readonly route: ActivatedRoute, private readonly api: StudentLearningService, private readonly router: Router) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (!courseId) { this.error.set('Không tìm thấy mã khóa học.'); this.loading.set(false); return; }
    this.api.getCourseDetail(courseId).subscribe({
      next: ({ data }) => {
        this.course.set(data.course);
        this.curriculum.set(data.curriculum ?? []);
        this.enrollment.set(data.enrollment);
        this.approved.set(data.approved);
        this.counts.set(data.counts);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.status === 404 ? 'Khóa học không tồn tại.' : error?.error?.message ?? 'Không tải được thông tin khóa học.');
        this.loading.set(false);
      },
    });
  }

  levelLabel(level?: string): string { return ({ beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao' } as Record<string, string>)[level ?? ''] ?? 'Mọi cấp độ'; }
  formatDuration(minutes: number): string { if (!minutes) return 'Chưa cập nhật'; return minutes >= 60 ? `${Math.floor(minutes / 60)} giờ${minutes % 60 ? ` ${minutes % 60} phút` : ''}` : `${minutes} phút`; }

  enroll(): void {
    const course = this.course();
    if (!course || !this.approved()) return;
    this.error.set(''); this.notice.set(''); this.enrolling.set(true);
    this.api.enroll(course._id).subscribe({
      next: () => { this.enrolling.set(false); void this.router.navigate(['/student/learn', course._id]); },
      error: (error) => { this.error.set(error?.error?.message ?? 'Đăng ký thất bại.'); this.enrolling.set(false); },
    });
  }
}
