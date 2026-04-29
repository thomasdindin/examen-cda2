import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../../../shared/ui/icon/app-icon.component';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card" role="main">
        <div class="auth-header">
          <app-icon name="zap" class="auth-icon" />
          <h1 class="auth-title">SPORTIFY <span>PRO</span></h1>
          <p class="auth-subtitle">Créer un compte CLIENT</p>
        </div>

        @if (error()) {
          <div class="alert alert--error" role="alert" aria-live="polite">{{ error() }}</div>
        }

        @if (success()) {
          <div class="alert alert--success" role="alert" aria-live="polite">
            Compte créé ! <a routerLink="/login" class="auth-link">Se connecter</a>
          </div>
        }

        @if (!success()) {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label for="firstname" class="form-label">Prénom</label>
                <input
                  id="firstname"
                  type="text"
                  class="form-input"
                  formControlName="firstname"
                  placeholder="John"
                  autocomplete="given-name"
                  [attr.aria-invalid]="isInvalid('firstname')"
                />
                @if (isInvalid('firstname')) {
                  <span class="form-error" role="alert">Prénom requis</span>
                }
              </div>

              <div class="form-group">
                <label for="lastname" class="form-label">Nom</label>
                <input
                  id="lastname"
                  type="text"
                  class="form-input"
                  formControlName="lastname"
                  placeholder="Doe"
                  autocomplete="family-name"
                  [attr.aria-invalid]="isInvalid('lastname')"
                />
                @if (isInvalid('lastname')) {
                  <span class="form-error" role="alert">Nom requis</span>
                }
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                type="email"
                class="form-input"
                formControlName="email"
                placeholder="votre@email.com"
                autocomplete="email"
                [attr.aria-invalid]="isInvalid('email')"
              />
              @if (isInvalid('email')) {
                <span class="form-error" role="alert">Email invalide</span>
              }
            </div>

            <div class="form-group" style="margin-top: 1rem">
              <label for="password" class="form-label">Mot de passe</label>
              <input
                id="password"
                type="password"
                class="form-input"
                formControlName="password"
                placeholder="Min. 8 caractères"
                autocomplete="new-password"
                [attr.aria-invalid]="isInvalid('password')"
              />
              @if (isInvalid('password')) {
                <span class="form-error" role="alert">
                  Minimum 8 caractères, une majuscule, un chiffre, un caractère spécial
                </span>
              }
            </div>

            <button
              type="submit"
              class="btn btn--primary btn--full"
              style="margin-top: 1.5rem"
              [disabled]="loading()"
            >
              @if (loading()) { Création... } @else { Créer mon compte }
            </button>
          </form>
        }

        <p class="auth-footer">
          Déjà un compte ?
          <a routerLink="/login" class="auth-link">Se connecter</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/)],
    ],
  });

  isInvalid(field: keyof typeof this.form.controls) {
    const ctrl = this.form.get(field);
    return ctrl?.invalid && ctrl.touched;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Une erreur est survenue.');
        this.loading.set(false);
      },
    });
  }
}
