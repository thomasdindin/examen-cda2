import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

const coachUser = {
  sub: 'coach-id',
  email: 'coach@mail.com',
  role: Role.COACH,
};
const adminUser = {
  sub: 'admin-id',
  email: 'admin@mail.com',
  role: Role.ADMIN,
};

const mockSession = {
  id: 'session-id',
  title: 'Test session',
  startAt: new Date(Date.now() + 86400000),
  endAt: new Date(Date.now() + 90000000),
  maxParticipants: 5,
  coachId: 'coach-id',
  coach: { id: 'coach-id', firstname: 'Alice', lastname: 'Coach' },
  _count: { reservations: 2 },
};

const mockPrisma = {
  session: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  reservation: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retourne les séances avec availablePlaces calculées', async () => {
      mockPrisma.session.findMany.mockResolvedValue([mockSession]);

      const result = await service.findAll();

      expect(result[0].reservedPlaces).toBe(2);
      expect(result[0].availablePlaces).toBe(3);
    });
  });

  describe('create', () => {
    it('crée une séance avec coachId = user.sub pour un COACH', async () => {
      mockPrisma.session.create.mockResolvedValue({ ...mockSession });

      await service.create(
        {
          title: 'Test',
          startAt: new Date(Date.now() + 3600000).toISOString(),
          endAt: new Date(Date.now() + 7200000).toISOString(),
          maxParticipants: 5,
        },
        coachUser,
      );

      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ coachId: 'coach-id' }),
        }),
      );
    });

    it('refuse si startAt >= endAt', async () => {
      const start = new Date(Date.now() + 7200000).toISOString();
      const end = new Date(Date.now() + 3600000).toISOString();

      await expect(
        service.create(
          { title: 'Bad', startAt: start, endAt: end, maxParticipants: 5 },
          coachUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it("lève NotFoundException si la séance n'existe pas", async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
