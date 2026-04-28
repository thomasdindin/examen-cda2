import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sessionId: string, user: JwtUser) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Séance introuvable.');

    if (session.startAt <= new Date()) {
      throw new BadRequestException(
        'Impossible de réserver une séance passée.',
      );
    }

    const confirmedCount = await this.prisma.reservation.count({
      where: { sessionId, status: 'CONFIRMED' },
    });
    if (confirmedCount >= session.maxParticipants) {
      throw new BadRequestException(
        'Plus de places disponibles pour cette séance.',
      );
    }

    const existing = await this.prisma.reservation.findUnique({
      where: { userId_sessionId: { userId: user.sub, sessionId } },
    });
    if (existing) {
      if (existing.status === 'CONFIRMED') {
        throw new ConflictException('Vous avez déjà réservé cette séance.');
      }
      // Réactivation d'une réservation annulée
      return this.prisma.reservation.update({
        where: { id: existing.id },
        data: { status: 'CONFIRMED' },
        include: { session: true },
      });
    }

    // Vérification conflit horaire
    const conflictingReservation = await this.prisma.reservation.findFirst({
      where: {
        userId: user.sub,
        status: 'CONFIRMED',
        session: {
          startAt: { lt: session.endAt },
          endAt: { gt: session.startAt },
          id: { not: sessionId },
        },
      },
    });
    if (conflictingReservation) {
      throw new ConflictException(
        'Vous avez déjà une réservation sur ce créneau.',
      );
    }

    return this.prisma.reservation.create({
      data: { userId: user.sub, sessionId, status: 'CONFIRMED' },
      include: { session: true },
    });
  }

  async findMine(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            coach: { select: { id: true, firstname: true, lastname: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(id: string, user: JwtUser) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable.');

    if (user.role !== Role.ADMIN && reservation.userId !== user.sub) {
      throw new ForbiddenException(
        'Vous ne pouvez annuler que vos propres réservations.',
      );
    }

    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('Cette réservation est déjà annulée.');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
