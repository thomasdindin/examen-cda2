import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionsService } from '../../../core/services/sessions.service';
import { AuthService } from '../../../core/services/auth.service';
import { Session } from '../../../core/models/session.model';
import { AppIconComponent } from '../../../shared/ui/icon/app-icon.component';

@Component({
  selector: 'app-my-sessions',
  imports: [RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-sessions.component.html',
  styleUrl: './my-sessions.component.scss',
})
export class MySessionsComponent implements OnInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly auth = inject(AuthService);

  readonly allSessions = signal<Session[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly deletingId = signal<string | null>(null);

  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));

  readonly mySessions = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    if (user.role === 'ADMIN') return this.allSessions();
    return this.allSessions().filter((s) => s.coachId === user.id);
  });

  ngOnInit() {
    this.sessionsService.getAll({ limit: 100 }).subscribe({
      next: (response) => {
        this.allSessions.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les séances.');
        this.loading.set(false);
      },
    });
  }

  delete(session: Session) {
    if (!confirm(`Supprimer "${session.title}" ?`)) return;
    this.deletingId.set(session.id);

    this.sessionsService.delete(session.id).subscribe({
      next: () => {
        this.allSessions.update((list) => list.filter((s) => s.id !== session.id));
        this.deletingId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de la suppression.');
        this.deletingId.set(null);
      },
    });
  }

  formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  }

  isPast(iso: string) {
    return new Date(iso) < new Date();
  }

  fillRate(session: Session) {
    return Math.round((session.reservedPlaces / session.maxParticipants) * 100);
  }
}
