import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { Session } from '../../../core/models/session.model';
import { AppIconComponent } from '../../../shared/ui/icon/app-icon.component';

@Component({
  selector: 'app-sessions-overview',
  imports: [RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sessions-overview.component.html',
  styleUrl: './sessions-overview.component.scss',
})
export class SessionsOverviewComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    this.adminService.getSessions().subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les séances.');
        this.loading.set(false);
      },
    });
  }

  formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  }

  fillRate(session: Session) {
    return Math.round((session.reservedPlaces / session.maxParticipants) * 100);
  }

  isPast(iso: string) {
    return new Date(iso) < new Date();
  }
}
