import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GifController } from './gif.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [HttpModule],
  controllers: [GifController],
})
export class GifModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('gif');
  }
}