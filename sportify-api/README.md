# Sportify Pro — Documentation API Backend

> **Pour le développeur frontend Angular** : ce document décrit l'intégralité de l'API REST disponible, les règles d'authentification, les rôles, et des conseils concrets pour démarrer en Angular.

---

## Sommaire

1. [Démarrage rapide](#1-démarrage-rapide)
2. [Stack technique](#2-stack-technique)
3. [Authentification JWT](#3-authentification-jwt)
4. [Rôles et permissions](#4-rôles-et-permissions)
5. [Référence des endpoints](#5-référence-des-endpoints)
6. [Modèles de données](#6-modèles-de-données)
7. [Codes d'erreur](#7-codes-derreur)
8. [Comptes de test seed](#8-comptes-de-test-seed)
9. [Guide Angular — par où commencer](#9-guide-angular--par-où-commencer)

---

## 1. Démarrage rapide

```
URL de base de l'API   : http://localhost:3000
Documentation Swagger  : http://localhost:3000/api/docs
```

Le Swagger permet de tester tous les endpoints directement depuis le navigateur. Cliquer sur **Authorize** en haut à droite pour entrer le JWT.

---

## 2. Stack technique

| Élément | Technologie |
|---|---|
| Framework | NestJS 11 |
| Base de données | PostgreSQL 16 |
| ORM | Prisma 6 |
| Authentification | JWT (Bearer token, expire 1j) |
| Validation | class-validator |
| Documentation | Swagger / OpenAPI |

---

## 3. Authentification JWT

### Principe

L'API utilise des **JWT Bearer tokens**. Toutes les routes protégées nécessitent le header :

```
Authorization: Bearer <accessToken>
```

### Register — POST /auth/register

```json
// Body
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@mail.com",
  "password": "Password123!"
}

// Réponse 201
{
  "id": "uuid",
  "email": "john.doe@mail.com",
  "firstname": "John",
  "lastname": "Doe",
  "role": "CLIENT",
  "enabled": true
}
```

### Login — POST /auth/login

```json
// Body
{
  "email": "john.doe@mail.com",
  "password": "Password123!"
}

// Réponse 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john.doe@mail.com",
    "firstname": "John",
    "lastname": "Doe",
    "role": "CLIENT"
  }
}
```

Stocker `accessToken` en `localStorage` et l'envoyer dans chaque requête protégée.

### Payload du token (décodé)

```json
{
  "sub": "uuid-de-l-utilisateur",
  "email": "john.doe@mail.com",
  "role": "CLIENT",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 4. Rôles et permissions

Trois rôles existent : `CLIENT`, `COACH`, `ADMIN`.

| Action | CLIENT | COACH | ADMIN |
|---|:---:|:---:|:---:|
| Voir les séances | oui | oui | oui |
| Réserver une séance | oui | non | non |
| Annuler sa réservation | oui | non | non |
| Créer une séance | non | oui | oui |
| Modifier / supprimer sa séance | non | oui | oui |
| Voir les participants d'une séance | non | oui | oui |
| Gérer les utilisateurs | non | non | oui |
| Superviser toutes les séances | non | non | oui |
| Superviser toutes les réservations | non | non | oui |

---

## 5. Référence des endpoints

### Auth

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Créer un compte CLIENT |
| POST | `/auth/login` | — | Se connecter, obtenir un JWT |
| GET | `/auth/me` | JWT | Profil de l'utilisateur connecté |

### Users

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Profil complet de l'utilisateur connecté |

### Sessions

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/sessions` | — | Liste toutes les séances |
| GET | `/sessions/:id` | — | Détail d'une séance |
| POST | `/sessions` | COACH / ADMIN | Créer une séance |
| PATCH | `/sessions/:id` | JWT (propriétaire ou ADMIN) | Modifier une séance |
| DELETE | `/sessions/:id` | JWT (propriétaire ou ADMIN) | Supprimer une séance |
| GET | `/sessions/:id/participants` | JWT (propriétaire ou ADMIN) | Liste des participants |

#### Exemple de réponse GET /sessions

```json
[
  {
    "id": "uuid",
    "title": "Coaching musculation",
    "description": "Séance force débutant",
    "startAt": "2026-05-01T10:00:00.000Z",
    "endAt": "2026-05-01T11:00:00.000Z",
    "maxParticipants": 8,
    "reservedPlaces": 3,
    "availablePlaces": 5,
    "coachId": "uuid",
    "coach": {
      "id": "uuid",
      "firstname": "Alice",
      "lastname": "Coach"
    }
  }
]
```

#### Body POST /sessions

```json
{
  "title": "Coaching musculation",
  "description": "Séance force débutant",
  "startAt": "2026-05-01T10:00:00.000Z",
  "endAt": "2026-05-01T11:00:00.000Z",
  "maxParticipants": 8,
  "coachId": "uuid-optionnel-admin-seulement"
}
```

### Reservations

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/sessions/:sessionId/reservations` | CLIENT | Réserver une séance |
| GET | `/reservations/me` | JWT | Mes réservations |
| DELETE | `/reservations/:id` | JWT (propriétaire ou ADMIN) | Annuler une réservation |

> `DELETE /reservations/:id` ne supprime pas — passe le statut à `CANCELLED`.

#### Exemple de réponse GET /reservations/me

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "sessionId": "uuid",
    "status": "CONFIRMED",
    "createdAt": "2026-04-27T10:00:00.000Z",
    "session": {
      "id": "uuid",
      "title": "Coaching musculation",
      "startAt": "2026-05-01T10:00:00.000Z",
      "endAt": "2026-05-01T11:00:00.000Z",
      "coach": { "id": "uuid", "firstname": "Alice", "lastname": "Coach" }
    }
  }
]
```

### Admin

Toutes les routes `/admin/*` requièrent le rôle `ADMIN`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/users` | Liste tous les utilisateurs (sans password) |
| PATCH | `/admin/users/:id` | Modifier le rôle ou le statut |
| GET | `/admin/sessions` | Toutes les séances avec stats |
| GET | `/admin/reservations` | Toutes les réservations |

#### Body PATCH /admin/users/:id

```json
{
  "role": "COACH",
  "enabled": true
}
```

---

## 6. Modèles de données

### User

```ts
interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'ADMIN' | 'COACH' | 'CLIENT';
  enabled: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
// Le champ password n'est JAMAIS retourné par l'API
```

### Session

```ts
interface Session {
  id: string;
  title: string;
  description: string | null;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  maxParticipants: number;
  reservedPlaces: number;
  availablePlaces: number;
  coachId: string;
  coach: { id: string; firstname: string; lastname: string };
  createdAt: string;
  updatedAt: string;
}
```

### Reservation

```ts
interface Reservation {
  id: string;
  userId: string;
  sessionId: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  session?: Session; // inclus selon la route
  user?: User;       // inclus selon la route (admin)
}
```

---

## 7. Codes d'erreur

| HTTP | Cas | Exemple de message |
|---|---|---|
| 400 | Validation / règle métier | "La date de début doit être avant la date de fin." |
| 400 | Plus de places | "Plus de places disponibles pour cette séance." |
| 400 | Séance passée | "Impossible de réserver une séance passée." |
| 401 | Token absent ou invalide | "Unauthorized" |
| 401 | Mauvais mot de passe | "Email ou mot de passe incorrect." |
| 403 | Rôle insuffisant | "Accès refusé : rôle insuffisant." |
| 404 | Ressource introuvable | "Séance introuvable." |
| 409 | Email déjà utilisé | "Cet email est déjà utilisé." |
| 409 | Conflit horaire | "Vous avez déjà une réservation sur ce créneau." |

### Format standard des erreurs

```json
{
  "statusCode": 409,
  "message": "Vous avez déjà une réservation sur ce créneau.",
  "error": "Conflict"
}
```

---

## 8. Comptes de test seed

| Rôle | Email | Mot de passe |
|---|---|---|
| ADMIN | admin@sportify.fr | Password123! |
| COACH | coach@sportify.fr | Password123! |
| CLIENT | client@sportify.fr | Password123! |

5 séances futures sont disponibles : Coaching musculation, Cardio training, Mobilité, Préparation physique, Cross training.

---

## 9. Guide Angular — par où commencer

### Prérequis

```bash
ng new sportify-frontend --routing --style=scss
cd sportify-frontend
```

---

### Étape 1 — Environment

`src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

---

### Étape 2 — Configurer HttpClient avec intercepteurs

`src/app/app.config.ts`

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
```

---

### Étape 3 — Intercepteur JWT (ajoute le token à chaque requête)

`src/app/core/interceptors/auth.interceptor.ts`

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  if (token) {
    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }));
  }

  return next(req);
};
```

---

### Étape 4 — Intercepteur d'erreurs (gère les 401)

`src/app/core/interceptors/error.interceptor.ts`

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
```

---

### Étape 5 — AuthService

`src/app/core/services/auth.service.ts`

```ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'ADMIN' | 'COACH' | 'CLIENT';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;
  currentUser = signal<CurrentUser | null>(null);

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('user');
    if (stored) this.currentUser.set(JSON.parse(stored));
  }

  register(data: { firstname: string; lastname: string; email: string; password: string }) {
    return this.http.post<CurrentUser>(`${this.api}/register`, data);
  }

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string; user: CurrentUser }>(`${this.api}/login`, { email, password })
      .pipe(
        tap(({ accessToken, user }) => {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: 'ADMIN' | 'COACH' | 'CLIENT'): boolean {
    return this.currentUser()?.role === role;
  }
}
```

---

### Étape 6 — SessionsService

`src/app/core/services/sessions.service.ts`

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Session {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  maxParticipants: number;
  reservedPlaces: number;
  availablePlaces: number;
  coach: { id: string; firstname: string; lastname: string };
}

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly api = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  getAll()                          { return this.http.get<Session[]>(this.api); }
  getOne(id: string)                { return this.http.get<Session>(`${this.api}/${id}`); }
  create(data: Partial<Session>)    { return this.http.post<Session>(this.api, data); }
  update(id: string, d: Partial<Session>) { return this.http.patch<Session>(`${this.api}/${id}`, d); }
  delete(id: string)                { return this.http.delete(`${this.api}/${id}`); }
  reserve(sessionId: string)        { return this.http.post(`${environment.apiUrl}/sessions/${sessionId}/reservations`, {}); }
  getParticipants(id: string)       { return this.http.get<any[]>(`${this.api}/${id}/participants`); }
}
```

---

### Étape 7 — ReservationsService

`src/app/core/services/reservations.service.ts`

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly api = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  getMine()           { return this.http.get<any[]>(`${this.api}/me`); }
  cancel(id: string)  { return this.http.delete(`${this.api}/${id}`); }
}
```

---

### Étape 8 — Guards de navigation

`src/app/core/guards/auth.guard.ts`

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

export const roleGuard = (role: 'ADMIN' | 'COACH' | 'CLIENT'): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (auth.hasRole(role)) return true;
  inject(Router).navigate(['/']);
  return false;
};
```

Usage dans `app.routes.ts` :

```ts
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
  { path: 'sessions', loadComponent: () => import('./features/sessions/sessions-list/sessions-list.component') },
  {
    path: 'my-reservations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reservations/my-reservations/my-reservations.component'),
  },
  {
    path: 'coach',
    canActivate: [roleGuard('COACH')],
    loadComponent: () => import('./features/sessions/session-form/session-form.component'),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin/admin.component'),
  },
];
```

---

### Structure de dossiers recommandée

```
src/app/
  core/
    services/
      auth.service.ts
      sessions.service.ts
      reservations.service.ts
      admin.service.ts
    interceptors/
      auth.interceptor.ts
      error.interceptor.ts
    guards/
      auth.guard.ts
  features/
    auth/
      login/
      register/
    sessions/
      sessions-list/       ← liste publique + bouton réserver (CLIENT)
      session-detail/
      session-form/        ← création/édition (COACH/ADMIN)
    reservations/
      my-reservations/     ← liste + annulation (CLIENT)
    admin/
      users-list/          ← gestion utilisateurs
      sessions-overview/   ← supervision séances
  shared/
    components/
    pipes/
```

---

### Flux d'implémentation conseillé

```
1.  Page login + register  →  AuthService.login() / register()
2.  Liste des séances  →  GET /sessions (public)
3.  Bouton "Réserver"  →  POST /sessions/:id/reservations (CLIENT)
4.  Mes réservations  →  GET /reservations/me
5.  Annuler  →  DELETE /reservations/:id
6.  Formulaire coach  →  POST /sessions + PATCH /sessions/:id
7.  Page admin users  →  GET /admin/users + PATCH /admin/users/:id
8.  Page admin sessions  →  GET /admin/sessions
```

---

### CORS

L'API autorise les requêtes depuis `http://localhost:4200` (port Angular par défaut).
Si vous changez de port, modifiez `FRONTEND_URL` dans le `.env` du backend et redémarrez.
