import { Module } from '@nestjs/common';
import { GifModule } from './gif/gif.module';
import { PrismaModule } from './prisma/prisma.module';
import { DrinkModule } from './drink/drink.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    HealthModule,
    GifModule,
    PrismaModule,
    DrinkModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
