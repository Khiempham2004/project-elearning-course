import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CorusesService } from '../../../core/services/coruses.service';

interface LessonItem { _id: string; section: string; title: string; contentType: 'text' | 'video' | 'pdf'; textContent?: string; videoUrl?: string; pdfUrl?: string; order: number; }

@Component({
  selector: 'app-teacher-lessons', standalone: true, imports: [FormsModule],
  templateUrl: './teacher-lessons.component.html', styleUrl: './teacher-lessons.component.css',
})
export class TeacherLessonsComponent implements OnInit {
  readonly courses = signal<any[]>([]);
  readonly lessons = signal<LessonItem[]>([]);
  readonly courseId = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  editingId = '';
  form = this.emptyForm();

  constructor(private readonly courseService: CorusesService) {}
  ngOnInit(): void {
    this.courseService.getAllCourses('', 1, 100).subscribe({
      next: (response) => this.courses.set(response?.data ?? []),
      error: (error) => this.error.set(error?.error?.message ?? 'Không tải được khóa học.'),
    });
  }

  private emptyForm() { return { section: 'Chương 1', title: '', contentType: 'text' as 'text' | 'video' | 'pdf', textContent: '', videoUrl: '', pdfUrl: '', order: 0 }; }
  selectCourse(id: string): void { this.courseId.set(id); this.reset(); if (!id) { this.lessons.set([]); return; } this.load(); }
  load(): void {
    if (!this.courseId()) return;
    this.loading.set(true);
    this.courseService.getLessons(this.courseId()).subscribe({
      next: (response) => { this.lessons.set(response?.data ?? []); this.loading.set(false); },
      error: (error) => { this.error.set(error?.error?.message ?? 'Không tải được bài giảng.'); this.loading.set(false); },
    });
  }
  save(): void {
    this.error.set(''); this.notice.set('');
    if (!this.courseId() || !this.form.title.trim()) { this.error.set('Chọn khóa học và nhập tên bài giảng.'); return; }
    if (this.form.contentType === 'video' && !this.form.videoUrl.trim()) { this.error.set('Nhập URL video.'); return; }
    if (this.form.contentType === 'pdf' && !this.form.pdfUrl.trim()) { this.error.set('Nhập URL tài liệu PDF.'); return; }
    const request = this.editingId
      ? this.courseService.updateLesson(this.courseId(), this.editingId, this.form)
      : this.courseService.createLesson(this.courseId(), this.form);
    request.subscribe({ next: (response) => { this.notice.set(response?.message ?? 'Đã lưu bài giảng.'); this.reset(); this.load(); }, error: (error) => this.error.set(error?.error?.message ?? 'Không lưu được bài giảng.') });
  }
  edit(lesson: LessonItem): void { this.editingId = lesson._id; this.form = { section: lesson.section, title: lesson.title, contentType: lesson.contentType, textContent: lesson.textContent ?? '', videoUrl: lesson.videoUrl ?? '', pdfUrl: lesson.pdfUrl ?? '', order: lesson.order ?? 0 }; }
  remove(lesson: LessonItem): void {
    if (!window.confirm(`Xóa bài giảng “${lesson.title}”?`)) return;
    this.courseService.deleteLesson(this.courseId(), lesson._id).subscribe({ next: (response) => { this.notice.set(response?.message ?? 'Đã xóa bài giảng.'); this.load(); }, error: (error) => this.error.set(error?.error?.message ?? 'Không xóa được bài giảng.') });
  }
  move(lesson: LessonItem, delta: number): void {
    const list = [...this.lessons()].sort((a, b) => a.order - b.order);
    const index = list.findIndex((item) => item._id === lesson._id); const other = list[index + delta];
    if (!other || lesson.section !== other.section) return;
    const currentOrder = lesson.order; lesson.order = other.order; other.order = currentOrder;
    this.courseService.updateLesson(this.courseId(), lesson._id, lesson).subscribe({ next: () => this.courseService.updateLesson(this.courseId(), other._id, other).subscribe({ next: () => this.load(), error: (error) => this.error.set(error?.error?.message ?? 'Không sắp xếp được bài giảng.') }), error: (error) => this.error.set(error?.error?.message ?? 'Không sắp xếp được bài giảng.') });
  }
  reset(): void { this.editingId = ''; this.form = this.emptyForm(); }
}
