import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

export const roleGuard = (role: UserRole): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (auth.hasRole(role)) return true;
  inject(Router).navigate(['/sessions']);
  return false;
};

export const adminOrCoachGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdminOrCoach()) return true;
  inject(Router).navigate(['/sessions']);
  return false;
};
