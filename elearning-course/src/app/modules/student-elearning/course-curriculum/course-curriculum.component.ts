import { Component, Input, signal } from '@angular/core';
import { CourseCurriculumSection } from '../../../core/services/student-learning.service';

@Component({
  selector: 'app-course-curriculum',
  standalone: true,
  templateUrl: './course-curriculum.component.html',
  styleUrl: './course-curriculum.component.css',
})
export class CourseCurriculumComponent {
  @Input() sections: CourseCurriculumSection[] = [];
  readonly openSections = signal<Set<string>>(new Set());
  get sectionCount(): number {
    return this.sections.length;
  }
  get lessonCount(): number {
    return this.sections.reduce(
      (count, section) => count + section.lessons.length,
      0,
    );
  }
  isOpen(id: string): boolean {
    return this.openSections().has(id);
  }
  toggle(id: string): void {
    const next = new Set(this.openSections());
    next.has(id) ? next.delete(id) : next.add(id);
    this.openSections.set(next);
  }
  typeLabel(type: string): string {
    return (
      (
        {
          video: 'Video',
          text: 'Text',
          pdf: 'Document',
          quiz: 'Quiz',
        } as Record<string, string>
      )[type] ?? 'Text'
    );
  }
  typeIcon(type: string): string {
    return (
      (
        { video: '▶', text: 'Aa', pdf: '▤', quiz: '?' } as Record<
          string,
          string
        >
      )[type] ?? 'Aa'
    );
  }
  formatDuration(minutes?: number): string {
    if (!minutes) return 'Chưa rõ thời lượng';
    return minutes >= 60
      ? `${Math.floor(minutes / 60)} giờ${minutes % 60 ? ` ${minutes % 60} phút` : ''}`
      : `${minutes} phút`;
  }
}
