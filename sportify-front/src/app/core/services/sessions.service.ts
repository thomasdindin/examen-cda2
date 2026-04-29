import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Session, CreateSessionDto, SessionSearchParams, PaginatedSessions } from '../models/session.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/sessions`;

  getAll(params?: SessionSearchParams) {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.coachId) httpParams = httpParams.set('coachId', params.coachId);
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    if (params?.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<PaginatedSessions>(this.api, { params: httpParams });
  }

  getOne(id: string) {
    return this.http.get<Session>(`${this.api}/${id}`);
  }

  create(data: CreateSessionDto) {
    return this.http.post<Session>(this.api, data);
  }

  update(id: string, data: Partial<CreateSessionDto>) {
    return this.http.patch<Session>(`${this.api}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }

  reserve(sessionId: string) {
    return this.http.post(`${this.api}/${sessionId}/reservations`, {});
  }

  getParticipants(id: string) {
    return this.http.get<User[]>(`${this.api}/${id}/participants`);
  }
}
