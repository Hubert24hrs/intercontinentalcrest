import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { ACCESS_TOKEN_TTL, getAccessSecret } from './jwt.config';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // registerAsync so the secret is resolved at runtime (Vercel populates env vars at invocation).
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getAccessSecret(),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, JwtStrategy, PassportModule, RolesGuard, JwtModule],
})
export class AuthModule {}
