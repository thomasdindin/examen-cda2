import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar" role="banner">
      <a [routerLink]="isLoggedIn() ? '/dashboard' : '/'" class="brand" aria-label="Sportify Pro accueil" (click)="closeMenu()">
        <svg class="brand-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="sp-bg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#2a0d1a"/>
              <stop offset="100%" stop-color="#0e0a0c"/>
            </linearGradient>
          </defs>
          <rect width="28" height="28" rx="7" fill="url(#sp-bg)"/>
          <path d="M17 4L8 16L13 16L11 24L20 12L14 12Z" fill="#e11d48"/>
          <path d="M17 4L8 16L10 16Z" fill="#f43f5e" opacity="0.4"/>
        </svg>
        <span class="brand-name">SPORTIFY</span>
        <span class="brand-pro">PRO</span>
      </a>

      <button
        class="menu-toggle"
        type="button"
        aria-label="Ouvrir la navigation"
        aria-controls="main-navigation"
        [attr.aria-expanded]="isMenuOpen()"
        (click)="toggleMenu()"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>

      <div id="main-navigation" class="nav-panel" [class.nav-panel--open]="isMenuOpen()">
        <nav class="nav-links" role="navigation" aria-label="Navigation principale">
          @if (isLoggedIn()) {
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Dashboard</a>
          }
          <a routerLink="/sessions" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Séances</a>

          @if (isClient()) {
            <a routerLink="/my-reservations" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Mes réservations</a>
          }

          @if (isCoach()) {
            <a routerLink="/my-sessions" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Mes séances</a>
          }

        @if (isAdmin()) {
            <a routerLink="/admin/sessions" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Supervision</a>
          }
        </nav>

        <div class="nav-auth">
          @if (isLoggedIn()) {
            <span class="user-badge">
              <span class="user-role" [attr.data-role]="currentUser()?.role">{{ currentUser()?.role }}</span>
              {{ currentUser()?.firstname }}
            </span>
            <button class="btn-logout" (click)="logout()" type="button" aria-label="Se déconnecter">
              Déconnexion
            </button>
          } @else {
            <a routerLink="/login" class="btn-login" (click)="closeMenu()">Connexion</a>
            <a routerLink="/register" class="btn-register" (click)="closeMenu()">S'inscrire</a>
          }
        </div>
      </div>
    </header>

    <main class="main-content" id="main-content" tabindex="-1" [class.has-texture]="isLoggedIn()">
      <router-outlet />
    </main>
  `,
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.auth.currentUser;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  readonly isCoach = computed(() => this.auth.hasRole('COACH'));
  readonly isClient = computed(() => this.auth.hasRole('CLIENT'));
  readonly isMenuOpen = signal(false);

  toggleMenu() {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.closeMenu();
    this.router.navigate(['/dashboard']);
  }
}
