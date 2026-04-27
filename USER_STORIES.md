# User stories - Sportify Pro

## Objectif

Ces user stories décrivent les besoins principaux de l'application Sportify Pro à partir des fonctionnalités présentes dans le projet.

## Acteurs

- Visiteur : utilisateur non connecté.
- Client : utilisateur connecté pouvant réserver des séances.
- Coach : utilisateur connecté pouvant gérer ses séances.
- Administrateur : utilisateur connecté pouvant superviser la plateforme.

## MVP prioritaire

### Authentification

| ID | Rôle | User story | Priorité | Critères d'acceptation |
| --- | --- | --- | --- | --- |
| US-001 | Visiteur | En tant que visiteur, je veux créer un compte afin d'accéder aux fonctionnalités de réservation. | Haute | Le formulaire demande prénom, nom, email et mot de passe. Le compte créé possède le rôle CLIENT. Un email déjà utilisé est refusé. |
| US-002 | Utilisateur | En tant qu'utilisateur, je veux me connecter afin d'accéder à mon espace personnel. | Haute | L'utilisateur peut se connecter avec son email et son mot de passe. Un JWT est généré par l'API. Les informations de session sont conservées côté frontend. |
| US-003 | Utilisateur | En tant qu'utilisateur connecté, je veux me déconnecter afin de sécuriser mon compte. | Moyenne | Le token et les informations utilisateur sont supprimés. L'utilisateur est redirigé vers le tableau de bord. |

### Séances

| ID | Rôle | User story | Priorité | Critères d'acceptation |
| --- | --- | --- | --- | --- |
| US-004 | Visiteur | En tant que visiteur, je veux consulter les séances disponibles afin de découvrir l'offre sportive. | Haute | La liste des séances est accessible sans connexion. Chaque séance affiche ses informations principales et ses places disponibles. |
| US-005 | Client | En tant que client, je veux consulter les séances disponibles afin de choisir une activité. | Haute | Le client voit les séances, leur coach, leur date, leur capacité et le nombre de places restantes. |
| US-006 | Coach | En tant que coach, je veux créer une séance afin de proposer un créneau aux clients. | Haute | Le coach peut saisir un titre, une description, une date de début, une date de fin et une capacité maximale. La date de début doit être avant la date de fin. |
| US-007 | Coach | En tant que coach, je veux modifier mes séances afin de corriger ou mettre à jour les informations. | Haute | Le coach peut modifier uniquement ses propres séances. Un administrateur peut modifier toutes les séances. |
| US-008 | Coach | En tant que coach, je veux supprimer une séance afin de retirer un créneau qui n'est plus disponible. | Moyenne | Le coach peut supprimer uniquement ses propres séances. Une séance avec des réservations confirmées ne peut pas être supprimée. |
| US-009 | Coach | En tant que coach, je veux consulter mes séances afin de suivre mon planning. | Haute | Le coach voit uniquement les séances dont il est responsable. |

### Réservations

| ID | Rôle | User story | Priorité | Critères d'acceptation |
| --- | --- | --- | --- | --- |
| US-010 | Client | En tant que client, je veux réserver une séance afin d'y participer. | Haute | Le client peut réserver une séance future avec des places disponibles. Il ne peut pas réserver deux fois la même séance. |
| US-011 | Client | En tant que client, je veux être empêché de réserver une séance complète afin d'éviter le surbooking. | Haute | L'API refuse la réservation si le nombre de réservations confirmées atteint la capacité maximale. |
| US-012 | Client | En tant que client, je veux être empêché de réserver deux séances au même horaire afin d'éviter les conflits. | Moyenne | L'API refuse une réservation si elle chevauche une réservation confirmée existante. |
| US-013 | Client | En tant que client, je veux consulter mes réservations afin de suivre mes séances à venir. | Haute | Le client voit la liste de ses réservations avec les informations de séance associées. |
| US-014 | Client | En tant que client, je veux annuler une réservation afin de libérer ma place si je ne peux plus venir. | Haute | Le client peut annuler uniquement ses propres réservations. Le statut passe à CANCELLED. |
| US-015 | Coach | En tant que coach, je veux consulter les participants d'une séance afin de préparer mon cours. | Moyenne | Le coach peut voir les participants de ses propres séances. L'administrateur peut voir les participants de toutes les séances. |

### Administration

| ID | Rôle | User story | Priorité | Critères d'acceptation |
| --- | --- | --- | --- | --- |
| US-016 | Administrateur | En tant qu'administrateur, je veux consulter les utilisateurs afin de superviser la plateforme. | Haute | L'administrateur accède à la liste des utilisateurs avec leurs rôles et statuts. |
| US-017 | Administrateur | En tant qu'administrateur, je veux modifier le rôle d'un utilisateur afin de gérer les droits d'accès. | Haute | L'administrateur peut attribuer les rôles ADMIN, COACH ou CLIENT. |
| US-018 | Administrateur | En tant qu'administrateur, je veux activer ou désactiver un utilisateur afin de contrôler son accès. | Moyenne | Un utilisateur désactivé ne peut plus se connecter. |
| US-019 | Administrateur | En tant qu'administrateur, je veux consulter toutes les séances afin de superviser l'activité. | Moyenne | L'administrateur accède à une vue globale des séances. |
| US-020 | Administrateur | En tant qu'administrateur, je veux consulter toutes les réservations afin de suivre l'utilisation de la plateforme. | Moyenne | L'administrateur accède aux réservations et à leurs statuts. |

## Règles métier associées

- Un compte créé depuis l'inscription publique reçoit le rôle CLIENT.
- Un utilisateur désactivé ne peut pas se connecter.
- Une séance doit avoir une date de début antérieure à sa date de fin.
- Une séance passée ne peut pas être réservée.
- Une séance complète ne peut plus recevoir de réservation.
- Un client ne peut pas réserver deux fois la même séance.
- Un client ne peut pas réserver deux séances qui se chevauchent.
- Un client ne peut annuler que ses propres réservations.
- Un coach ne peut gérer que ses propres séances.
- Un administrateur peut superviser les utilisateurs, les séances et les réservations.

## Stories hors MVP ou bonus

| ID | Rôle | User story | Priorité | Statut |
| --- | --- | --- | --- | --- |
| US-021 | Utilisateur | En tant qu'utilisateur, je veux rechercher une séance afin de trouver rapidement une activité. | Basse | Non implémenté |
| US-022 | Utilisateur | En tant qu'utilisateur, je veux paginer la liste des séances afin de naviguer facilement dans un grand volume de données. | Basse | Non implémenté |
| US-023 | Administrateur | En tant qu'administrateur, je veux disposer d'une CI/CD afin d'automatiser les tests et le déploiement. | Basse | Non implémenté |
