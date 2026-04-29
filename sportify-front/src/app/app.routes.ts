import { Routes } from '@angular/router';
import { authGuard, roleGuard, adminOrCoachGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./features/sessions/sessions-list/sessions-list.component').then(
        (m) => m.SessionsListComponent,
      ),
  },
  {
    path: 'my-reservations',
    canActivate: [roleGuard('CLIENT')],
    loadComponent: () =>
      import('./features/reservations/my-reservations/my-reservations.component').then(
        (m) => m.MyReservationsComponent,
      ),
  },
  {
    path: 'my-sessions',
    canActivate: [adminOrCoachGuard],
    loadComponent: () =>
      import('./features/sessions/my-sessions/my-sessions.component').then(
        (m) => m.MySessionsComponent,
      ),
  },
  {
    path: 'sessions/new',
    canActivate: [adminOrCoachGuard],
    loadComponent: () =>
      import('./features/sessions/session-form/session-form.component').then(
        (m) => m.SessionFormComponent,
      ),
  },
  {
    path: 'sessions/:id/edit',
    canActivate: [adminOrCoachGuard],
    loadComponent: () =>
      import('./features/sessions/session-form/session-form.component').then(
        (m) => m.SessionFormComponent,
      ),
  },
  {
    path: 'sessions/:id/participants',
    canActivate: [adminOrCoachGuard],
    loadComponent: () =>
      import('./features/sessions/session-participants/session-participants.component').then(
        (m) => m.SessionParticipantsComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users-list/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./features/admin/sessions-overview/sessions-overview.component').then(
            (m) => m.SessionsOverviewComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
