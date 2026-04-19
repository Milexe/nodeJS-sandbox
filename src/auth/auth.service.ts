import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    
    
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: process.env.JWT_ACCESS_SECRET!,
          expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN!, 10),
        }),
        this.jwtService.signAsync(payload, {
          secret: process.env.JWT_REFRESH_SECRET!,
          expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN!, 10),
        }),
      ]);

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      await this.prisma.refreshToken.create({
        data: {
          token: tokenHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN!, 10) * 1000),
        },
      });
    return { accessToken, refreshToken };
  }   

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
  
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
  
    const { passwordHash, createdAt, ...result } = user;
  
    return result;
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET!,
      });
    } catch {
      throw new UnauthorizedException('Невалидный refresh токен');
    }
  
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });
  
    if (!storedToken) {
      throw new UnauthorizedException('Refresh токен отозван или не существует');
    }
  
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh токен истёк');
    }
  
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
  
    const newPayload = { sub: payload.sub, email: payload.email, role: payload.role };
  
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(newPayload, {
        secret: process.env.JWT_ACCESS_SECRET!,
        expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN!, 10),
      }),
      this.jwtService.signAsync(newPayload, {
        secret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN!, 10),
      }),
    ]);
  
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  
    await this.prisma.refreshToken.create({
      data: {
        token: newTokenHash,
        userId: payload.sub,
        expiresAt: new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN!, 10) * 1000),
      },
    });
  
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
  async logout(refreshToken: string) {
    
    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET!,
      });
    } catch {
      throw new UnauthorizedException('Невалидный refresh токен');
    }
  
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });
  
    if (!storedToken) {
      throw new UnauthorizedException('Refresh токен не найден');
    }
  
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
  
    return { message: 'Вы успешно вышли из системы' };
  }
}
