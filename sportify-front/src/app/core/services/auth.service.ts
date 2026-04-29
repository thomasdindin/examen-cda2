import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<CurrentUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly role = computed(() => this.currentUser()?.role ?? null);

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  register(data: { firstname: string; lastname: string; email: string; password: string }) {
    return this.http.post<CurrentUser>(`${this.api}/register`, data);
  }

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string; user: CurrentUser }>(`${this.api}/login`, { email, password })
      .pipe(
        tap(({ accessToken, user }) => {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
        }),
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  hasRole(role: 'ADMIN' | 'COACH' | 'CLIENT'): boolean {
    return this.currentUser()?.role === role;
  }

  isAdminOrCoach(): boolean {
    const r = this.currentUser()?.role;
    return r === 'ADMIN' || r === 'COACH';
  }
}
