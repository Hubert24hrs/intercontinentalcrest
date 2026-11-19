import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { maskSsn } from '../loans/loan-products';
import { creditCoins } from '../crypto/crypto-ledger';
import { CryptoService } from '../crypto/crypto.service';
import { newReference } from '../common/pagination';

const MAX_SINGLE_ADJUSTMENT = 500_000;
const PRIVILEGED_ROLES = ['admin', 'super_admin'];

export interface Actor {
  id: string;
  role: string;
  email: string;
}

function money(n: number | Decimal): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingKyc,
      totalDeposits,
      activeLoans,
      pendingLoans,
      totalInvestments,
      totalCryptoOrders,
      openSupport,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { status: 'suspended' } }),
      this.prisma.kycDocument.count({ where: { status: 'pending' } }),
      this.prisma.account.aggregate({ _sum: { balance: true } }),
      this.prisma.loan.count({ where: { status: { in: ['approved', 'active'] } } }),
      this.prisma.loan.count({ where: { status: 'pending' } }),
      this.prisma.investment.aggregate({ _sum: { principalAmount: true }, where: { status: { not: 'closed' } } }),
      this.prisma.cryptoOrder.count(),
      this.prisma.supportConversation.count({ where: { status: 'open' } }),
    ]);

    const [recentUsers, recentTransactions] = await Promise.all([
      this.prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
      }),
      this.prisma.transaction.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          senderAccount: { include: { user: { select: { fullName: true } } } },
          receiverAccount: { include: { user: { select: { fullName: true } } } },
        },
      }),
    ]);

    return {
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        pendingKyc,
        totalDeposits: totalDeposits._sum.balance || 0,
        activeLoans,
        pendingLoans,
        totalInvestments: totalInvestments._sum.principalAmount || 0,
        totalCryptoOrders,
        openSupport,
      },
      recentUsers,
      recentTransactions,
    };
  }

  async getAllUsers(page = 1, limit = 20, search?: string, role?: string, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (search?.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { accounts: { some: { accountNumber: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          _count: { select: { accounts: true, loans: true, investments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          orderBy: { createdAt: 'asc' },
          include: {
            sentTransfers: { take: 5, orderBy: { createdAt: 'desc' } },
            receivedTransfers: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        },
        kycDocuments: { orderBy: { createdAt: 'desc' } },
        loans: { orderBy: { createdAt: 'desc' } },
        investments: { orderBy: { createdAt: 'desc' } },
        cryptoHoldings: true,
        cryptoOrders: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Never expose credentials or second-factor secrets, even to administrators.
    const { passwordHash, twoFactorSecret, passwordResetToken, passwordResetExpiry, ...safe } = user;
    return { ...safe, loans: safe.loans.map((l) => ({ ...l, ssn: maskSsn(l.ssn) })) };
  }

  private async loadTarget(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Admins manage customers; only a super admin may act on other administrators. */
  private assertCanManage(actor: Actor, target: { id: string; role: string }) {
    if (actor.id === target.id) throw new BadRequestException('You cannot change your own account here');
    if (PRIVILEGED_ROLES.includes(target.role) && actor.role !== 'super_admin') {
      throw new ForbiddenException('Only a super admin can manage administrator accounts');
    }
    if (target.role === 'super_admin') {
      throw new ForbiddenException('Super admin accounts cannot be modified from the admin console');
    }
  }

  async updateUserStatus(userId: string, status: string, actor: Actor) {
    const user = await this.loadTarget(userId);
    this.assertCanManage(actor, user);

    const updated = await this.prisma.user.update({ where: { id: userId }, data: { status } });
    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: 'UPDATE_USER_STATUS',
        entityType: 'User',
        entityId: userId,
        oldValues: JSON.stringify({ status: user.status }),
        newValues: JSON.stringify({ status }),
      },
    });
    return { message: 'User status updated', user: { id: updated.id, status: updated.status } };
  }

  async updateUserRole(userId: string, role: string, actor: Actor) {
    if (actor.role !== 'super_admin') throw new ForbiddenException('Only a super admin can change roles');
    const user = await this.loadTarget(userId);
    this.assertCanManage(actor, user);
    if (role === 'super_admin') throw new ForbiddenException('The super admin role cannot be granted from the console');

    const updated = await this.prisma.user.update({ where: { id: userId }, data: { role } });
    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: userId,
        oldValues: JSON.stringify({ role: user.role }),
        newValues: JSON.stringify({ role }),
      },
    });
    return { message: 'User role updated', user: { id: updated.id, role: updated.role } };
  }

  async toggleAccountFreeze(accountId: string, isFrozen: boolean, actor: Actor) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId }, include: { user: true } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== actor.id && PRIVILEGED_ROLES.includes(account.user.role) && actor.role !== 'super_admin') {
      throw new ForbiddenException('Only a super admin can freeze administrator accounts');
    }

    const updated = await this.prisma.account.update({ where: { id: accountId }, data: { isFrozen } });
    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: isFrozen ? 'FREEZE_ACCOUNT' : 'UNFREEZE_ACCOUNT',
        entityType: 'Account',
        entityId: accountId,
        oldValues: JSON.stringify({ isFrozen: account.isFrozen }),
        newValues: JSON.stringify({ isFrozen }),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: account.userId,
        title: isFrozen ? 'Account frozen' : 'Account unfrozen',
        message: isFrozen
          ? `Account ${account.accountNumber} has been frozen. Contact support for details.`
          : `Account ${account.accountNumber} is active again.`,
        type: isFrozen ? 'warning' : 'success',
      },
    });

    return {
      message: `Account ${isFrozen ? 'frozen' : 'unfrozen'}`,
      account: { id: updated.id, isFrozen: updated.isFrozen },
    };
  }

  async getAllTransactions(page = 1, limit = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (search?.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { transactionReference: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { senderAccount: { accountNumber: { contains: q, mode: 'insensitive' } } },
        { receiverAccount: { accountNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          senderAccount: { include: { user: { select: { fullName: true, email: true } } } },
          receiverAccount: { include: { user: { select: { fullName: true, email: true } } } },
          performedByAdmin: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async creditCrypto(
    userId: string,
    dto: { coinId: string; quantity: number; reason?: string },
    actor: Actor,
  ) {
    const user = await this.loadTarget(userId);
    const markets = await this.cryptoService.getLiveMarkets();
    const coin = markets.find((c) => c.id === dto.coinId);
    if (!coin) throw new BadRequestException('Unknown asset');

    const ref = { coinId: coin.id, coinSymbol: coin.symbol.toUpperCase(), coinName: coin.name };
    const quantity = new Decimal(dto.quantity.toFixed(8));
    const price = coin.current_price || 0;

    await this.prisma.$transaction(async (tx) => {
      await creditCoins(tx, user.id, ref, quantity, price);
      await tx.cryptoOrder.create({
        data: {
          userId: user.id,
          ...ref,
          type: 'deposit',
          quantity,
          priceAtTime: new Decimal(price.toFixed(8)),
          totalUsd: quantity.times(price).toDecimalPlaces(2),
          fee: new Decimal(0),
          status: 'completed',
        },
      });
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: 'ADMIN_CREDIT_CRYPTO',
        entityType: 'CryptoHolding',
        entityId: user.id,
        newValues: JSON.stringify({ ...ref, quantity: Number(quantity), reason: dto.reason || null }),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: user.id,
        title: `${ref.coinSymbol} credited`,
        message: `${quantity.toString()} ${ref.coinSymbol} was credited to your crypto portfolio.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
        type: 'success',
      },
    });

    return { message: 'Crypto credited', ...ref, quantity: Number(quantity) };
  }

  async deleteUser(userId: string, actor: Actor) {
    const user = await this.loadTarget(userId);
    this.assertCanManage(actor, user);

    await this.prisma.$transaction(async (tx) => {
      const accounts = await tx.account.findMany({ where: { userId }, select: { id: true } });
      const accountIds = accounts.map((a) => a.id);

      // Keep counterparties' ledgers intact: detach rather than delete shared transactions.
      await tx.transaction.updateMany({ where: { senderAccountId: { in: accountIds } }, data: { senderAccountId: null } });
      await tx.transaction.updateMany({ where: { receiverAccountId: { in: accountIds } }, data: { receiverAccountId: null } });
      await tx.transaction.updateMany({ where: { performedByAdminId: userId }, data: { performedByAdminId: null } });
      await tx.kycDocument.updateMany({ where: { reviewerId: userId }, data: { reviewerId: null } });
      await tx.loan.updateMany({ where: { approvedBy: userId }, data: { approvedBy: null } });
      await tx.auditLog.updateMany({ where: { userId }, data: { userId: null } });

      await tx.loan.deleteMany({ where: { userId } });
      await tx.beneficiary.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } }); // remaining relations cascade
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: 'DELETE_USER',
        entityType: 'User',
        entityId: userId,
        oldValues: JSON.stringify({ email: user.email, fullName: user.fullName }),
      },
    });

    return { message: 'User deleted', userId };
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adjustBalance(customerId: string, dto: AdjustBalanceDto, actor: Actor, ipAddress?: string) {
    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be a positive number');
    if (amount > MAX_SINGLE_ADJUSTMENT) {
      throw new BadRequestException(`A single adjustment cannot exceed $${money(MAX_SINGLE_ADJUSTMENT)}`);
    }
    const reason = dto.reason?.trim();
    if (!reason || reason.length < 5) throw new BadRequestException('reason must be at least 5 characters');

    const account = await this.prisma.account.findUnique({ where: { id: dto.accountId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== customerId) throw new BadRequestException('Account does not belong to this customer');

    const decimal = new Decimal(amount.toFixed(2));
    const balanceBefore = Number(account.balance);
    const txRef = newReference(dto.type === 'credit' ? 'ADJ-CR' : 'ADJ-DB');

    const txRecord = await this.prisma.$transaction(async (tx) => {
      if (dto.type === 'debit') {
        const debited = await tx.account.updateMany({
          where: { id: account.id, availableBalance: { gte: decimal } },
          data: { balance: { decrement: decimal }, availableBalance: { decrement: decimal } },
        });
        if (debited.count !== 1) {
          throw new BadRequestException(`Insufficient available balance for a $${money(decimal)} debit`);
        }
      } else {
        await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: decimal }, availableBalance: { increment: decimal } },
        });
      }

      return tx.transaction.create({
        data: {
          transactionReference: txRef,
          senderAccountId: dto.type === 'debit' ? account.id : null,
          receiverAccountId: dto.type === 'credit' ? account.id : null,
          amount: decimal,
          fee: new Decimal(0),
          currency: account.currency,
          status: 'completed',
          type: dto.type === 'credit' ? 'admin_credit' : 'admin_debit',
          description: `${dto.type === 'credit' ? 'Credit' : 'Debit'} adjustment: ${reason}`,
          reason,
          adminReference: dto.reference?.trim() || null,
          performedByAdminId: actor.id,
          ipAddress: ipAddress || null,
        },
      });
    });

    const updatedAccount = await this.prisma.account.findUnique({
      where: { id: account.id },
      select: { balance: true, availableBalance: true },
    });
    const balanceAfter = Number(updatedAccount!.balance);

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: dto.type === 'credit' ? 'ADMIN_CREDIT_ACCOUNT' : 'ADMIN_DEBIT_ACCOUNT',
        entityType: 'Account',
        entityId: account.id,
        oldValues: JSON.stringify({ balance: balanceBefore }),
        newValues: JSON.stringify({
          balance: balanceAfter,
          amount,
          type: dto.type,
          reason,
          reference: dto.reference || null,
          adminEmail: actor.email,
          customerId,
          transactionReference: txRef,
        }),
        ipAddress: ipAddress || null,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: customerId,
        title: dto.type === 'credit' ? 'Account credited' : 'Account debited',
        message: `$${money(amount)} was ${dto.type === 'credit' ? 'credited to' : 'debited from'} ${account.accountNumber}. Reason: ${reason}.`,
        type: dto.type === 'credit' ? 'success' : 'warning',
      },
    });

    return {
      message: `Account ${dto.type === 'credit' ? 'credited' : 'debited'}`,
      transaction: txRecord,
      updatedBalance: balanceAfter,
      availableBalance: Number(updatedAccount!.availableBalance),
    };
  }

  async getAccountOwner(accountId: string): Promise<{ userId: string } | null> {
    return this.prisma.account.findUnique({ where: { id: accountId }, select: { userId: true } });
  }
}
