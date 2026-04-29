import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SessionsService } from '../../../core/services/sessions.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-session-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-form.component.html',
  styleUrl: './session-form.component.scss',
})
export class SessionFormComponent implements OnInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly loadingSession = signal(false);
  readonly error = signal('');
  readonly sessionId = signal<string | null>(null);
  readonly isEdit = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    startAt: ['', Validators.required],
    endAt: ['', Validators.required],
    maxParticipants: [8, [Validators.required, Validators.min(1), Validators.max(100)]],
    coachId: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
      this.isEdit.set(true);
      this.loadSession(id);
    }

    if (this.auth.hasRole('COACH')) {
      const user = this.auth.currentUser();
      if (user) this.form.patchValue({ coachId: user.id });
    }
  }

  private loadSession(id: string) {
    this.loadingSession.set(true);
    this.sessionsService.getOne(id).subscribe({
      next: (session) => {
        this.form.patchValue({
          title: session.title,
          description: session.description ?? '',
          startAt: this.toDatetimeLocal(session.startAt),
          endAt: this.toDatetimeLocal(session.endAt),
          maxParticipants: session.maxParticipants,
          coachId: session.coachId,
        });
        this.loadingSession.set(false);
      },
      error: () => {
        this.error.set('Séance introuvable.');
        this.loadingSession.set(false);
      },
    });
  }

  private toDatetimeLocal(iso: string) {
    const date = new Date(iso);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  isInvalid(field: string) {
    const ctrl = this.form.get(field);
    return ctrl?.invalid && ctrl.touched;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const data = {
      title: raw.title,
      description: raw.description || undefined,
      startAt: new Date(raw.startAt).toISOString(),
      endAt: new Date(raw.endAt).toISOString(),
      maxParticipants: raw.maxParticipants,
      ...(raw.coachId ? { coachId: raw.coachId } : {}),
    };

    const id = this.sessionId();
    const req = id
      ? this.sessionsService.update(id, data)
      : this.sessionsService.create(data);

    req.subscribe({
      next: () => this.router.navigate(['/sessions']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Une erreur est survenue.');
        this.loading.set(false);
      },
    });
  }

  delete() {
    const id = this.sessionId();
    if (!id) return;
    if (!confirm('Supprimer cette séance définitivement ?')) return;

    this.sessionsService.delete(id).subscribe({
      next: () => this.router.navigate(['/sessions']),
      error: (err) => this.error.set(err.error?.message ?? 'Erreur lors de la suppression.'),
    });
  }
}
