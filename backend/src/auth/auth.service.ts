import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      phone: registerDto.phone,
      passwordHash,
    });

    try {
      const { text, html } = this.emailService.getWelcomeEmailTemplate(user.fullName);
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to Intercontinental Crest — Account Opened Successfully!',
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
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(user: any) {
    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, isTemp2fa: true },
        { expiresIn: '5m' },
      );
      return { require2Fa: true, tempToken };
    }
    return this.generateTokens(user);
  }

  async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, fullName: user.fullName };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (!payload?.sub) throw new UnauthorizedException('Refresh token is invalid or expired');

    // Try DB for fresh user data; fall back to payload on cold-start DB miss
    // (Vercel spins up fresh SQLite instances that may not have recently-registered users)
    const user = await this.usersService.findOneById(payload.sub).catch(() => null);
    if (user) return this.generateTokens(user);

    if (!payload.email || !payload.role) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    const newPayload = { sub: payload.sub, email: payload.email, role: payload.role, fullName: payload.fullName };
    return {
      accessToken: this.jwtService.sign(newPayload, { expiresIn: '8h' }),
      refreshToken: this.jwtService.sign(newPayload, { expiresIn: '30d' }),
      user: { id: payload.sub, email: payload.email, role: payload.role, fullName: payload.fullName },
    };
  }

  async getUserById(id: string) {
    return this.usersService.findOneById(id).catch(() => null);
  }

  async generate2FaSecret(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Intercontinental Crest', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    await this.usersService.update2FaSecret(userId, secret);

    return { secret, qrCodeUrl };
  }

  async verify2FaSetup(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA Setup not initiated or secret not found');
    }

    const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isVerified) throw new UnauthorizedException('Invalid 2FA code');

    await this.usersService.enable2Fa(userId);
    return { success: true };
  }

  async authenticate2Fa(tempToken: string, code: string) {
    try {
      const payload = this.jwtService.verify(tempToken);
      if (!payload.isTemp2fa) throw new UnauthorizedException('Invalid temporary token');

      const user = await this.usersService.findOneById(payload.sub);
      if (!user || !user.twoFactorSecret) {
        throw new UnauthorizedException('User or 2FA configuration not found');
      }

      const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
      if (!isVerified) throw new UnauthorizedException('Invalid 2FA code');

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired 2FA verification session');
    }
  }

  async disable2Fa(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA configuration not found');
    }

    const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isVerified) throw new UnauthorizedException('Invalid 2FA code');

    await this.usersService.disable2Fa(userId);
    return { success: true };
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    const user = await this.usersService.updateProfile(userId, data);
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const result = await this.usersService.createPasswordResetToken(email);
    // Always return success to prevent email enumeration
    if (!result) return { success: true };

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${result.token}`;

    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Intercontinental Crest — Password Reset Request',
        text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0A2342; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #00B7F1; margin: 0; font-size: 22px;">INTERCONTINENTAL CREST</h1>
            </div>
            <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <h2 style="color: #0A2342;">Password Reset Request</h2>
              <p style="color: #6b7280;">Hi ${result.user.fullName},</p>
              <p style="color: #6b7280;">We received a request to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #00B7F1, #0078B3); color: white; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 600; display: inline-block;">Reset My Password</a>
              </div>
              <p style="color: #9ca3af; font-size: 13px;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email — your account is safe.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">Intercontinental Crest — Secure Global Banking</p>
            </div>
          </div>
        `,
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
