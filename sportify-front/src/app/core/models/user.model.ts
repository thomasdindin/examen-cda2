export type UserRole = 'ADMIN' | 'COACH' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: UserRole;
}
