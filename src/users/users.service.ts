import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.prisma!.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.prisma!.user.findUnique({ where: { id } });
  }

  async create(email: string, passwordHash: string): Promise<User> {
    return this.prisma.prisma!.user.create({
      data: { email, passwordHash },
    });
  }
}