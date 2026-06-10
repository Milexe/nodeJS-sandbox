import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ChatModule } from './chat/chat.module';
import { GifModule } from './gif/gif.module';
import { PrismaModule } from './prisma/prisma.module';
import { DrinkModule } from './drink/drink.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { throttlerConfig } from './throttle/throttle.config';
import { ThrottlerBehindProxyGuard } from './throttle/throttler-behind-proxy.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerConfig),
    HealthModule,
    ChatModule,
    GifModule,
    PrismaModule,
    DrinkModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}
