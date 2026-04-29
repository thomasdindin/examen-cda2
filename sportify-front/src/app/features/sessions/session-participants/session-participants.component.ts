import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionsService } from '../../../core/services/sessions.service';
import { Session } from '../../../core/models/session.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-session-participants',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-participants.component.html',
  styleUrl: './session-participants.component.scss',
})
export class SessionParticipantsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionsService = inject(SessionsService);

  readonly session = signal<Session | null>(null);
  readonly participants = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly fillRate = computed(() => {
    const session = this.session();
    if (!session || session.maxParticipants === 0) return 0;
    return Math.round((session.reservedPlaces / session.maxParticipants) * 100);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Seance introuvable.');
      this.loading.set(false);
      return;
    }

    this.sessionsService.getOne(id).subscribe({
      next: (session) => this.session.set(session),
      error: () => this.error.set('Impossible de charger la seance.'),
    });

    this.sessionsService.getParticipants(id).subscribe({
      next: (participants) => {
        this.participants.set(participants);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les participants.');
        this.loading.set(false);
      },
    });
  }

  formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
}
