import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
}
