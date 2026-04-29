import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { User, UserRole } from '../../../core/models/user.model';
import { AppIconComponent } from '../../../shared/ui/icon/app-icon.component';

@Component({
  selector: 'app-users-list',
  imports: [RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly updatingId = signal<string | null>(null);

  ngOnInit() {
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les utilisateurs.');
        this.loading.set(false);
      },
    });
  }

  updateRole(user: User, role: UserRole) {
    this.updatingId.set(user.id);
    this.adminService.updateUser(user.id, { role }).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.updatingId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de la mise à jour.');
        this.updatingId.set(null);
      },
    });
  }

  toggleEnabled(user: User) {
    this.updatingId.set(user.id);
    this.adminService.updateUser(user.id, { enabled: !user.enabled }).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.updatingId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de la mise à jour.');
        this.updatingId.set(null);
      },
    });
  }

  formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(iso));
  }
}
