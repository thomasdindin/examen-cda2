import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar" role="banner">
      <a routerLink="/dashboard" class="brand" aria-label="Sportify Pro accueil" (click)="closeMenu()">
        <span class="brand-icon" aria-hidden="true">S</span>
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
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Dashboard</a>
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

    <main class="main-content" id="main-content" tabindex="-1">
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
