import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service';
import { TransferDto } from './dto/transfer.dto';
import { newReference } from '../common/pagination';

const INTERNATIONAL_WIRE_FEE = new Decimal(3);

const CREDIT_TYPES = new Set(['credit', 'admin_credit', 'crypto_deposit', 'loan_disbursement', 'deposit']);

function money(n: Decimal | number): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Direction of a ledger entry from the point of view of `ownIds`
   * (all of the user's accounts, or one account when filtering).
   */
  private flowFor(tx: { senderAccountId: string | null; receiverAccountId: string | null; type: string }, ownIds: string[]) {
    const isSender = !!tx.senderAccountId && ownIds.includes(tx.senderAccountId);
    const isReceiver = !!tx.receiverAccountId && ownIds.includes(tx.receiverAccountId);
    if (isSender && isReceiver) return { flow: 'internal' as const, isInternal: true };
    if (isReceiver) return { flow: 'credit' as const, isInternal: false };
    if (isSender) return { flow: 'debit' as const, isInternal: false };
    return { flow: CREDIT_TYPES.has(tx.type) ? ('credit' as const) : ('debit' as const), isInternal: false };
  }

  async getTransactionsByUserId(
    userId: string,
    page = 1,
    limit = 20,
    type?: string,
    status?: string,
    accountId?: string,
  ) {
    const skip = (page - 1) * limit;

    const accounts = await this.prisma.account.findMany({ where: { userId }, select: { id: true } });
    let accountIds = accounts.map((a) => a.id);
    if (accountId) {
      if (!accountIds.includes(accountId)) throw new ForbiddenException('Access denied');
      accountIds = [accountId];
    }

    const whereClause: any = {
      OR: [{ senderAccountId: { in: accountIds } }, { receiverAccountId: { in: accountIds } }],
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
      transactions: transactions.map((tx) => {
        // Never expose admin-only bookkeeping fields to customers.
        const { performedByAdminId, adminReference, ipAddress, ...rest } = tx as any;
        return { ...rest, ...this.flowFor(tx, accountIds) };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async transfer(userId: string, dto: TransferDto) {
    const fromAccountId = dto.fromAccountId || dto.senderAccountId;
    const toAccountNumber = (dto.toAccountNumber || dto.receiverAccountNumber || '').trim();
    if (!fromAccountId) throw new BadRequestException('Choose the account to send from');
    if (!toAccountNumber) throw new BadRequestException('Enter the recipient account number');

    const senderAccount = await this.prisma.account.findUnique({ where: { id: fromAccountId } });
    if (!senderAccount || senderAccount.userId !== userId) throw new NotFoundException('Source account not found');
    if (senderAccount.isFrozen) throw new BadRequestException('This account is frozen. Contact support.');
    if (senderAccount.accountNumber === toAccountNumber) {
      throw new BadRequestException('You cannot transfer to the same account');
    }

    const receiverAccount = await this.prisma.account.findUnique({ where: { accountNumber: toAccountNumber } });
    if (receiverAccount?.isFrozen) {
      throw new BadRequestException('The recipient account cannot receive funds right now');
    }

    const type = dto.type || 'transfer';
    const amount = new Decimal(dto.amount.toFixed(2));
    const fee = type === 'international_transfer' ? INTERNATIONAL_WIRE_FEE : new Decimal(0);
    const totalDeduction = amount.plus(fee);
    const txRef = newReference('TXN');
    const description = dto.description?.trim() || (type === 'bill_payment' ? 'Bill payment' : 'Fund transfer');

    const transaction = await this.prisma.$transaction(async (tx) => {
      // Conditional decrement: succeeds only if the funds are still available,
      // which makes concurrent transfers unable to overdraw the account.
      const debited = await tx.account.updateMany({
        where: { id: senderAccount.id, isFrozen: false, availableBalance: { gte: totalDeduction } },
        data: { balance: { decrement: totalDeduction }, availableBalance: { decrement: totalDeduction } },
      });
      if (debited.count !== 1) {
        throw new BadRequestException(
          fee.greaterThan(0)
            ? `Insufficient funds. This transfer needs $${money(totalDeduction)} including the $${money(fee)} fee.`
            : 'Insufficient funds',
        );
      }

      if (receiverAccount) {
        await tx.account.update({
          where: { id: receiverAccount.id },
          data: { balance: { increment: amount }, availableBalance: { increment: amount } },
        });
      }

      return tx.transaction.create({
        data: {
          transactionReference: txRef,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount?.id ?? null,
          amount,
          fee,
          currency: 'USD',
          status: 'completed',
          type,
          description,
          metadata: receiverAccount ? null : JSON.stringify({ externalAccount: toAccountNumber }),
        },
      });
    });

    try {
      const destination = receiverAccount ? receiverAccount.accountNumber : toAccountNumber;
      await this.notificationsService.createNotification(
        userId,
        type === 'bill_payment' ? 'Bill payment sent' : 'Transfer sent',
        `$${money(amount)} was sent from ${senderAccount.accountNumber} to ${destination}${fee.greaterThan(0) ? ` (fee $${money(fee)})` : ''}. Reference ${txRef}.`,
        'info',
      );
      if (receiverAccount && receiverAccount.userId !== userId) {
        await this.notificationsService.createNotification(
          receiverAccount.userId,
          'Funds received',
          `$${money(amount)} was credited to ${receiverAccount.accountNumber}. Reference ${txRef}.`,
          'success',
        );
      }
    } catch (err) {
      console.error('Failed to trigger transfer notifications:', err);
    }

    return { ...transaction, flow: 'debit', isInternal: !!receiverAccount && receiverAccount.userId === userId };
  }

  async getTransactionById(userId: string, transactionId: string) {
    const accounts = await this.prisma.account.findMany({ where: { userId }, select: { id: true } });
    const accountIds = accounts.map((a) => a.id);

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        senderAccount: { select: { accountNumber: true, accountType: true } },
        receiverAccount: { select: { accountNumber: true, accountType: true } },
      },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const belongsToUser =
      (!!transaction.senderAccountId && accountIds.includes(transaction.senderAccountId)) ||
      (!!transaction.receiverAccountId && accountIds.includes(transaction.receiverAccountId));
    if (!belongsToUser) throw new NotFoundException('Transaction not found');

    const { performedByAdminId, adminReference, ipAddress, ...rest } = transaction as any;
    return { ...rest, ...this.flowFor(transaction, accountIds) };
  }
}
