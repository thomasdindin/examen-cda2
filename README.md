# Sportify Pro

Sportify Pro est une application de gestion de seances de coaching sportif. Elle permet a un client de creer un compte, consulter les seances disponibles, rechercher et paginer les resultats, reserver une seance et annuler une reservation. Les coachs peuvent gerer leurs seances et consulter les participants. Les administrateurs peuvent superviser les utilisateurs, les seances et les reservations.

## Code source

- Depot GitHub : `[ici](https://github.com/thomasdindin/examen-cda2/)`.
- Backend : `sportify-api/`, API NestJS avec Prisma et PostgreSQL.
- Frontend : `sportify-front/`, application Angular responsive.
- README : present a la racine du livrable.

## Livrables de conception

Les livrables d'analyse et de conception sont presents a la racine du projet :

- User stories : `USER_STORIES.md`
- Wireframes / maquettes : `Sportify Wireframes.html`
- MCD : `MCD.loo`
- Diagramme de cas d'utilisation : `diagramme_utilisation.drawio.png`
- Checklist de suivi : `CHECKLIST.MD`

## Fonctionnalites

### Fonctionnalites principales

- Authentification par JWT avec inscription et connexion.
- Gestion des roles `ADMIN`, `COACH` et `CLIENT`.
- Consultation des seances disponibles.
- Reservation et annulation de reservations.
- Gestion des seances par les coachs.
- Supervision des utilisateurs, seances et reservations par les administrateurs.
- Documentation Swagger de l'API.

### Bonus realises

- Responsive avance sur l'interface Angular.
- Recherche dans les listes de seances.
- Pagination des listes.

## Documentation

### Installation

Prerequis :
- Node.js et npm.
- Docker pour lancer PostgreSQL via `docker-compose`.
- Un fichier `.env` backend base sur `sportify-api/.env.example`.

Installer le backend :

```bash
cd sportify-api
npm install
```

Installer le frontend :

```bash
cd sportify-front
npm install
```

### Execution

Lancer la base PostgreSQL :

```bash
cd sportify-api
docker compose up -d
```

Preparer la base de donnees :

```bash
cd sportify-api
npm run prisma:migrate
npm run seed
```

Lancer l'API :

```bash
cd sportify-api
npm run start:dev
```

Lancer le frontend :

```bash
cd sportify-front
npm start
```

URLs locales :
- Frontend : `http://localhost:4200`
- API : `http://localhost:3000`
- Swagger : `http://localhost:3000/api/docs`

Comptes de demonstration crees par le seed :
- Admin : `admin@sportify.fr` / `Password123!`
- Coach : `coach@sportify.fr` / `Password123!`
- Client : `client@sportify.fr` / `Password123!`

## Tests

Commandes de validation :

```bash
cd sportify-api
npm test -- --runInBand
npm run build
```

```bash
cd sportify-front
npm test -- --watch=false
npm run build
```

Resultat de l'audit :
- Backend : 4 suites Jest passees, 15 tests passes.
- Frontend : 1 suite Angular/Vitest passee, 2 tests passes.
- Builds : backend et frontend valides.

## Deploiement

Le projet contient un `docker-compose.yml` dans `sportify-api/` pour lancer PostgreSQL 16 avec une base `sportify_db`.

## Conception

### Architecture

L'application suit une architecture 3 tiers :
- Presentation : frontend Angular dans `sportify-front/`.
- Metier/API : backend NestJS dans `sportify-api/`.
- Donnees : PostgreSQL pilote par Prisma.

La separation des couches est visible dans le backend :
- Controllers : exposition des routes HTTP.
- Services : logique metier.
- Guards/decorators : authentification JWT et autorisations par role.
- PrismaService : acces aux donnees.

La separation est aussi presente dans le frontend :
- Pages et composants par fonctionnalite.
- Services Angular pour les appels API.
- Guards et interceptors pour la securite et les erreurs.
- Models TypeScript pour typer les echanges.

### Modele de donnees

Le modele metier repose sur trois entites principales :
- `User` : utilisateur avec role `ADMIN`, `COACH` ou `CLIENT`.
- `Session` : seance sportive rattachee a un coach.
- `Reservation` : reservation d'un client sur une seance.

Les relations principales :
- Un coach possede plusieurs seances.
- Un client possede plusieurs reservations.
- Une seance possede plusieurs reservations.
- Une reservation est unique pour un couple utilisateur/seance.

### Choix techniques

- NestJS : framework backend structure, adapte a une API REST avec modules, controllers, services et guards.
- Prisma : ORM type, migrations SQL et mapping clair avec PostgreSQL.
- PostgreSQL : base relationnelle adaptee aux contraintes entre utilisateurs, seances et reservations.
- JWT : authentification stateless entre frontend et API.
- Angular : frontend structure par composants, services et routes protegees.
- Swagger : documentation interactive de l'API.

