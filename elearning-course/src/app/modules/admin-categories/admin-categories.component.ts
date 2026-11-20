import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCategoriesService } from './admin-categories.service';
import { NzPaginationComponent } from 'ng-zorro-antd/pagination';
import { NzSelectComponent } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, NzPaginationComponent, NzSelectComponent],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.css',
})
export class AdminCategoriesComponent implements OnInit {
  readonly categories = signal<any[]>([]);
  readonly error = signal('');
  readonly modalOpen = signal(false);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [5, 10, 15, 20].map((value) => ({
    label: String(value),
    value,
  }));
  keyword = '';
  statusFilter = '';
  editingId = '';
  form = this.emptyForm();
  constructor(private readonly service: AdminCategoriesService) {}
  ngOnInit(): void {
    this.load();
  }
  private emptyForm() {
    return { name: '', description: '', status: true };
  }
  load(): void {
    this.service
      .list(this.keyword, this.statusFilter, this.page(), this.pageSize())
      .subscribe({
        next: (res) => {
          // Accept both response shapes while older backend instances are still running.
          const payload = res?.data ? res : res?.result;
          this.categories.set(payload?.data ?? []);
          this.total.set(
            payload?.pagination?.total ?? (payload?.data ?? []).length,
          );
          if (payload?.pagination?.page) this.page.set(payload.pagination.page);
          this.error.set('');
        },
        error: (err) =>
          this.error.set(err?.error?.message ?? 'Không tải được danh mục.'),
      });
  }
  search(): void {
    this.page.set(1);
    this.load();
  }
  pageChange(page: number): void {
    this.page.set(page);
    this.load();
  }
  pageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
    this.load();
  }
  create(): void {
    this.editingId = '';
    this.form = this.emptyForm();
    this.modalOpen.set(true);
  }
  edit(item: any): void {
    this.editingId = item._id;
    this.form = {
      name: item.name,
      description: item.description ?? '',
      status: item.status,
    };
    this.modalOpen.set(true);
  }
  close(): void {
    this.modalOpen.set(false);
  }
  save(): void {
    if (!this.form.name.trim()) {
      this.error.set('Tên danh mục không được để trống.');
      return;
    }
    const request = this.editingId
      ? this.service.update(this.editingId, this.form)
      : this.service.create(this.form);
    request.subscribe({
      next: () => {
        this.error.set('');
        this.close();
        this.load();
      },
      error: (err) =>
        this.error.set(err?.error?.message ?? 'Không lưu được danh mục.'),
    });
  }
  toggle(item: any): void {
    this.service.update(item._id, { status: !item.status }).subscribe({
      next: () => this.load(),
      error: (err) =>
        this.error.set(err?.error?.message ?? 'Không đổi được trạng thái.'),
    });
  }
  remove(item: any): void {
    if (!window.confirm(`Xóa danh mục “${item.name}”?`)) return;
    this.service.remove(item._id).subscribe({
      next: () => this.load(),
      error: (err) =>
        this.error.set(err?.error?.message ?? 'Không xóa được danh mục.'),
    });
  }
}
