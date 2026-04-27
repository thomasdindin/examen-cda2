import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';

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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: RegisterDto & { password: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
      },
      select: USER_SELECT,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
