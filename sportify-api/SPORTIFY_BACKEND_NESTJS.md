# Sportify Pro — Backend NestJS

## Objectif

Créer une API REST sécurisée pour l'application **Sportify Pro**, dans le cadre d'un examen CDA à réaliser en 4 jours.

L'objectif est de livrer un backend **simple, propre, fonctionnel, sécurisé et démontrable**, sans sur-architecture.

Le backend doit gérer :

- l'authentification
- les utilisateurs
- les rôles
- les séances sportives
- les réservations
- les règles métier essentielles
- la documentation API
- le déploiement local via Docker

---

# 1. Stack technique

## Stack obligatoire recommandée

- **Node.js**
- **NestJS**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT**
- **bcrypt**
- **Swagger / OpenAPI**
- **Docker / Docker Compose**

## Dépendances principales

```bash
npm install @nestjs/config
npm install @nestjs/jwt
npm install @nestjs/passport passport passport-jwt
npm install bcrypt
npm install prisma @prisma/client
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install helmet
npm install compression
```

## Dépendances dev

```bash
npm install -D @types/passport-jwt
npm install -D @types/bcrypt
```

---

# 2. Architecture générale

Architecture modulaire NestJS classique.

```txt
src/
  main.ts
  app.module.ts

  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
      login.dto.ts
      register.dto.ts
    strategies/
      jwt.strategy.ts

  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
      update-user.dto.ts

  sessions/
    sessions.module.ts
    sessions.controller.ts
    sessions.service.ts
    dto/
      create-session.dto.ts
      update-session.dto.ts

  reservations/
    reservations.module.ts
    reservations.controller.ts
    reservations.service.ts

  admin/
    admin.module.ts
    admin.controller.ts
    admin.service.ts

  prisma/
    prisma.module.ts
    prisma.service.ts

  common/
    decorators/
      current-user.decorator.ts
      roles.decorator.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    enums/
      role.enum.ts
    exceptions/
      business.exception.ts
```

## Principe

- Les **controllers** exposent les routes HTTP.
- Les **services** contiennent la logique métier.
- Prisma gère l'accès aux données.
- Les DTO valident les entrées.
- Les guards gèrent l'authentification et les rôles.
- Swagger documente automatiquement l'API.

---

# 3. Modèle de données Prisma

Créer le fichier `prisma/schema.prisma`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  COACH
  CLIENT
}

enum ReservationStatus {
  CONFIRMED
  CANCELLED
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  password     String
  firstname    String
  lastname     String
  role         Role          @default(CLIENT)
  enabled      Boolean       @default(true)

  coachSessions Session[]    @relation("CoachSessions")
  reservations  Reservation[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Session {
  id              String        @id @default(uuid())
  title           String
  description     String?
  startAt         DateTime
  endAt           DateTime
  maxParticipants Int

  coachId         String
  coach           User          @relation("CoachSessions", fields: [coachId], references: [id])

  reservations    Reservation[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Reservation {
  id         String             @id @default(uuid())
  userId     String
  sessionId  String
  status     ReservationStatus  @default(CONFIRMED)

  user       User               @relation(fields: [userId], references: [id])
  session    Session            @relation(fields: [sessionId], references: [id])

  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt

  @@unique([userId, sessionId])
}
```

---

# 4. Variables d'environnement

Créer un fichier `.env`.

```env
DATABASE_URL="postgresql://sportify:sportify@localhost:5432/sportify_db?schema=public"
JWT_SECRET="change_me_in_production"
JWT_EXPIRES_IN="1d"
PORT=3000
```

Créer aussi un `.env.example`.

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
PORT=
```

---

# 5. Docker Compose

Créer `docker-compose.yml`.

```yaml
services:
  postgres:
    image: postgres:16
    container_name: sportify-postgres
    restart: always
    environment:
      POSTGRES_USER: sportify
      POSTGRES_PASSWORD: sportify
      POSTGRES_DB: sportify_db
    ports:
      - "5432:5432"
    volumes:
      - sportify_postgres_data:/var/lib/postgresql/data

volumes:
  sportify_postgres_data:
```

---

# 6. Initialisation Prisma

Commandes à prévoir dans le README.

```bash
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio
```

---

# 7. Authentification

## Routes Auth

```http
POST /auth/register
POST /auth/login
GET /auth/me
```

## Register

Le register doit permettre de créer un utilisateur client par défaut.

### Body

```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@mail.com",
  "password": "Password123!"
}
```

### Règles

- email unique
- mot de passe hashé avec bcrypt
- rôle par défaut : `CLIENT`
- ne jamais retourner le password

## Login

### Body

```json
{
  "email": "john.doe@mail.com",
  "password": "Password123!"
}
```

### Réponse attendue

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "john.doe@mail.com",
    "firstname": "John",
    "lastname": "Doe",
    "role": "CLIENT"
  }
}
```

## JWT Payload

```ts
{
  sub: string;
  email: string;
  role: Role;
}
```

---

# 8. Guards et décorateurs

## JwtAuthGuard

Protège les routes authentifiées.

```ts
@UseGuards(JwtAuthGuard)
```

## RolesGuard

Protège les routes selon le rôle.

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
```

## Décorateur CurrentUser

Permet de récupérer l'utilisateur connecté.

```ts
@CurrentUser() user: JwtUser
```

## Décorateur Roles

Permet de définir les rôles autorisés.

```ts
@Roles(Role.COACH, Role.ADMIN)
```

---

# 9. Gestion des rôles

## Rôles disponibles

```ts
export enum Role {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  CLIENT = 'CLIENT',
}
```

## Droits

| Fonctionnalité | CLIENT | COACH | ADMIN |
|---|---:|---:|---:|
| Voir les séances | Oui | Oui | Oui |
| Réserver une séance | Oui | Non | Non |
| Annuler sa réservation | Oui | Non | Non |
| Créer une séance | Non | Oui | Oui |
| Modifier sa séance | Non | Oui | Oui |
| Voir participants | Non | Oui | Oui |
| Gérer utilisateurs | Non | Non | Oui |
| Superviser séances | Non | Non | Oui |

---

# 10. Module Users

## Routes

```http
GET /users/me
```

Route protégée par JWT.

Retourne les informations de l'utilisateur connecté.

### Réponse

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "firstname": "John",
  "lastname": "Doe",
  "role": "CLIENT",
  "enabled": true
}
```

---

# 11. Module Sessions

Une séance représente un créneau de coaching sportif.

## Routes publiques ou authentifiées

```http
GET /sessions
GET /sessions/:id
```

Ces routes peuvent être publiques ou protégées selon le choix retenu.
Pour simplifier l'examen, elles peuvent être publiques afin de consulter les séances disponibles.

## Routes Coach/Admin

```http
POST /sessions
PATCH /sessions/:id
DELETE /sessions/:id
GET /sessions/:id/participants
```

Ces routes doivent être protégées par JWT.

### Création d'une séance

Accessible à :

- COACH
- ADMIN

```http
POST /sessions
```

### Body

```json
{
  "title": "Coaching musculation",
  "description": "Séance force débutant",
  "startAt": "2026-05-01T10:00:00.000Z",
  "endAt": "2026-05-01T11:00:00.000Z",
  "maxParticipants": 8
}
```

### Règles

- `startAt` doit être avant `endAt`
- `maxParticipants` doit être supérieur à 0
- si l'utilisateur est COACH, il devient automatiquement coach de la séance
- si l'utilisateur est ADMIN, prévoir soit :
  - création avec son id comme coach pour simplifier
  - ou champ optionnel `coachId`

Pour le MVP, privilégier :
- COACH crée ses propres séances
- ADMIN supervise seulement

## Liste des séances

```http
GET /sessions
```

Réponse recommandée :

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
    "coach": {
      "id": "uuid",
      "firstname": "Alice",
      "lastname": "Coach"
    }
  }
]
```

## Détail d'une séance

```http
GET /sessions/:id
```

Doit inclure :

- informations séance
- coach
- nombre de places réservées
- nombre de places disponibles

## Modification d'une séance

```http
PATCH /sessions/:id
```

Accessible à :

- ADMIN
- COACH propriétaire de la séance

## Suppression d'une séance

```http
DELETE /sessions/:id
```

Accessible à :

- ADMIN
- COACH propriétaire de la séance

Pour simplifier :
- supprimer seulement si aucune réservation confirmée
- sinon renvoyer une erreur métier

## Participants

```http
GET /sessions/:id/participants
```

Accessible à :

- ADMIN
- COACH propriétaire de la séance

Retourne les clients ayant réservé.

---

# 12. Module Reservations

## Routes

```http
POST /sessions/:sessionId/reservations
GET /reservations/me
DELETE /reservations/:id
```

Toutes les routes nécessitent JWT.

## Créer une réservation

Accessible uniquement à `CLIENT`.

```http
POST /sessions/:sessionId/reservations
```

### Règles métier obligatoires

1. L'utilisateur doit être authentifié.
2. L'utilisateur doit avoir le rôle `CLIENT`.
3. La séance doit exister.
4. La séance doit avoir encore des places disponibles.
5. Le client ne doit pas avoir déjà réservé cette séance.
6. Le client ne doit pas avoir une autre réservation confirmée sur le même créneau.
7. Une séance passée ne doit pas être réservable.

## Vérification des places

Nombre de réservations confirmées :

```ts
where: {
  sessionId,
  status: 'CONFIRMED'
}
```

Si `confirmedReservations >= maxParticipants`, refuser.

## Vérification conflit horaire

Un client ne peut pas réserver deux séances qui se chevauchent.

Logique :

```txt
Une réservation est en conflit si :
existingSession.startAt < newSession.endAt
AND existingSession.endAt > newSession.startAt
```

## Annuler une réservation

```http
DELETE /reservations/:id
```

Accessible uniquement au client propriétaire de la réservation ou à l'admin.

Pour simplifier :
- ne pas supprimer physiquement
- passer le statut à `CANCELLED`

## Mes réservations

```http
GET /reservations/me
```

Retourne les réservations de l'utilisateur connecté.

---

# 13. Module Admin

## Routes Admin

```http
GET /admin/users
PATCH /admin/users/:id
GET /admin/sessions
GET /admin/reservations
```

Toutes les routes sont protégées par :

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
```

## GET /admin/users

Retourne la liste des utilisateurs sans password.

## PATCH /admin/users/:id

Permet à l'admin de modifier :

- rôle
- enabled

### Body

```json
{
  "role": "COACH",
  "enabled": true
}
```

## GET /admin/sessions

Retourne toutes les séances avec :

- coach
- nombre de réservations
- places disponibles

## GET /admin/reservations

Retourne toutes les réservations avec :

- client
- séance
- statut

---

# 14. DTO et validation

Utiliser `class-validator`.

## RegisterDto

```ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  firstname: string;

  @IsNotEmpty()
  lastname: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
```

## LoginDto

```ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

## CreateSessionDto

```ts
import { IsDateString, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsInt()
  @Min(1)
  maxParticipants: number;
}
```

---

# 15. Gestion des erreurs

Utiliser les exceptions NestJS natives.

## Cas fréquents

| Cas | Exception |
|---|---|
| Email déjà utilisé | ConflictException |
| Login invalide | UnauthorizedException |
| Ressource introuvable | NotFoundException |
| Rôle insuffisant | ForbiddenException |
| Règle métier non respectée | BadRequestException |
| Plus de places disponibles | BadRequestException |
| Conflit de créneau | ConflictException |

## Exemple

```ts
throw new ConflictException('Vous avez déjà une réservation sur ce créneau.');
```

---

# 16. Swagger

Configurer Swagger dans `main.ts`.

```ts
const config = new DocumentBuilder()
  .setTitle('Sportify Pro API')
  .setDescription('API de gestion de séances de coaching sportif')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

URL attendue :

```txt
http://localhost:3000/api/docs
```

---

# 17. Sécurité

## Minimum attendu

- JWT obligatoire sur les routes sensibles
- Hash des mots de passe avec bcrypt
- Guards par rôle
- Validation des DTO
- Ne jamais retourner le password
- Helmet activé
- CORS activé proprement

## main.ts recommandé

```ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
});

app.use(helmet());
app.use(compression());
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

# 18. Seed de données

Créer un seed Prisma pour avoir rapidement des comptes de test.

## Comptes recommandés

| Rôle | Email | Password |
|---|---|---|
| ADMIN | admin@sportify.fr | Password123! |
| COACH | coach@sportify.fr | Password123! |
| CLIENT | client@sportify.fr | Password123! |

## Séances de test

Créer 3 à 5 séances futures :

- Coaching musculation
- Cardio training
- Mobilité
- Préparation physique
- Cross training

Commande attendue :

```bash
npx prisma db seed
```

---

# 19. Scripts package.json

Prévoir au minimum :

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test": "jest",
    "lint": "eslint .",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio",
    "seed": "prisma db seed"
  }
}
```

---

# 20. Tests minimum

L'examen demande des tests unitaires ou fonctionnels.

## Tests prioritaires

### AuthService

Tester :

- register crée un utilisateur
- register refuse un email déjà utilisé
- login retourne un token
- login refuse mauvais password

### ReservationsService

Tester :

- réservation si place disponible
- refus si plus de places
- refus si conflit horaire
- annulation d'une réservation

### SessionsService

Tester :

- création séance
- refus date invalide
- récupération séances avec places restantes

---

# 21. Endpoints récapitulatifs

## Auth

```http
POST /auth/register
POST /auth/login
GET /auth/me
```

## Users

```http
GET /users/me
```

## Sessions

```http
GET /sessions
GET /sessions/:id
POST /sessions
PATCH /sessions/:id
DELETE /sessions/:id
GET /sessions/:id/participants
```

## Reservations

```http
POST /sessions/:sessionId/reservations
GET /reservations/me
DELETE /reservations/:id
```

## Admin

```http
GET /admin/users
PATCH /admin/users/:id
GET /admin/sessions
GET /admin/reservations
```

---

# 22. Ordre d'implémentation conseillé

## Étape 1 — Initialisation

1. Créer projet NestJS.
2. Installer dépendances.
3. Ajouter Prisma.
4. Créer docker-compose PostgreSQL.
5. Configurer `.env`.
6. Créer schema Prisma.
7. Lancer migration.

## Étape 2 — Base technique

1. PrismaService.
2. ConfigModule.
3. ValidationPipe.
4. Swagger.
5. Helmet / CORS.

## Étape 3 — Auth

1. Register.
2. Login.
3. JWT Strategy.
4. JwtAuthGuard.
5. CurrentUser decorator.

## Étape 4 — Roles

1. Enum Role.
2. Roles decorator.
3. RolesGuard.
4. Protection routes admin / coach.

## Étape 5 — Sessions

1. CRUD sessions.
2. Calcul places restantes.
3. Vérification coach propriétaire.

## Étape 6 — Reservations

1. Réserver.
2. Vérifier places.
3. Vérifier conflit horaire.
4. Annuler.
5. Mes réservations.

## Étape 7 — Admin

1. Liste utilisateurs.
2. Modification rôle/statut.
3. Supervision séances.
4. Supervision réservations.

## Étape 8 — Finalisation

1. Seed.
2. Tests minimum.
3. README.
4. Swagger propre.
5. Dockerfile si temps.

---

# 23. Dockerfile optionnel

Créer `Dockerfile`.

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

---

# 24. Docker Compose complet optionnel

```yaml
services:
  postgres:
    image: postgres:16
    container_name: sportify-postgres
    restart: always
    environment:
      POSTGRES_USER: sportify
      POSTGRES_PASSWORD: sportify
      POSTGRES_DB: sportify_db
    ports:
      - "5432:5432"
    volumes:
      - sportify_postgres_data:/var/lib/postgresql/data

  api:
    build: .
    container_name: sportify-api
    restart: always
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://sportify:sportify@postgres:5432/sportify_db?schema=public
      JWT_SECRET: change_me_in_production
      JWT_EXPIRES_IN: 1d
      PORT: 3000
    ports:
      - "3000:3000"

volumes:
  sportify_postgres_data:
```

---

# 25. Critères de validation backend

Le backend est considéré comme terminé si :

- l'API démarre sans erreur
- Swagger est disponible
- register fonctionne
- login fonctionne
- JWT protège les routes
- les rôles fonctionnent
- un coach peut créer une séance
- un client peut réserver une séance
- les places disponibles sont respectées
- un client ne peut pas réserver deux séances au même créneau
- un client peut annuler une réservation
- un admin peut gérer les utilisateurs
- les mots de passe ne sont jamais retournés
- le projet contient un README clair

---

# 26. Ce qu'il ne faut pas faire pour cet examen

Ne pas perdre de temps sur :

- refresh token avancé
- OAuth Google
- email verification
- reset password
- paiement
- CQRS
- microservices
- architecture hexagonale complète
- système de permissions trop fin
- notifications email
- websockets
- Redis
- queues
- logs avancés

---

# 27. Phrase de justification pour la soutenance

> J'ai choisi NestJS pour sa structure modulaire, sa séparation claire des responsabilités et son intégration naturelle avec TypeScript. L'architecture repose sur des modules métier indépendants, des services pour la logique métier, Prisma pour l'accès aux données, JWT pour la sécurité et Swagger pour la documentation. Ce choix permet de livrer rapidement une API propre, maintenable et adaptée au délai de l'examen.

---

# 28. Priorité absolue

Le backend doit d'abord prouver le flux principal :

```txt
Register
→ Login
→ Création séance par un coach
→ Consultation des séances
→ Réservation par un client
→ Respect des règles métier
→ Consultation Swagger
```

Tout le reste est secondaire.
