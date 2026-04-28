import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function main() {
  const hash = (password: string) => bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sportify.fr' },
    update: {},
    create: {
      email: 'admin@sportify.fr',
      password: await hash('Password123!'),
      firstname: 'Admin',
      lastname: 'Sportify',
      role: 'ADMIN',
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: 'coach@sportify.fr' },
    update: {},
    create: {
      email: 'coach@sportify.fr',
      password: await hash('Password123!'),
      firstname: 'Alice',
      lastname: 'Coach',
      role: 'COACH',
    },
  });

  await prisma.user.upsert({
    where: { email: 'client@sportify.fr' },
    update: {},
    create: {
      email: 'client@sportify.fr',
      password: await hash('Password123!'),
      firstname: 'Bob',
      lastname: 'Client',
      role: 'CLIENT',
    },
  });

  const now = new Date();
  const sessions = [
    {
      title: 'Coaching musculation',
      description: 'Séance force débutant',
      startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      maxParticipants: 8,
    },
    {
      title: 'Cardio training',
      description: 'Endurance et cardio intensif',
      startAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      maxParticipants: 12,
    },
    {
      title: 'Mobilité',
      description: 'Stretching et mobilité articulaire',
      startAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      maxParticipants: 10,
    },
    {
      title: 'Préparation physique',
      description: 'Conditionnement physique complet',
      startAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      maxParticipants: 6,
    },
    {
      title: 'Cross training',
      description: 'Circuit training fonctionnel',
      startAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      maxParticipants: 10,
    },
  ];

  for (const s of sessions) {
    await prisma.session.upsert({
      where: {
        id: (
          await prisma.session
            .findFirst({ where: { title: s.title, coachId: coach.id } })
            .then((r) => r ?? { id: 'not-found' })
        ).id,
      },
      update: {},
      create: { ...s, coachId: coach.id },
    });
  }

  console.log('✅ Seed terminé.');
  console.log(`  Admin  : admin@sportify.fr / Password123!`);
  console.log(`  Coach  : coach@sportify.fr / Password123!`);
  console.log(`  Client : client@sportify.fr / Password123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
