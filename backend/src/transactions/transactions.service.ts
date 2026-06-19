import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service';

export interface TransferDto {
  fromAccountId: string;
  toAccountNumber?: string;
  toBeneficiaryId?: string;
  amount: number;
  description?: string;
  currency?: string;
  type?: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getTransactionsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    // Get all account IDs for this user
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const whereClause: any = {
      OR: [
        { senderAccountId: { in: accountIds } },
        { receiverAccountId: { in: accountIds } },
      ],
    };
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          senderAccount: { select: { accountNumber: true, accountType: true } },
          receiverAccount: { select: { accountNumber: true, accountType: true } },
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

  async transfer(userId: string, dto: TransferDto) {
    const fromAccountId = dto.fromAccountId || (dto as any).senderAccountId;
    const toAccountNumber = dto.toAccountNumber || (dto as any).receiverAccountNumber;

    // Validate sender account belongs to user
    const senderAccount = await this.prisma.account.findUnique({
      where: { id: fromAccountId },
    });
    if (!senderAccount) throw new NotFoundException('Source account not found');
    if (senderAccount.userId !== userId)
      throw new ForbiddenException('Account does not belong to you');
    if (senderAccount.isFrozen)
      throw new BadRequestException('Source account is frozen');

    const amount = new Decimal(dto.amount);

    if (senderAccount.availableBalance.lessThan(amount)) {
      throw new BadRequestException('Insufficient funds');
    }

    // Find receiver account
    let receiverAccount = null;
    if (toAccountNumber) {
      receiverAccount = await this.prisma.account.findUnique({
        where: { accountNumber: toAccountNumber },
      });
    }

    const txRef = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const isInternational = dto.type === 'international' || dto.type === 'international_transfer';
    const fee = new Decimal(isInternational ? 3.00 : 0);
    const totalDeduction = amount.plus(fee);

    const transaction = await this.prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.account.update({
        where: { id: senderAccount.id },
        data: {
          balance: { decrement: totalDeduction },
          availableBalance: { decrement: totalDeduction },
        },
      });

      // Credit receiver (if internal)
      if (receiverAccount) {
        await tx.account.update({
          where: { id: receiverAccount.id },
          data: {
            balance: { increment: amount },
            availableBalance: { increment: amount },
          },
        });
      }

      // Create transaction record
      const record = await tx.transaction.create({
        data: {
          transactionReference: txRef,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount?.id ?? null,
          amount,
          fee,
          currency: dto.currency || 'USD',
          status: 'completed',
          type: dto.type || 'transfer',
          description: dto.description || 'Fund Transfer',
        },
      });

      return record;
    });

    try {
      const formattedAmount = `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${dto.currency || 'USD'}`;

      // Notify Sender
      await this.notificationsService.createNotification(
        userId,
        'Fund Transfer Sent',
        `Successfully transferred ${formattedAmount} to ${toAccountNumber || receiverAccount?.accountNumber || 'External Account'}. Description: ${dto.description || 'Fund Transfer'}. Reference: ${txRef}`,
        'info',
      );

      // Notify Receiver (if internal)
      if (receiverAccount) {
        await this.notificationsService.createNotification(
          receiverAccount.userId,
          'Funds Received',
          `Account ${receiverAccount.accountNumber} has been credited with ${formattedAmount} from ${senderAccount.accountNumber}. Reference: ${txRef}`,
          'success',
        );
      }
    } catch (err) {
      console.error('Failed to trigger transfer notifications:', err);
    }

    return transaction;
  }

  async getAllTransactions(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
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

  async reverseTransaction(transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'completed')
      throw new BadRequestException('Only completed transactions can be reversed');

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'reversed' },
    });
  }
}
