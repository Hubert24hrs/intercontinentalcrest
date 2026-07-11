import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully.');
    } catch (error: any) {
      this.logger.error(`Database connection failed: ${error?.message}`);
    }
  }

  async onModuleDestroy() {
    // In serverless environments (Vercel), the NestJS app instance is cached
    // across invocations via the `cachedServer` singleton in main.ts.
    // Disconnecting here would tear down the connection pool between warm
    // invocations, causing P1001 errors on the next request.
    // In long-running (non-serverless) environments, disconnection is safe.
    if (!process.env.VERCEL) {
      await this.$disconnect();
    }
  }
}
