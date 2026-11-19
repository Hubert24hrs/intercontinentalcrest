import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvestmentDto } from './dto/investment.dto';
import { newReference } from '../common/pagination';

function money(n: Decimal | number): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

@Injectable()
export class InvestmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getMyInvestments(userId: string) {
    return this.prisma.investment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async createInvestment(userId: string, dto: CreateInvestmentDto) {
    const principal = new Decimal(dto.principalAmount.toFixed(2));

    const account = await this.prisma.account.findUnique({ where: { id: dto.accountId } });
    if (!account || account.userId !== userId) throw new NotFoundException('Funding account not found');
    if (account.isFrozen) throw new BadRequestException('The funding account is frozen');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    let maturityDate: Date | null = dto.maturityDate ? new Date(dto.maturityDate) : null;
    if (!maturityDate && dto.termMonths) {
      maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + dto.termMonths);
    }
    const planName = dto.planName.trim();

    const investment = await this.prisma.$transaction(async (tx) => {
      const debited = await tx.account.updateMany({
        where: { id: account.id, isFrozen: false, availableBalance: { gte: principal } },
        data: { balance: { decrement: principal }, availableBalance: { decrement: principal } },
      });
      if (debited.count !== 1) throw new BadRequestException('Insufficient funds in the selected account');

      const created = await tx.investment.create({
        data: {
          userId,
          planName,
          principalAmount: principal,
          currentValue: principal,
          interestRate: dto.interestRate !== undefined ? new Decimal(dto.interestRate) : null,
          startDate,
          maturityDate,
          status: 'active',
        },
      });

      await tx.transaction.create({
        data: {
          transactionReference: newReference('INV'),
          senderAccountId: account.id,
          receiverAccountId: null,
          amount: principal,
          fee: new Decimal(0),
          currency: account.currency,
          status: 'completed',
          type: 'investment',
          description: `Investment in ${planName}`,
        },
      });

      return created;
    });

    try {
      await this.notificationsService.createNotification(
        userId,
        'Investment opened',
        `$${money(principal)} from ${account.accountNumber} was invested in "${planName}".${
          maturityDate ? ` Matures ${maturityDate.toLocaleDateString('en-US', { dateStyle: 'medium' })}.` : ''
        }`,
        'success',
      );
    } catch (err) {
      console.error('Failed to trigger investment notification:', err);
    }

    return investment;
  }

  async closeInvestment(userId: string, investmentId: string) {
    const investment = await this.prisma.investment.findUnique({ where: { id: investmentId } });
    if (!investment || investment.userId !== userId) throw new NotFoundException('Investment not found');
    if (investment.status !== 'active' && investment.status !== 'matured') {
      throw new BadRequestException('This investment is already closed');
    }

    const userAccount = await this.prisma.account.findFirst({
      where: { userId, isFrozen: false },
      orderBy: { accountType: 'asc' }, // checking before savings
    });
    if (!userAccount) throw new BadRequestException('No active account is available to receive the payout');

    const payoutAmount = investment.currentValue || investment.principalAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      // Guarded state change — prevents paying out the same investment twice.
      const closed = await tx.investment.updateMany({
        where: { id: investmentId, status: { in: ['active', 'matured'] } },
        data: { status: 'closed' },
      });
      if (closed.count !== 1) throw new BadRequestException('This investment is already closed');

      await tx.account.update({
        where: { id: userAccount.id },
        data: { balance: { increment: payoutAmount }, availableBalance: { increment: payoutAmount } },
      });

      await tx.transaction.create({
        data: {
          transactionReference: newReference('INV'),
          senderAccountId: null,
          receiverAccountId: userAccount.id,
          amount: payoutAmount,
          fee: new Decimal(0),
          currency: userAccount.currency,
          status: 'completed',
          type: 'credit',
          description: `Investment closed: ${investment.planName}`,
        },
      });

      return tx.investment.findUnique({ where: { id: investmentId } });
    });

    try {
      await this.notificationsService.createNotification(
        userId,
        'Investment closed',
        `"${investment.planName}" was closed and $${money(payoutAmount)} was paid into ${userAccount.accountNumber}.`,
        'success',
      );
    } catch (err) {
      console.error('Failed to trigger close investment notification:', err);
    }

    return result;
  }

  async getAllInvestments(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [investments, total] = await Promise.all([
      this.prisma.investment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investment.count({ where: whereClause }),
    ]);

    return { investments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Admin mark-to-market of a simulated investment. Audited. */
  async updateInvestmentValue(investmentId: string, currentValue: number, status: string | undefined, adminId: string) {
    const investment = await this.prisma.investment.findUnique({ where: { id: investmentId } });
    if (!investment) throw new NotFoundException('Investment not found');
    if (investment.status === 'closed') throw new BadRequestException('Closed investments cannot be revalued');

    const updated = await this.prisma.investment.update({
      where: { id: investmentId },
      data: { currentValue: new Decimal(currentValue.toFixed(2)), ...(status ? { status } : {}) },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_INVESTMENT_VALUE',
        entityType: 'Investment',
        entityId: investmentId,
        oldValues: JSON.stringify({ currentValue: Number(investment.currentValue), status: investment.status }),
        newValues: JSON.stringify({ currentValue, status: updated.status }),
      },
    });

    return updated;
  }
}
