import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReservationsService } from '../../../core/services/reservations.service';
import { Reservation } from '../../../core/models/reservation.model';
import { AppIconComponent } from '../../../shared/ui/icon/app-icon.component';

@Component({
  selector: 'app-my-reservations',
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.scss',
})
export class MyReservationsComponent implements OnInit {
  private readonly reservationsService = inject(ReservationsService);

  readonly reservations = signal<Reservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly cancellingId = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.reservationsService.getMine().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger vos réservations.');
        this.loading.set(false);
      },
    });
  }

  cancel(reservation: Reservation) {
    if (!confirm(`Annuler la réservation pour "${reservation.session?.title}" ?`)) return;
    this.cancellingId.set(reservation.id);

    this.reservationsService.cancel(reservation.id).subscribe({
      next: () => {
        this.reservations.update((list) =>
          list.map((r) => (r.id === reservation.id ? { ...r, status: 'CANCELLED' as const } : r)),
        );
        this.cancellingId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de l\'annulation.');
        this.cancellingId.set(null);
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

  isPast(iso: string) {
    return new Date(iso) < new Date();
  }
}
