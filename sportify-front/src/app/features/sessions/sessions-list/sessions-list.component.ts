import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, debounceTime, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationsService } from '../../../core/services/reservations.service';
import { SessionsService } from '../../../core/services/sessions.service';
import { Reservation } from '../../../core/models/reservation.model';
import { Session, SessionSearchParams } from '../../../core/models/session.model';
import { AppIconComponent } from '../../../shared/ui/icon/app-icon.component';

@Component({
  selector: 'app-sessions-list',
  imports: [RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sessions-list.component.html',
  styleUrl: './sessions-list.component.scss',
})
export class SessionsListComponent {
  private readonly sessionsService = inject(SessionsService);
  private readonly reservationsService = inject(ReservationsService);
  private readonly auth = inject(AuthService);

  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly reservingId = signal<string | null>(null);
  readonly cancellingId = signal<string | null>(null);
  readonly reservedIds = signal<Set<string>>(new Set());
  readonly reservationsBySessionId = signal<Map<string, Reservation>>(new Map());
  readonly successMessage = signal('');

  readonly searchTerm = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly limit = 10;

  readonly isClient = computed(() => this.auth.hasRole('CLIENT'));
  readonly isCoachOrAdmin = computed(() => this.auth.isAdminOrCoach());
  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());
  readonly hasActiveFilters = computed(
    () => !!this.searchTerm() || !!this.fromDate() || !!this.toDate(),
  );

  private readonly params = computed<SessionSearchParams>(() => ({
    search: this.searchTerm() || undefined,
    from: this.fromDate() ? `${this.fromDate()}T00:00:00.000Z` : undefined,
    to: this.toDate() ? `${this.toDate()}T23:59:59.999Z` : undefined,
    page: this.page(),
    limit: this.limit,
  }));

  constructor() {
    toObservable(this.params)
      .pipe(
        debounceTime(300),
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap((params) =>
          this.sessionsService.getAll(params).pipe(
            catchError(() => {
              this.error.set('Impossible de charger les séances.');
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.sessions.set(response.data);
        this.total.set(response.meta.total);
        this.totalPages.set(response.meta.totalPages);
        this.loading.set(false);
        if (this.isClient()) this.loadReservations();
      });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onFromDateChange(event: Event) {
    this.fromDate.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onToDateChange(event: Event) {
    this.toDate.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  clearFilters() {
    this.searchTerm.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.page.set(1);
  }

  goToPage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages()) return;
    this.page.set(newPage);
  }

  reserve(session: Session) {
    if (this.reservingId()) return;
    this.reservingId.set(session.id);
    this.successMessage.set('');
    this.error.set('');

    this.sessionsService.reserve(session.id).subscribe({
      next: () => {
        this.sessions.update((list) =>
          list.map((s) =>
            s.id === session.id
              ? { ...s, reservedPlaces: s.reservedPlaces + 1, availablePlaces: s.availablePlaces - 1 }
              : s,
          ),
        );
        this.successMessage.set(`Réservation confirmée pour "${session.title}".`);
        this.reservingId.set(null);
        this.loadReservations();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de la réservation.');
        this.reservingId.set(null);
      },
    });
  }

  cancel(session: Session) {
    const reservation = this.reservationsBySessionId().get(session.id);
    if (!reservation || this.cancellingId()) return;

    this.cancellingId.set(session.id);
    this.successMessage.set('');
    this.error.set('');

    this.reservationsService.cancel(reservation.id).subscribe({
      next: () => {
        this.reservationsBySessionId.update((reservations) => {
          const next = new Map(reservations);
          next.delete(session.id);
          return next;
        });
        this.reservedIds.update((ids) => {
          const next = new Set(ids);
          next.delete(session.id);
          return next;
        });
        this.sessions.update((list) =>
          list.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  reservedPlaces: Math.max(0, s.reservedPlaces - 1),
                  availablePlaces: s.availablePlaces + 1,
                }
              : s,
          ),
        );
        this.successMessage.set(`Réservation annulée pour "${session.title}".`);
        this.cancellingId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de l\'annulation.');
        this.cancellingId.set(null);
      },
    });
  }

  isReserved(id: string) {
    return this.reservedIds().has(id);
  }

  isFull(session: Session) {
    return session.availablePlaces === 0;
  }

  isPast(session: Session) {
    return new Date(session.startAt) < new Date();
  }

  formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  formatDuration(startAt: string, endAt: string) {
    const diff = new Date(endAt).getTime() - new Date(startAt).getTime();
    const minutes = diff / 60000;
    if (minutes < 60) return `${minutes}min`;
    return `${Math.floor(minutes / 60)}h${minutes % 60 ? (minutes % 60) + 'min' : ''}`;
  }

  private loadReservations() {
    this.reservationsService.getMine().subscribe({
      next: (reservations) => {
        const confirmed = reservations.filter((r) => r.status === 'CONFIRMED');
        this.reservedIds.set(new Set(confirmed.map((r) => r.sessionId)));
        this.reservationsBySessionId.set(new Map(confirmed.map((r) => [r.sessionId, r])));
      },
      error: () => this.error.set('Impossible de charger vos réservations.'),
    });
  }
}
