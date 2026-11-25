import { Component, computed, OnInit, signal } from '@angular/core';
import { StudentLearningService } from '../../../core/services/student-learning.service';
import { Router, RouterLink } from '@angular/router';
import { EnrollmentStatus, normalizeEnrollmentStatus } from '../../../core/utils/enrollment-status.util';

interface StudentCourse {
  id: string;
  title: string;
  category: string;
  instructor: string;
  description: string;
  lessons: number;
  duration: string;
  progress: number;
  color: string;
  icon: string;
  status: 'Đang học' | 'Chưa bắt đầu' | 'Hoàn thành';
  enrollmentStatus: EnrollmentStatus | null;
  level: string;
  price: number;
  popularity: number;
}

@Component({
  selector: 'app-course-student',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './course-student.component.html',
  styleUrl: './course-student.component.css',
})
export class CourseStudentComponent implements OnInit {
  readonly searchText = signal('');
  readonly activeCategory = signal('Tất cả');
  readonly activeLevel = signal('Tất cả');
  readonly sortBy = signal('popular');
  readonly showingMine = signal(false);

  readonly categories = computed(() => ['Tất cả', ...new Set(this.courses().map((course) => course.category))]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly enrolling = signal('');

  constructor(private readonly learningService: StudentLearningService, private readonly router: Router) {}

  ngOnInit(): void {
    this.learningService.getCatalog().subscribe({
      next: ({ data }) => {
        this.courses.set(data.map((course) => {
          const enrollmentStatus = normalizeEnrollmentStatus(course.enrollmentStatus);
          const status = enrollmentStatus === 'completed'
            ? 'Hoàn thành'
            : enrollmentStatus === 'active'
              ? 'Đang học'
              : 'Chưa bắt đầu';
          return {
            id: course._id,
            title: course.courseName,
            category: course.category || 'Khác',
            instructor: course.teacherName || 'Chưa cập nhật',
            description: `${course.courseCode}${course.duration ? ` · ${course.duration} giờ` : ''}`,
            lessons: course.lessonCount ?? 0,
            duration: course.duration ? `${course.duration} giờ` : 'Theo chương trình',
            progress: course.progress ?? 0,
            enrollmentStatus,
            level: course.level ?? 'beginner',
            price: course.price ?? 0,
            popularity: course.enrolledCount ?? 0,
            color: 'blue',
            icon: 'E',
            status,
          };
        }));
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'Không tải được danh sách khóa học.');
        this.loading.set(false);
      },
    });
  }

  enroll(course: StudentCourse): void {
    const courseId = course.id;
    this.enrolling.set(courseId);
    this.learningService.enroll(courseId).subscribe({
      next: () => { this.enrolling.set(''); void this.router.navigate(['/student/learn', courseId]); },
      error: (error) => { this.error.set(error?.error?.message ?? 'Đăng ký khóa học thất bại.'); this.enrolling.set(''); },
    });
  }

  // Danh mục khóa học do trung tâm công bố.
  readonly courses = signal<StudentCourse[]>([]);

  readonly filteredCourses = computed(() => {
    const keyword = this.searchText().trim().toLocaleLowerCase('vi');
    const category = this.activeCategory();
    const filtered = this.courses().filter((course) => {
      const matchesCategory = category === 'Tất cả' || course.category === category;
      const matchesLevel = this.activeLevel() === 'Tất cả' || course.level === this.activeLevel();
      const matchesMine = !this.showingMine() || !!course.enrollmentStatus;
      const matchesSearch = !keyword ||
        `${course.title} ${course.instructor} ${course.category}`.toLocaleLowerCase('vi').includes(keyword);
      return matchesCategory && matchesLevel && matchesMine && matchesSearch;
    });
    return [...filtered].sort((a,b) => this.sortBy() === 'price-asc' ? a.price-b.price : this.sortBy() === 'price-desc' ? b.price-a.price : b.popularity-a.popularity);
  });

  readonly inProgressCount = computed(() => this.courses().filter((course) => course.progress > 0).length);
  readonly registeredCount = computed(() => this.courses().filter((course) => !!course.enrollmentStatus).length);
  readonly completedCount = computed(() => this.courses().filter((course) => course.enrollmentStatus === 'completed').length);

  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }
}
