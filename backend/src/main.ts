import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

let cachedServer: any;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://intercontinentalcrest.vercel.app',
  'https://intercontinentalcrest-backend.vercel.app',
];

function corsOriginHandler(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  // Allow requests with no origin (mobile apps, Postman, server-to-server)
  if (!origin) return callback(null, true);

  if (
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin)
  ) {
    return callback(null, true);
  }

  callback(null, false);
}

/**
 * Ensure the super_admin account exists with the latest credentials from env vars.
 * Runs once per cold start using the singleton PrismaService to avoid connection leaks.
 */
async function syncAdminCredentials(prisma: PrismaService) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  try {
    const hash = await bcrypt.hash(adminPassword, 12);
    const existing = await prisma.user.findFirst({ where: { role: 'super_admin' } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { email: adminEmail, passwordHash: hash } });
      console.log(`[Admin] Credentials synced → ${adminEmail}`);
    }
  } catch (e: any) {
    console.error('[Admin] Failed to sync credentials:', e?.message);
  }
}

export async function bootstrapExpress(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: corsOriginHandler,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Sync admin credentials on cold start using the singleton PrismaService
  const prisma = app.get(PrismaService);
  await syncAdminCredentials(prisma);

  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: corsOriginHandler,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS Banking API running on: http://localhost:${port}/api`);
}

if (!process.env.VERCEL) {
  bootstrap();
}

