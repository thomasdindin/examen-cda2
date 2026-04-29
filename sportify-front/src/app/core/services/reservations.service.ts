import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Reservation } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/reservations`;

  getMine() {
    return this.http.get<Reservation[]>(`${this.api}/me`);
  }

  cancel(id: string) {
    return this.http.delete<Reservation>(`${this.api}/${id}`);
  }
}
