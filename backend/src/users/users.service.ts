import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { fullName: string; email: string; passwordHash: string; phone?: string }): Promise<User> {
    const existing = await this.findOneByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email address already registered');
    }

    // Create user and initial bank accounts
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          passwordHash: data.passwordHash,
          role: 'customer',
          status: 'active', // Set active directly for local development convenience
          emailVerified: true,
        },
      });

      // Create checking account
      const checkingNo = 'CK-' + Math.floor(10000000 + Math.random() * 90000000);
      await tx.account.create({
        data: {
          accountNumber: checkingNo,
          userId: user.id,
          accountType: 'checking',
          balance: 0.00,
          availableBalance: 0.00,
          currency: 'USD',
        },
      });

      // Create savings account
      const savingsNo = 'SV-' + Math.floor(10000000 + Math.random() * 90000000);
      await tx.account.create({
        data: {
          accountNumber: savingsNo,
          userId: user.id,
          accountType: 'savings',
          balance: 0.00,
          availableBalance: 0.00,
          currency: 'USD',
        },
      });

      // Create pre-configured crypto wallets
      const defaultWallets = [
        { coinId: 'bitcoin', coinSymbol: 'BTC', coinName: 'Bitcoin', address: 'bc1quj2mqa6xt0kr47suvavff4lnak3pujv4efrz60' },
        { coinId: 'ethereum', coinSymbol: 'ETH', coinName: 'Ethereum', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
        { coinId: 'tether', coinSymbol: 'USDT', coinName: 'Tether', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
        { coinId: 'usd-coin', coinSymbol: 'USDC', coinName: 'USD Coin', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
        { coinId: 'binancecoin', coinSymbol: 'BNB', coinName: 'BNB', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
        { coinId: 'solana', coinSymbol: 'SOL', coinName: 'Solana', address: 'HFETb6Vz7Tgp5Xx2dURvxbxfs2AVPZHAhmvJewGNEBi8' },
        { coinId: 'ripple', coinSymbol: 'XRP', coinName: 'Ripple', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
      ];

      for (const w of defaultWallets) {
        await tx.cryptoWallet.create({
          data: {
            userId: user.id,
            coinId: w.coinId,
            coinSymbol: w.coinSymbol,
            coinName: w.coinName,
            address: w.address,
            balance: 0.00,
          },
        });
      }

      return user;
    });
  }

  async update2FaSecret(userId: string, secret: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
  }

  async enable2Fa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async disable2Fa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string }): Promise<User> {
    if (data.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Phone number already in use');
    }
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw new ConflictException('Current password is incorrect');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async createPasswordResetToken(email: string): Promise<{ token: string; user: User } | null> {
    const user = await this.findOneByEmail(email);
    if (!user) return null;
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });
    return { token, user };
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException('Reset token is invalid or has expired');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
    });
  }
}
