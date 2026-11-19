import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DEFAULT_WALLETS, demoDepositAddress } from '../wallets/demo-wallets';
import { generateAccountNumber } from '../accounts/account-number';

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: { fullName: string; email: string; passwordHash: string; phone?: string }): Promise<User> {
    const existing = await this.findOneByEmail(data.email);
    if (existing) throw new ConflictException('An account with this email already exists');

    if (data.phone) {
      const phoneTaken = await this.prisma.user.findFirst({ where: { phone: data.phone } });
      if (phoneTaken) throw new ConflictException('This phone number is already registered');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          passwordHash: data.passwordHash,
          role: 'customer',
          status: 'active',
          emailVerified: true,
        },
      });

      for (const accountType of ['checking', 'savings']) {
        await tx.account.create({
          data: {
            accountNumber: await generateAccountNumber(tx),
            userId: user.id,
            accountType,
            balance: 0,
            availableBalance: 0,
            currency: 'USD',
          },
        });
      }

      await tx.cryptoWallet.createMany({
        data: DEFAULT_WALLETS.map((w) => ({
          userId: user.id,
          coinId: w.coinId,
          coinSymbol: w.coinSymbol,
          coinName: w.coinName,
          address: demoDepositAddress(user.id, w.coinSymbol),
          balance: 0,
        })),
      });

      return user;
    });
  }

  async registerFailedLogin(userId: string, maxAttempts: number, lockMinutes: number): Promise<void> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    if (updated.failedLoginAttempts >= maxAttempts) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + lockMinutes * 60_000) },
      });
    }
  }

  async registerSuccessfulLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
    });
  }

  async update2FaSecret(userId: string, secret: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
  }

  async enable2Fa(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  }

  async disable2Fa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string | null }): Promise<User> {
    if (data.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Phone number already in use');
    }
    const update: { fullName?: string; phone?: string | null } = {};
    if (data.fullName !== undefined) update.fullName = data.fullName;
    if (data.phone !== undefined) update.phone = data.phone;
    return this.prisma.user.update({ where: { id: userId }, data: update });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw new BadRequestException('Your current password is incorrect');
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new BadRequestException('Choose a password you have not used for this account');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async createPasswordResetToken(email: string): Promise<{ token: string; user: User } | null> {
    const user = await this.findOneByEmail(email);
    if (!user) return null;
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashResetToken(token),
        passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    return { token, user };
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashResetToken(token),
        passwordResetExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException('This reset link is invalid or has expired. Request a new one.');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}
