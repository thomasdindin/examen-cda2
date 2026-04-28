import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

const USER_SELECT = {
  id: true,
  email: true,
  firstname: true,
  lastname: true,
  role: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
};

const COACH_SELECT = { id: true, firstname: true, lastname: true };

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateUser(id: string, dto: UpdateUserAdminDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
      select: USER_SELECT,
    });
  }

  async getSessions() {
    const sessions = await this.prisma.session.findMany({
      include: {
        coach: { select: COACH_SELECT },
        _count: {
          select: { reservations: { where: { status: 'CONFIRMED' } } },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return sessions.map((s) => {
      const reservedPlaces = s._count.reservations;
      const { _count, ...rest } = s;
      return {
        ...rest,
        reservedPlaces,
        availablePlaces: rest.maxParticipants - reservedPlaces,
      };
    });
  }

  async getReservations() {
    return this.prisma.reservation.findMany({
      include: {
        user: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
        session: {
          select: { id: true, title: true, startAt: true, endAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
