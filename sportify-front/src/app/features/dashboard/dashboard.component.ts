import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ReservationsService } from '../../core/services/reservations.service';
import { SessionsService } from '../../core/services/sessions.service';
import { Reservation } from '../../core/models/reservation.model';
import { Session } from '../../core/models/session.model';
import { User } from '../../core/models/user.model';

interface ChartItem {
  label: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly sessionsService = inject(SessionsService);
  private readonly reservationsService = inject(ReservationsService);
  private readonly adminService = inject(AdminService);

  readonly currentUser = this.auth.currentUser;
  readonly role = this.auth.role;
  readonly loading = signal(true);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly reservingId = signal<string | null>(null);
  readonly reservedIds = signal<Set<string>>(new Set());

  readonly sessions = signal<Session[]>([]);
  readonly reservations = signal<Reservation[]>([]);
  readonly users = signal<User[]>([]);
  readonly coachStudents = signal<User[]>([]);

  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());
  readonly isClient = computed(() => this.auth.hasRole('CLIENT'));
  readonly isCoach = computed(() => this.auth.hasRole('COACH'));
  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  readonly isGuest = computed(() => !this.auth.isLoggedIn());

  readonly upcomingSessions = computed(() =>
    this.sessions()
      .filter((session) => !this.isPast(session.startAt))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
  );

  readonly todaySessions = computed(() =>
    this.upcomingSessions().filter((session) => this.isToday(session.startAt)),
  );

  readonly clientReservations = computed(() =>
    this.reservations().filter((reservation) => reservation.status === 'CONFIRMED'),
  );

  readonly clientTodayReservations = computed(() =>
    this.clientReservations().filter(
      (reservation) => reservation.session && this.isToday(reservation.session.startAt),
    ),
  );

  readonly clientUpcomingReservations = computed(() =>
    this.clientReservations()
      .filter(
        (reservation) =>
          reservation.session &&
          !this.isPast(reservation.session.startAt) &&
          !this.isToday(reservation.session.startAt),
      )
      .slice(0, 4),
  );

  readonly bookableSessions = computed(() =>
    this.upcomingSessions()
      .filter((session) => !this.isFull(session) && !this.isReserved(session.id))
      .slice(0, 3),
  );

  readonly coachSessions = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.sessions()
      .filter((session) => session.coachId === user.id)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  readonly coachTodaySessions = computed(() =>
    this.coachSessions().filter((session) => !this.isPast(session.startAt) && this.isToday(session.startAt)),
  );

  readonly coachUpcomingSessions = computed(() =>
    this.coachSessions()
      .filter((session) => !this.isPast(session.startAt) && !this.isToday(session.startAt))
      .slice(0, 5),
  );

  readonly totalCoachStudents = computed(() =>
    this.coachSessions().reduce((total, session) => total + session.reservedPlaces, 0),
  );

  readonly adminStats = computed(() => {
    const sessions = this.sessions();
    const users = this.users();
    const reservations = this.reservations().filter((reservation) => reservation.status === 'CONFIRMED');
    const totalCapacity = sessions.reduce((total, session) => total + session.maxParticipants, 0);
    const totalReserved = sessions.reduce((total, session) => total + session.reservedPlaces, 0);

    return {
      users: users.length,
      coaches: users.filter((user) => user.role === 'COACH').length,
      clients: users.filter((user) => user.role === 'CLIENT').length,
      todaySessions: this.todaySessions().length,
      upcomingSessions: this.upcomingSessions().length,
      reservations: reservations.length,
      fillRate: totalCapacity > 0 ? Math.round((totalReserved / totalCapacity) * 100) : 0,
    };
  });

  readonly roleChart = computed<ChartItem[]>(() => {
    const total = Math.max(this.users().length, 1);
    const roles = [
      { label: 'Clients', value: this.users().filter((user) => user.role === 'CLIENT').length },
      { label: 'Coachs', value: this.users().filter((user) => user.role === 'COACH').length },
      { label: 'Admins', value: this.users().filter((user) => user.role === 'ADMIN').length },
    ];

    return roles.map((item) => ({ ...item, percent: Math.round((item.value / total) * 100) }));
  });

  readonly capacityChart = computed<ChartItem[]>(() =>
    this.upcomingSessions()
      .slice(0, 5)
      .map((session) => ({
        label: session.title,
        value: session.reservedPlaces,
        percent: this.fillRate(session),
      })),
  );

  ngOnInit() {
    if (this.isGuest()) {
      this.loading.set(false);
      return;
    }

    if (this.isAdmin()) {
      this.loadAdminDashboard();
      return;
    }

    this.loadSessionsDashboard();
  }

  reserve(session: Session) {
    if (this.reservingId()) return;
    this.reservingId.set(session.id);
    this.error.set('');
    this.successMessage.set('');

    this.sessionsService.reserve(session.id).subscribe({
      next: () => {
        this.reservedIds.update((ids) => new Set([...ids, session.id]));
        this.sessions.update((sessions) =>
          sessions.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  reservedPlaces: item.reservedPlaces + 1,
                  availablePlaces: item.availablePlaces - 1,
                }
              : item,
          ),
        );
        this.successMessage.set(`Réservation confirmée pour "${session.title}".`);
        this.reservingId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de la réservation.');
        this.reservingId.set(null);
      },
    });
  }

  isReserved(id: string) {
    return this.reservedIds().has(id);
  }

  isFull(session: Session) {
    return session.availablePlaces <= 0;
  }

  isPast(iso: string) {
    return new Date(iso) < new Date();
  }

  isToday(iso: string) {
    const date = new Date(iso);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  fillRate(session: Session) {
    if (session.maxParticipants === 0) return 0;
    return Math.round((session.reservedPlaces / session.maxParticipants) * 100);
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

  formatTime(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  private loadSessionsDashboard() {
    this.sessionsService.getAll({ limit: 100 }).subscribe({
      next: (response) => {
        this.sessions.set(response.data);
        this.loading.set(false);
        if (this.isClient()) this.loadClientReservations();
        if (this.isCoach()) this.loadCoachStudents();
      },
      error: () => {
        this.error.set('Impossible de charger le tableau de bord.');
        this.loading.set(false);
      },
    });
  }

  private loadClientReservations() {
    this.reservationsService.getMine().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.reservedIds.set(
          new Set(
            reservations
              .filter((reservation) => reservation.status === 'CONFIRMED')
              .map((reservation) => reservation.sessionId),
          ),
        );
      },
      error: () => this.error.set('Impossible de charger vos réservations.'),
    });
  }

  private loadCoachStudents() {
    const sessions = this.coachSessions();
    if (sessions.length === 0) {
      this.coachStudents.set([]);
      return;
    }

    forkJoin(sessions.map((session) => this.sessionsService.getParticipants(session.id))).subscribe({
      next: (participantGroups) => {
        const students = new Map<string, User>();
        participantGroups.flat().forEach((student) => students.set(student.id, student));
        this.coachStudents.set([...students.values()]);
      },
      error: () => this.error.set('Impossible de charger les élèves du coach.'),
    });
  }

  private loadAdminDashboard() {
    forkJoin({
      users: this.adminService.getUsers(),
      sessions: this.adminService.getSessions(),
      reservations: this.adminService.getReservations(),
    }).subscribe({
      next: ({ users, sessions, reservations }) => {
        this.users.set(users);
        this.sessions.set(sessions);
        this.reservations.set(reservations);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le tableau de bord admin.');
        this.loading.set(false);
      },
    });
  }
}
