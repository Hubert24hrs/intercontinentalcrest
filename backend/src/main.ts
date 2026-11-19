import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { getAccessSecret } from './auth/jwt.config';
import * as bcrypt from 'bcrypt';

let cachedServer: any;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://intercontinentalcrest.vercel.app',
];

function corsOriginHandler(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  // Requests without an Origin header (server-to-server, the Next.js proxy, curl) are allowed.
  if (!origin) return callback(null, true);
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    extra.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https:\/\/intercontinentalcrest[a-z0-9-]*\.vercel\.app$/.test(origin)
  ) {
    return callback(null, true);
  }
  callback(null, false);
}

/**
 * Keeps the super_admin login in sync with ADMIN_EMAIL / ADMIN_PASSWORD.
 * Only writes when something actually changed, so cold starts stay fast and
 * the password hash isn't rewritten on every boot.
 */
async function syncAdminCredentials(prisma: PrismaService) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!adminEmail || !adminPassword) return;

  try {
    const existing = await prisma.user.findFirst({ where: { role: 'super_admin' }, orderBy: { createdAt: 'asc' } });
    if (existing) {
      const sameEmail = existing.email === adminEmail;
      const samePassword = await bcrypt.compare(adminPassword, existing.passwordHash);
      if (sameEmail && samePassword && existing.status === 'active') return;
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: adminEmail,
          ...(samePassword ? {} : { passwordHash: await bcrypt.hash(adminPassword, 12) }),
          status: 'active',
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      console.log(`[Admin] Credentials synced for ${adminEmail}`);
    } else {
      await prisma.user.create({
        data: {
          fullName: 'Super Admin',
          email: adminEmail,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: 'super_admin',
          status: 'active',
          emailVerified: true,
        },
      });
      console.log(`[Admin] Account created for ${adminEmail}`);
    }
  } catch (e: any) {
    console.error('[Admin] Failed to sync credentials:', e?.message);
  }
}

function configure(app: INestApplication) {
  // Fail fast if a production deployment is missing its signing secret.
  getAccessSecret();

  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');
  http.use((_req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

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
}

/** Serverless entry (Vercel): build once per instance and reuse. */
export async function bootstrapExpress(): Promise<any> {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  configure(app);
  await syncAdminCredentials(app.get(PrismaService));
  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

/** Long-running entry (local / Docker). */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configure(app);
  await syncAdminCredentials(app.get(PrismaService));
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Intercontinental Crest API listening on http://localhost:${port}/api`);
}

if (!process.env.VERCEL) {
  bootstrap();
}
