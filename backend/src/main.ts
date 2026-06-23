import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
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

  // Allow any *.vercel.app domain and localhost in development
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
  ) {
    return callback(null, true);
  }

  callback(null, false);
}

async function syncAdminCredentials() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(adminPassword, 12);
    const existing = await prisma.user.findFirst({ where: { role: 'super_admin' } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { email: adminEmail, passwordHash: hash } });
      console.log(`[Admin] Credentials synced → ${adminEmail}`);
    }
  } catch (e: any) {
    console.error('[Admin] Failed to sync credentials:', e?.message);
  } finally {
    await prisma.$disconnect();
  }
}

export async function bootstrapExpress(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  // ── Serverless DB setup: copy bundled SQLite database to /tmp so it is writable ──
  if (process.env.VERCEL) {
    const destPath = '/tmp/dev.db';

    if (!fs.existsSync(destPath)) {
      // Try multiple possible source paths — Vercel may resolve cwd differently depending on bundler
      const candidatePaths = [
        path.resolve(process.cwd(), 'prisma', 'dev.db'),
        path.resolve(__dirname, '..', 'prisma', 'dev.db'),
        path.resolve(__dirname, 'prisma', 'dev.db'),
        '/var/task/prisma/dev.db',
      ];
      const srcPath = candidatePaths.find(p => { try { return fs.existsSync(p); } catch { return false; } });

      console.log(`[DB] Cold start — cwd=${process.cwd()} __dirname=${__dirname}`);
      console.log(`[DB] Resolved source: ${srcPath ?? 'NOT FOUND'}`);

      try {
        if (srcPath) {
          fs.copyFileSync(srcPath, destPath);
          fs.chmodSync(destPath, 0o666);
          console.log('[DB] Database copied to /tmp');
        } else {
          console.warn('[DB] prisma/dev.db not found in any candidate path — Prisma will create a fresh database');
        }
      } catch (err: any) {
        console.error('[DB] Failed to copy database:', err?.message);
      }
    } else {
      console.log('[DB] Warm start — reusing /tmp/dev.db');
    }

    process.env.DATABASE_URL = 'file:/tmp/dev.db';
    await syncAdminCredentials();
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
