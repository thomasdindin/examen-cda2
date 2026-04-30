import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

const clientUser = {
  sub: 'client-id',
  email: 'client@mail.com',
  role: Role.CLIENT,
};

const futureSession = {
  id: 'session-id',
  title: 'Test',
  startAt: new Date(Date.now() + 86400000),
  endAt: new Date(Date.now() + 90000000),
  maxParticipants: 5,
  coachId: 'coach-id',
};

const mockPrisma = {
  session: { findUnique: jest.fn() },
  reservation: {
    count: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ReservationsService', () => {
  let service: ReservationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('crée une réservation si places disponibles', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(futureSession);
      mockPrisma.reservation.count.mockResolvedValue(2);
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue({
        id: 'resa-id',
        userId: 'client-id',
        sessionId: 'session-id',
        status: 'CONFIRMED',
        session: futureSession,
      });

      const result = await service.create('session-id', clientUser);
      expect(result.status).toBe('CONFIRMED');
    });

    it('refuse si plus de places disponibles', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(futureSession);
      mockPrisma.reservation.count.mockResolvedValue(5);

      await expect(service.create('session-id', clientUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuse si conflit horaire', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(futureSession);
      mockPrisma.reservation.count.mockResolvedValue(0);
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      mockPrisma.reservation.findFirst.mockResolvedValue({
        id: 'conflict-resa',
      });

      await expect(service.create('session-id', clientUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('refuse de réserver une séance passée', async () => {
      const pastSession = {
        ...futureSession,
        startAt: new Date(Date.now() - 86400000),
        endAt: new Date(Date.now() - 82800000),
      };
      mockPrisma.session.findUnique.mockResolvedValue(pastSession);

      await expect(service.create('session-id', clientUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("lève NotFoundException si la séance n'existe pas", async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.create('inexistant', clientUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève ConflictException si la séance est déjà réservée (CONFIRMED)', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(futureSession);
      mockPrisma.reservation.count.mockResolvedValue(0);
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'resa-id',
        userId: 'client-id',
        status: 'CONFIRMED',
      });

      await expect(service.create('session-id', clientUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('réactive une réservation précédemment annulée', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(futureSession);
      mockPrisma.reservation.count.mockResolvedValue(0);
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'resa-id',
        userId: 'client-id',
        status: 'CANCELLED',
      });
      mockPrisma.reservation.update.mockResolvedValue({
        id: 'resa-id',
        status: 'CONFIRMED',
        session: futureSession,
      });

      const result = await service.create('session-id', clientUser);
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('cancel', () => {
    it('passe le statut à CANCELLED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'resa-id',
        userId: 'client-id',
        status: 'CONFIRMED',
      });
      mockPrisma.reservation.update.mockResolvedValue({
        id: 'resa-id',
        status: 'CANCELLED',
      });

      const result = await service.cancel('resa-id', clientUser);
      expect(result.status).toBe('CANCELLED');
    });

    it("lève NotFoundException si la réservation n'existe pas", async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.cancel('inexistant', clientUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("lève ForbiddenException si l'utilisateur n'est pas propriétaire", async () => {
      const otherUser = {
        sub: 'autre-id',
        email: 'autre@mail.com',
        role: Role.CLIENT,
      };
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'resa-id',
        userId: 'client-id',
        status: 'CONFIRMED',
      });

      await expect(service.cancel('resa-id', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lève BadRequestException si la réservation est déjà annulée', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'resa-id',
        userId: 'client-id',
        status: 'CANCELLED',
      });

      await expect(service.cancel('resa-id', clientUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
