import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const DATABASE_URL_ENV_KEY = 'DATABASE_URL';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private client: PrismaClient | null = null;

  private createClientIfNeeded(): PrismaClient | null {
    if (this.client) return this.client;

    const databaseUrl = process.env[DATABASE_URL_ENV_KEY];
    if (databaseUrl === undefined || databaseUrl.trim() === '') {
      return null;
    }

    this.client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
    return this.client;
  }

  get prisma(): PrismaClient | null {
    return this.createClientIfNeeded();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    await this.client.$disconnect();
  }
}
