import { Component, Input } from '@angular/core';
import { LearningCourse } from '../../../core/services/student-learning.service';

@Component({
  selector: 'app-course-info',
  standalone: true,
  templateUrl: './course-info.component.html',
  styleUrl: './course-info.component.css',
})
export class CourseInfoComponent {
  @Input() course: LearningCourse | null = null;
}
