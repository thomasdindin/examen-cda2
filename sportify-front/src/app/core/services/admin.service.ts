import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { Session } from '../models/session.model';
import { Reservation } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin`;

  getUsers() {
    return this.http.get<User[]>(`${this.api}/users`);
  }

  updateUser(id: string, data: { role?: UserRole; enabled?: boolean }) {
    return this.http.patch<User>(`${this.api}/users/${id}`, data);
  }

  getSessions() {
    return this.http.get<Session[]>(`${this.api}/sessions`);
  }

  getReservations() {
    return this.http.get<Reservation[]>(`${this.api}/reservations`);
  }
}
