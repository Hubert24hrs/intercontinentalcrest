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

    // Send congratulatory account opening email
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
    // If user has 2FA enabled, return a temporary token instead of logging in
    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, isTemp2fa: true },
        { expiresIn: '5m' }, // 2FA verification session expires in 5 minutes
      );
      return {
        require2Fa: true,
        tempToken,
      };
    }

    return this.generateTokens(user);
  }

  async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async generate2FaSecret(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'Intercontinental Crest',
      secret,
    );

    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    
    // Save temporary secret to user record
    await this.usersService.update2FaSecret(userId, secret);

    return {
      secret,
      qrCodeUrl,
    };
  }

  async verify2FaSetup(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA Setup not initiated or secret not found');
    }

    const isVerified = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isVerified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Enable 2FA permanently
    await this.usersService.enable2Fa(userId);
    return { success: true };
  }

  async authenticate2Fa(tempToken: string, code: string) {
    try {
      const payload = this.jwtService.verify(tempToken);
      if (!payload.isTemp2fa) {
        throw new UnauthorizedException('Invalid temporary token');
      }

      const user = await this.usersService.findOneById(payload.sub);
      if (!user || !user.twoFactorSecret) {
        throw new UnauthorizedException('User or 2FA configuration not found');
      }

      const isVerified = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!isVerified) {
        throw new UnauthorizedException('Invalid 2FA code');
      }

      // Generate full log-in tokens
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

    const isVerified = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isVerified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.usersService.disable2Fa(userId);
    return { success: true };
  }
}
