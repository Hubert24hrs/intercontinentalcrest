import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { EmailService } from '../notifications/email.service';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  TWO_FA_TOKEN_TTL,
  getAccessSecret,
  getRefreshSecret,
} from './jwt.config';

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.usersService.create({
      fullName: registerDto.fullName.trim(),
      email: registerDto.email.trim().toLowerCase(),
      phone: registerDto.phone?.trim() || undefined,
      passwordHash,
    });

    try {
      const { text, html } = this.emailService.getWelcomeEmailTemplate(user.fullName);
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to Intercontinental Crest. Your demo account is ready',
        text,
        html,
      });
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  async validateUser(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = await this.usersService.findOneByEmail(normalizedEmail);

    // Same message for unknown email and wrong password (no account enumeration).
    if (!user) throw new UnauthorizedException('Invalid email or password');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
      throw new HttpException(
        `Too many failed sign in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'} or reset your password.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!matches) {
      await this.usersService.registerFailedLogin(user.id, MAX_FAILED_LOGINS, LOCKOUT_MINUTES);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account is not active. Please contact support.');
    }

    await this.usersService.registerSuccessfulLogin(user.id);
    return user;
  }

  async login(user: any) {
    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, typ: '2fa' },
        { expiresIn: TWO_FA_TOKEN_TTL, secret: getAccessSecret() },
      );
      return { require2Fa: true, tempToken };
    }
    return this.generateTokens(user);
  }

  async generateTokens(user: any) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, fullName: user.fullName, typ: 'access' },
      { expiresIn: ACCESS_TOKEN_TTL, secret: getAccessSecret() },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, typ: 'refresh' },
      { expiresIn: REFRESH_TOKEN_TTL, secret: getRefreshSecret() },
    );

    return {
      accessToken,
      refreshToken,
      user: this.toPublicUser(user),
    };
  }

  toPublicUser(user: any) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone ?? null,
      twoFactorEnabled: !!user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: getRefreshSecret() });
    } catch {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    if (!payload?.sub || payload.typ !== 'refresh') {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const user = await this.usersService.findOneById(payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    return this.generateTokens(user);
  }

  async getUserById(id: string) {
    return this.usersService.findOneById(id);
  }

  async generate2FaSecret(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.twoFactorEnabled) throw new BadRequestException('Two factor authentication is already turned on');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Intercontinental Crest', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    await this.usersService.update2FaSecret(userId, secret);

    return { secret, qrCodeUrl };
  }

  async verify2FaSetup(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Start two factor setup first');
    }

    const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isVerified) throw new BadRequestException('That code is not valid. Check your authenticator app and try again.');

    await this.usersService.enable2Fa(userId);
    return { success: true };
  }

  async authenticate2Fa(tempToken: string, code: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken, { secret: getAccessSecret() });
    } catch {
      throw new UnauthorizedException('Your verification session expired. Please sign in again.');
    }
    if (!payload?.sub || payload.typ !== '2fa') {
      throw new UnauthorizedException('Your verification session expired. Please sign in again.');
    }

    const user = await this.usersService.findOneById(payload.sub);
    if (!user || !user.twoFactorSecret || user.status !== 'active') {
      throw new UnauthorizedException('Your verification session expired. Please sign in again.');
    }

    const isVerified = authenticator.verify({ token: String(code || ''), secret: user.twoFactorSecret });
    if (!isVerified) throw new UnauthorizedException('Invalid authentication code');

    return this.generateTokens(user);
  }

  async disable2Fa(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two factor authentication is not turned on');
    }

    const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isVerified) throw new BadRequestException('Invalid authentication code');

    await this.usersService.disable2Fa(userId);
    return { success: true };
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    const user = await this.usersService.updateProfile(userId, {
      fullName: data.fullName?.trim() || undefined,
      phone: data.phone === undefined ? undefined : data.phone.trim() || null,
    });
    return this.toPublicUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await this.usersService.createPasswordResetToken(normalizedEmail);
    // Always return success to prevent email enumeration
    if (!result) return { success: true };

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${result.token}`;

    try {
      await this.emailService.sendEmail({
        to: normalizedEmail,
        subject: 'Reset your Intercontinental Crest password',
        text: `You requested a password reset. Use the link below to choose a new password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
        html: this.emailService.getPasswordResetEmailTemplate(result.user.fullName, resetLink),
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPasswordWithToken(token, newPassword);
    return { success: true };
  }
}
