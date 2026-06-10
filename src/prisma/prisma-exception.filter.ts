import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

/**
 * Maps known Prisma errors to HTTP responses so services don't have to wrap
 * every query in try/catch. Unmapped codes fall through to a 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.map(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unmapped Prisma error ${exception.code}`, exception);
    }

    response.status(status).json({ statusCode: status, message });
  }

  private map(exception: Prisma.PrismaClientKnownRequestError): {
    status: HttpStatus;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002': // unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          message: 'Resource already exists',
        };
      case 'P2025': // record required but not found
        return { status: HttpStatus.NOT_FOUND, message: 'Resource not found' };
      case 'P2003': // foreign key constraint failed
        return { status: HttpStatus.BAD_REQUEST, message: 'Invalid reference' };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
        };
    }
  }
}
