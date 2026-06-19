import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

let cachedServer: any;

export async function bootstrapExpress(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  // Serverless DB setup for Vercel
  if (process.env.VERCEL) {
    const destPath = '/tmp/dev.db';
    const srcPath = path.resolve(process.cwd(), 'prisma/dev.db');
    
    if (!fs.existsSync(destPath)) {
      console.log(`Copying database from ${srcPath} to ${destPath}...`);
      try {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        fs.chmodSync(destPath, 0o666);
        console.log('Database copied successfully to /tmp.');
      } catch (err) {
        console.error('Failed to copy database to /tmp:', err);
      }
    } else {
      console.log('Database already exists in /tmp.');
    }
    // Override DATABASE_URL to use the /tmp database
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
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

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Middleware for reading cookies
  app.use(cookieParser());

  // Global pipe for DTO validation
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
