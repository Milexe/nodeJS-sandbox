import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('GifRoute');

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
      );
    });

    next();
  }
}
