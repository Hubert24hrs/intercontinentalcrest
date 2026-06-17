import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
          balance: 9800.42,
          availableBalance: 9800.42,
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
          balance: 14500.00,
          availableBalance: 14500.00,
          currency: 'USD',
        },
      });

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
}
