import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/utils/api-error';

interface DemoAccount {
  label: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
}

/** Reactive-form login. Shows field validation and the API's error message. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../auth.css',
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Bound from the query string thanks to withComponentInputBinding(). */
  readonly returnUrl = input<string>();
  readonly reason = input<string>();

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  protected readonly demoAccounts: DemoAccount[] = [
    { label: 'Ayesha (student)', email: 'ayesha@student.campus.edu', password: 'Student@123', role: 'student' },
    { label: 'Shahzaib (student)', email: 'shahzaib@student.campus.edu', password: 'Student@123', role: 'student' },
    { label: 'Campus Admin', email: 'admin@campus.edu', password: 'Admin@123', role: 'admin' },
    { label: 'IT Admin', email: 'it.admin@campus.edu', password: 'Admin@123', role: 'admin' },
  ];

  protected get email() {
    return this.form.controls.email;
  }

  protected get password() {
    return this.form.controls.password;
  }

  protected fillDemo(account: DemoAccount): void {
    this.form.setValue({ email: account.email, password: account.password });
    this.errorMessage.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.toast.success(`Welcome back, ${user.name}!`);
        const target = this.safeReturnUrl() ?? this.auth.homeUrl();
        void this.router.navigateByUrl(target);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err.message);
        this.submitting.set(false);
      },
    });
  }

  /** Only allow in-app paths and never send an admin to a student page or vice versa. */
  private safeReturnUrl(): string | null {
    const url = this.returnUrl();
    if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/login')) {
      return null;
    }
    if (url.startsWith('/admin') && !this.auth.isAdmin()) return null;
    if ((url.startsWith('/dashboard') || url.startsWith('/requests/new')) && this.auth.isAdmin()) return null;
    return url;
  }
}
