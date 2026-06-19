import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingKyc,
      totalDeposits,
      activeLoans,
      totalInvestments,
      totalCryptoOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { status: 'suspended' } }),
      this.prisma.kycDocument.count({ where: { status: 'pending' } }),
      this.prisma.account.aggregate({
        _sum: { balance: true },
      }),
      this.prisma.loan.count({ where: { status: 'approved' } }),
      this.prisma.investment.aggregate({
        _sum: { principalAmount: true },
      }),
      this.prisma.cryptoOrder.count(),
    ]);

    // Let's get recent registrations (last 5)
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Let's get recent transactions (last 5)
    const recentTransactions = await this.prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        senderAccount: {
          include: { user: { select: { fullName: true } } },
        },
        receiverAccount: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    return {
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        pendingKyc,
        totalDeposits: totalDeposits._sum.balance || 0,
        activeLoans,
        totalInvestments: totalInvestments._sum.principalAmount || 0,
        totalCryptoOrders,
      },
      recentUsers,
      recentTransactions,
    };
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};

    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
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
          _count: {
            select: { accounts: true, loans: true, investments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hide password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUserStatus(userId: string, status: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_USER_STATUS',
        entityType: 'User',
        entityId: userId,
        oldValues: JSON.stringify({ status: user.status }),
        newValues: JSON.stringify({ status }),
      },
    });

    return { message: 'User status updated successfully', user: { id: updated.id, status: updated.status } };
  }

  async updateUserRole(userId: string, role: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: userId,
        oldValues: JSON.stringify({ role: user.role }),
        newValues: JSON.stringify({ role }),
      },
    });

    return { message: 'User role updated successfully', user: { id: updated.id, role: updated.role } };
  }

  async toggleAccountFreeze(accountId: string, isFrozen: boolean, adminId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: { isFrozen },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: isFrozen ? 'FREEZE_ACCOUNT' : 'UNFREEZE_ACCOUNT',
        entityType: 'Account',
        entityId: accountId,
        oldValues: JSON.stringify({ isFrozen: account.isFrozen }),
        newValues: JSON.stringify({ isFrozen }),
      },
    });

    return { message: `Account ${isFrozen ? 'frozen' : 'unfrozen'} successfully`, account: { id: updated.id, isFrozen: updated.isFrozen } };
  }

  async getAllTransactions(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          senderAccount: {
            include: { user: { select: { fullName: true, email: true } } },
          },
          receiverAccount: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
