import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdminDashboardData,
  DashboardService,
} from '../../../core/services/Dashboard.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class OverviewComponent implements OnInit {
  readonly dashboard = signal<AdminDashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: ({ data }) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'Không tải được dashboard.');
        this.loading.set(false);
      },
    });
  }
  readonly maxStudents = computed(() => {
    const trend = this.dashboard()?.studentTrend ?? [];
    return Math.max(1, ...trend.map((item) => item.count));
  });

  barHeight(value: number): number {
    if (value === 0) {
      return 3;
    }
    return Math.max(8, Math.round((value / this.maxStudents()) * 100));
  }
}
