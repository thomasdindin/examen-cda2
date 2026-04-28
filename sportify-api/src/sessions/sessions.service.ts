import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SearchSessionsDto } from './dto/search-sessions.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

const COACH_SELECT = { id: true, firstname: true, lastname: true };

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SearchSessionsDto = {}) {
    const { search, coachId, from, to, page = 1, limit = 10 } = query;

    const where: Prisma.SessionWhereInput = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (coachId) where.coachId = coachId;
    if (from || to) {
      where.startAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const include = {
      coach: { select: COACH_SELECT },
      _count: {
        select: {
          reservations: { where: { status: ReservationStatus.CONFIRMED } },
        },
      },
    } satisfies Prisma.SessionInclude;

    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        include,
        orderBy: { startAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: sessions.map((s) => this.formatSession(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        coach: { select: COACH_SELECT },
        _count: {
          select: { reservations: { where: { status: 'CONFIRMED' } } },
        },
      },
    });

    if (!session) throw new NotFoundException('Séance introuvable.');
    return this.formatSession(session);
  }

  async create(dto: CreateSessionDto, user: JwtUser) {
    this.validateDates(dto.startAt, dto.endAt);

    const coachId =
      user.role === Role.COACH ? user.sub : (dto.coachId ?? user.sub);

    return this.prisma.session.create({
      data: {
        title: dto.title,
        description: dto.description,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        maxParticipants: dto.maxParticipants,
        coachId,
      },
      include: { coach: { select: COACH_SELECT } },
    });
  }

  async update(id: string, dto: UpdateSessionDto, user: JwtUser) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Séance introuvable.');

    this.checkOwnership(session.coachId, user);

    if (dto.startAt || dto.endAt) {
      const startAt = dto.startAt ?? session.startAt.toISOString();
      const endAt = dto.endAt ?? session.endAt.toISOString();
      this.validateDates(startAt, endAt);
    }

    return this.prisma.session.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startAt && { startAt: new Date(dto.startAt) }),
        ...(dto.endAt && { endAt: new Date(dto.endAt) }),
        ...(dto.maxParticipants && { maxParticipants: dto.maxParticipants }),
      },
      include: { coach: { select: COACH_SELECT } },
    });
  }

  async remove(id: string, user: JwtUser) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Séance introuvable.');

    this.checkOwnership(session.coachId, user);

    const confirmedCount = await this.prisma.reservation.count({
      where: { sessionId: id, status: 'CONFIRMED' },
    });

    if (confirmedCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une séance avec des réservations confirmées.',
      );
    }

    await this.prisma.session.delete({ where: { id } });
    return { message: 'Séance supprimée.' };
  }

  async getParticipants(id: string, user: JwtUser) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Séance introuvable.');

    this.checkOwnership(session.coachId, user);

    const reservations = await this.prisma.reservation.findMany({
      where: { sessionId: id, status: 'CONFIRMED' },
      include: {
        user: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
    });

    return reservations.map((r) => r.user);
  }

  private checkOwnership(coachId: string, user: JwtUser) {
    if (user.role !== Role.ADMIN && user.sub !== coachId) {
      throw new ForbiddenException(
        "Vous n'êtes pas propriétaire de cette séance.",
      );
    }
  }

  private validateDates(startAt: string, endAt: string) {
    if (new Date(startAt) >= new Date(endAt)) {
      throw new BadRequestException(
        'La date de début doit être avant la date de fin.',
      );
    }
  }

  private formatSession(session: any) {
    const reservedPlaces = session._count?.reservations ?? 0;
    const { _count, ...rest } = session;
    return {
      ...rest,
      reservedPlaces,
      availablePlaces: rest.maxParticipants - reservedPlaces,
    };
  }
}
