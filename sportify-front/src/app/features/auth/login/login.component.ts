import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../../../shared/ui/icon/app-icon.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card" role="main">
        <div class="auth-header">
          <app-icon name="zap" class="auth-icon" />
          <h1 class="auth-title">SPORTIFY <span>PRO</span></h1>
          <p class="auth-subtitle">Connexion à votre espace</p>
        </div>

        @if (error()) {
          <div class="alert alert--error" role="alert" aria-live="polite">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              type="email"
              class="form-input"
              formControlName="email"
              placeholder="votre@email.com"
              autocomplete="email"
              [attr.aria-invalid]="isInvalid('email')"
              aria-describedby="email-error"
            />
            @if (isInvalid('email')) {
              <span id="email-error" class="form-error" role="alert">Email invalide</span>
            }
          </div>

          <div class="form-group" style="margin-top: 1rem">
            <label for="password" class="form-label">Mot de passe</label>
            <input
              id="password"
              type="password"
              class="form-input"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
              [attr.aria-invalid]="isInvalid('password')"
              aria-describedby="password-error"
            />
            @if (isInvalid('password')) {
              <span id="password-error" class="form-error" role="alert">Mot de passe requis</span>
            }
          </div>

          <button
            type="submit"
            class="btn btn--primary btn--full"
            style="margin-top: 1.5rem"
            [disabled]="loading()"
            aria-label="Se connecter"
          >
            @if (loading()) { Connexion... } @else { Se connecter }
          </button>
        </form>

        <p class="auth-footer">
          Pas de compte ?
          <a routerLink="/register" class="auth-link">S'inscrire</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isInvalid(field: 'email' | 'password') {
    const ctrl = this.form.get(field);
    return ctrl?.invalid && ctrl.touched;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/sessions']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Email ou mot de passe incorrect.');
        this.loading.set(false);
      },
    });
  }
}
