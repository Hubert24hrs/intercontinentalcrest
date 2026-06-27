import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateInvestmentDto {
  planName: string;
  principalAmount: number;
  interestRate?: number;
  termMonths?: number;
  startDate?: string;
  maturityDate?: string;
  accountId: string; // the source checking/savings account ID
}

@Injectable()
export class InvestmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getMyInvestments(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvestment(userId: string, dto: CreateInvestmentDto) {
    const principal = new Decimal(dto.principalAmount);

    if (dto.principalAmount <= 0) {
      throw new BadRequestException('Investment principal must be greater than 0');
    }

    // 1. Fetch and validate account
    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
    });
    if (!account) throw new NotFoundException('Funding source account not found');
    if (account.userId !== userId)
      throw new ForbiddenException('Account does not belong to you');
    if (account.isFrozen)
      throw new BadRequestException('Funding source account is frozen');
    if (account.availableBalance.lessThan(principal)) {
      throw new BadRequestException('Insufficient funds in the selected account');
    }

    const txRef = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    // 2. Perform transaction to deduct balance and create investment + ledger records
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from bank account
      await tx.account.update({
        where: { id: dto.accountId },
        data: {
          balance: { decrement: principal },
          availableBalance: { decrement: principal },
        },
      });

      // Create investment record
      const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
      let maturityDate: Date | null = null;
      if (dto.maturityDate) {
        maturityDate = new Date(dto.maturityDate);
      } else if (dto.termMonths) {
        maturityDate = new Date(startDate);
        maturityDate.setMonth(maturityDate.getMonth() + dto.termMonths);
      }

      const investment = await tx.investment.create({
        data: {
          userId,
          planName: dto.planName,
          principalAmount: principal,
          currentValue: principal,
          interestRate: dto.interestRate ? new Decimal(dto.interestRate) : null,
          startDate,
          maturityDate,
          status: 'active',
        },
      });

      // Create ledger transaction record
      await tx.transaction.create({
        data: {
          transactionReference: txRef,
          senderAccountId: account.id,
          receiverAccountId: null,
          amount: principal,
          fee: new Decimal(0),
          currency: account.currency,
          status: 'completed',
          type: 'investment',
          description: `Investment Capital: ${dto.planName}`,
        },
      });

      return investment;
    });

    try {
      const formattedAmount = `$${dto.principalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      await this.notificationsService.createNotification(
        userId,
        'Investment Portfolio Opened',
        `Successfully invested ${formattedAmount} from account ${account.accountNumber} into "${dto.planName}". Maturity date: ${dto.maturityDate ? new Date(dto.maturityDate).toLocaleDateString() : 'N/A'}.`,
        'success',
      );
    } catch (err) {
      console.error('Failed to trigger investment notification:', err);
    }

    return result;
  }

  async closeInvestment(userId: string, investmentId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
    });
    if (!investment) throw new NotFoundException('Investment not found');
    if (investment.userId !== userId)
      throw new ForbiddenException('Investment does not belong to you');
    if (investment.status !== 'active')
      throw new BadRequestException('Investment is already closed or inactive');

    // Find first active checking or savings account of the user to receive the funds
    const userAccount = await this.prisma.account.findFirst({
      where: { userId, isFrozen: false },
      orderBy: { accountType: 'asc' }, // checking usually comes before savings alphabetically
    });
    if (!userAccount) {
      throw new BadRequestException('No active bank account found to receive the payout');
    }

    const payoutAmount = investment.currentValue || investment.principalAmount;
    const txRef = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    const result = await this.prisma.$transaction(async (tx) => {
      // Credit bank account
      await tx.account.update({
        where: { id: userAccount.id },
        data: {
          balance: { increment: payoutAmount },
          availableBalance: { increment: payoutAmount },
        },
      });

      // Update investment status to closed
      const updatedInvestment = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: 'closed',
          updatedAt: new Date(),
        },
      });

      // Create ledger credit transaction
      await tx.transaction.create({
        data: {
          transactionReference: txRef,
          senderAccountId: null,
          receiverAccountId: userAccount.id,
          amount: payoutAmount,
          fee: new Decimal(0),
          currency: userAccount.currency,
          status: 'completed',
          type: 'credit',
          description: `Investment Liquidated: ${investment.planName}`,
        },
      });

      return updatedInvestment;
    });

    try {
      const formattedAmount = `$${Number(payoutAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      await this.notificationsService.createNotification(
        userId,
        'Investment Liquidated',
        `Successfully closed your investment "${investment.planName}". Payout of ${formattedAmount} credited to account ${userAccount.accountNumber}.`,
        'success',
      );
    } catch (err) {
      console.error('Failed to trigger close investment notification:', err);
    }

    return result;
  }

  async getAllInvestments(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [investments, total] = await Promise.all([
      this.prisma.investment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investment.count({ where: whereClause }),
    ]);

    return {
      investments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateInvestmentValue(
    investmentId: string,
    currentValue: number,
    status?: string,
  ) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
    });
    if (!investment) throw new NotFoundException('Investment not found');

    return this.prisma.investment.update({
      where: { id: investmentId },
      data: {
        currentValue: new Decimal(currentValue),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });
  }
}
