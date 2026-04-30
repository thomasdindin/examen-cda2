import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('crée un utilisateur avec email unique', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@mail.com',
        firstname: 'John',
        lastname: 'Doe',
        role: 'CLIENT',
        enabled: true,
      });

      const result = await service.register({
        email: 'test@mail.com',
        password: 'Password123!',
        firstname: 'John',
        lastname: 'Doe',
      });

      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result.email).toBe('test@mail.com');
    });

    it('refuse un email déjà utilisé', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'existing',
        email: 'test@mail.com',
      });

      await expect(
        service.register({
          email: 'test@mail.com',
          password: 'Password123!',
          firstname: 'John',
          lastname: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('retourne un accessToken avec un mot de passe correct', async () => {
      const hashedPwd = await bcrypt.hash('Password123!', 10);

      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@mail.com',
        password: hashedPwd,
        firstname: 'John',
        lastname: 'Doe',
        role: 'CLIENT',
        enabled: true,
      });

      const result = await service.login({
        email: 'test@mail.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('refuse un mot de passe incorrect', async () => {
      const hashedPwd = await bcrypt.hash('CorrectPassword!', 10);

      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@mail.com',
        password: hashedPwd,
        enabled: true,
      });

      await expect(
        service.login({ email: 'test@mail.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("lève UnauthorizedException si l'email n'existe pas", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@mail.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si le compte est désactivé', async () => {
      const hashedPwd = await bcrypt.hash('Password123!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@mail.com',
        password: hashedPwd,
        enabled: false,
      });

      await expect(
        service.login({ email: 'test@mail.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it("retourne le profil de l'utilisateur connecté", async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@mail.com',
        firstname: 'John',
        lastname: 'Doe',
        role: 'CLIENT',
      });

      const result = await service.me('uuid-1');
      expect(result.id).toBe('uuid-1');
      expect(mockUsersService.findById).toHaveBeenCalledWith('uuid-1');
    });
  });
});
