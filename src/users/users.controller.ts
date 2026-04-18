import { Controller, Post, Body, ConflictException, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
  
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.usersService.create(dto.email, passwordHash);
      return { id: user.id, email: user.email, createdAt: user.createdAt };
    } catch (error: any) {
      // P2002 — Prisma unique constraint violation (race condition)
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }
  }