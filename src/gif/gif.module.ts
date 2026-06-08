import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GifController } from './gif.controller';
import { GifService } from './gif.service';
import { ARTSEARCH_REQUEST_TIMEOUT_MS } from './gif.constants';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [
    HttpModule.register({
      timeout: ARTSEARCH_REQUEST_TIMEOUT_MS,
    }),
  ],
  controllers: [GifController],
  providers: [GifService],
})
export class GifModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('gif');
  }
}
