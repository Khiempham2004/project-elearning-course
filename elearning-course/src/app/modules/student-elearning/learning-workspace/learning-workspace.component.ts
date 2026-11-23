import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CourseLesson,
  StudentLearningService,
} from '../../../core/services/student-learning.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-learning-workspace',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './learning-workspace.component.html',
  styleUrl: './learning-workspace.component.css',
})
export class LearningWorkspaceComponent implements OnInit {
  private message = inject(NzMessageService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly lessons = signal<CourseLesson[]>([]);
  readonly enrollment = signal<any>(null);
  readonly selected = signal<CourseLesson | null>(null);
  readonly saving = signal(false);
  readonly courseComplete = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: StudentLearningService,
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (!courseId) {
      this.error.set('Không tìm thấy mã khóa học.');
      this.loading.set(false);
      return;
    }

    this.api.getCourseLessons(courseId).subscribe({
      next: ({ data }) => {
        this.lessons.set(data.lessons);
        this.enrollment.set(data.enrollment);
        this.courseComplete.set(
          data.enrollment?.status === 'completed' ||
            data.enrollment?.progress >= 100,
        );
        const lastLessonId = data.enrollment?.lastLessonId;
        const lastLesson = data.lessons.find(
          (lesson) => lesson._id === lastLessonId,
        );
        const lesson = lastLesson ?? data.lessons[0] ?? null;
        this.selected.set(lesson);
        if (lesson && data.enrollment) {
          this.rememberLesson(data.enrollment._id, lesson._id);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'Không tải được bài học.');
        this.loading.set(false);
      },
    });
  }

  index(): number {
    return this.lessons().findIndex(
      (lesson) => lesson._id === this.selected()?._id,
    );
  }

  select(lesson: CourseLesson): void {
    if (!this.canAccessLesson(lesson)) {
      this.message.warning(
        'Bạn cần hoàn thành bài học trước đó để mở khóa bài học tiếp theo!',
      );
      return;
    }
    this.selected.set(lesson);
    const enrollment = this.enrollment();
    if (enrollment) this.rememberLesson(enrollment._id, lesson._id);
  }

  move(offset: number): void {
    const lesson = this.lessons()[this.index() + offset];
    this.select(lesson);
  }

  isDone(lesson: CourseLesson | null): boolean {
    return (
      !!lesson &&
      !!this.enrollment()?.completedLessonIds?.some(
        (id: string) => String(id) === lesson._id,
      )
    );
  }

  complete(): void {
    const lesson = this.selected();
    const enrollment = this.enrollment();
    if (!lesson || !enrollment) return;

    this.saving.set(true);
    this.api.completeLesson(enrollment._id, lesson._id).subscribe({
      next: ({ data }) => {
        this.enrollment.set(data);
        this.saving.set(false);
        if (data?.status === 'completed' || data?.progress >= 100) {
          this.courseComplete.set(true);
        } else {
          this.move(1);
        }
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'Không lưu được tiến độ.');
        this.saving.set(false);
      },
    });
  }

  private rememberLesson(enrollmentId: string, lessonId: string): void {
    this.api.rememberLesson(enrollmentId, lessonId).subscribe({
      next: ({ data }) => this.enrollment.set(data),
      error: (error) => {
        this.error.set(
          error?.error?.message ?? 'Không lưu được bài học gần nhất.',
        );
      },
    });
  }

  canAccessLesson(lesson: CourseLesson): boolean {
    const lessons = this.lessons();
    const currentIndex = lessons.findIndex((item) => item._id === lesson._id);
    if (currentIndex === -1) return false;
    // Bài đầu tiên luôn được phép học
    if (currentIndex === 0) return true;
    // Phải hoàn thành bài học ngay trước đó
    const previousLesson = lessons[currentIndex - 1];

    return this.isDone(previousLesson);
  }
}
