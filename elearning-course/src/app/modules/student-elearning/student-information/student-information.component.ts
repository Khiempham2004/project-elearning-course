import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-information',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './student-information.component.html',
  styleUrl: './student-information.component.css',
})
export class StudentInformationComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly avatarUrl = signal('');

  readonly form: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
  ) {
    this.form = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (response) => {
        const user = response?.user ?? response?.data?.user;
        if (!user) {
          this.errorMessage.set('Không nhận được thông tin hồ sơ từ máy chủ.');
          this.loading.set(false);
          return;
        }
        this.form.patchValue({ userName: user.userName ?? '', email: user.email ?? '' });
        this.avatarUrl.set(user.avatarUrl ?? '');
        localStorage.setItem('user', JSON.stringify(user));
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message ?? 'Không tải được thông tin cá nhân.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentPassword = this.form.controls['currentPassword'].value as string;
    const newPassword = this.form.controls['newPassword'].value as string;
    if (newPassword && !currentPassword) {
      this.form.controls['currentPassword'].markAsTouched();
      this.errorMessage.set('Nhập mật khẩu hiện tại để xác nhận đổi mật khẩu.');
      return;
    }

    this.saving.set(true);
    const payload = {
      userName: this.form.controls['userName'].value!.trim(),
      email: this.form.controls['email'].value!.trim(),
      avatarUrl: this.avatarUrl(),
      ...(newPassword ? { currentPassword, newPassword } : {}),
    };
    this.authService.updateProfile(payload).subscribe({
      next: (response) => {
        const updatedUser = response?.user ?? response?.data?.user;
        if (updatedUser) {
          this.avatarUrl.set(updatedUser.avatarUrl ?? this.avatarUrl());
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        this.form.patchValue({ currentPassword: '', newPassword: '' });
        this.successMessage.set(response?.message ?? 'Đã cập nhật thông tin cá nhân.');
        this.saving.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message ?? 'Cập nhật thông tin thất bại.');
        this.saving.set(false);
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 4_000_000) {
      this.errorMessage.set('Chọn tệp ảnh hợp lệ có dung lượng tối đa 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.avatarUrl.set(String(reader.result ?? ''));
    reader.onerror = () => this.errorMessage.set('Không đọc được ảnh đại diện.');
    reader.readAsDataURL(file);
  }
}
