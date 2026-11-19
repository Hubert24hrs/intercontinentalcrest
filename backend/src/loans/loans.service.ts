import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { LOAN_PRODUCTS, maskSsn, monthlyPayment } from './loan-products';
import { newReference } from '../common/pagination';

function money(n: Decimal | number): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
}

/** Loans are returned with the SSN reduced to its last four digits, whatever is stored. */
function present<T extends { ssn?: string | null }>(loan: T): T {
  return { ...loan, ssn: maskSsn(loan.ssn) };
}

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async getMyLoans(userId: string) {
    const loans = await this.prisma.loan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return loans.map(present);
  }

  async applyForLoan(userId: string, dto: ApplyLoanDto) {
    const product = LOAN_PRODUCTS[dto.loanType];
    const disbursementType = dto.disbursementType || 'bank';

    const ssnMasked = maskSsn(dto.ssnLast4 || dto.ssn);
    if (!ssnMasked) throw new BadRequestException('Enter the last 4 digits of your SSN');

    let accountId: string | null = null;
    if (disbursementType === 'bank') {
      if (!dto.accountId) throw new BadRequestException('Choose the account that should receive the funds');
      const account = await this.prisma.account.findUnique({ where: { id: dto.accountId } });
      if (!account || account.userId !== userId) throw new BadRequestException('Choose one of your own accounts');
      accountId = account.id;
    } else if (!dto.disbursementDestination?.trim()) {
      throw new BadRequestException('Enter where the funds should be sent');
    }

    const pending = await this.prisma.loan.count({ where: { userId, status: 'pending' } });
    if (pending >= 3) {
      throw new BadRequestException('You already have 3 applications under review. Please wait for a decision.');
    }

    const payment = monthlyPayment(dto.principalAmount, product.rate, dto.termMonths);

    const loan = await this.prisma.loan.create({
      data: {
        userId,
        accountId,
        loanType: dto.loanType,
        principalAmount: new Decimal(dto.principalAmount.toFixed(2)),
        interestRate: new Decimal(product.rate),
        termMonths: dto.termMonths,
        monthlyPayment: new Decimal(payment.toFixed(2)),
        outstandingBalance: new Decimal(dto.principalAmount.toFixed(2)),
        status: 'pending',
        ssn: ssnMasked,
        selectedCrypto: dto.loanType === 'crypto' ? dto.selectedCrypto?.trim() || null : null,
        cryptoAmount: dto.cryptoAmount ? new Decimal(dto.cryptoAmount) : null,
        disbursementType,
        disbursementDestination: disbursementType === 'bank' ? accountId : dto.disbursementDestination!.trim(),
      },
    });

    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
      if (user?.email) {
        const rows = this.emailService.renderRows([
          { label: 'Loan type', value: product.label },
          { label: 'Amount', value: `$${money(dto.principalAmount)}` },
          { label: 'Term', value: `${dto.termMonths} months` },
          { label: 'Rate (APR)', value: `${product.rate.toFixed(2)}%` },
          { label: 'Estimated monthly payment', value: `$${money(payment)}` },
          { label: 'Status', value: 'Under review' },
        ]);
        await this.emailService.sendEmail({
          to: user.email,
          subject: 'We received your loan application',
          text: `Hello ${user.fullName},\n\nWe received your ${product.label.toLowerCase()} application for $${money(dto.principalAmount)} over ${dto.termMonths} months. Applications are usually reviewed within 72 hours.\n\nTrack it at ${frontendUrl()}/dashboard/loans`,
          html: this.emailService.renderLayout({
            heading: 'Loan application received',
            bodyHtml: `<p>We received your application and it's now under review. Most applications are reviewed within 72 hours.</p>${rows}`,
            cta: { label: 'Track your application', href: `${frontendUrl()}/dashboard/loans` },
          }),
        });
      }
    } catch (err) {
      console.error('Failed to send loan application email:', err);
    }

    return present(loan);
  }

  async getAllLoans(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          approver: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loan.count({ where: whereClause }),
    ]);

    return { loans: loans.map(present), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveLoan(loanId: string, approverId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'pending') throw new BadRequestException('Only pending loans can be approved');

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loan.termMonths);

    const creditInternally = !loan.disbursementType || loan.disbursementType === 'bank';
    let disbursementAccountId: string | null = null;
    if (creditInternally) {
      const preferred = loan.accountId
        ? await this.prisma.account.findFirst({ where: { id: loan.accountId, userId: loan.userId } })
        : null;
      const target =
        preferred && !preferred.isFrozen
          ? preferred
          : await this.prisma.account.findFirst({
              where: { userId: loan.userId, isFrozen: false },
              orderBy: { createdAt: 'asc' },
            });
      if (!target) throw new BadRequestException('The customer has no active account to receive the funds');
      disbursementAccountId = target.id;
    }

    const updatedLoan = await this.prisma.$transaction(async (tx) => {
      // Guarded state change — a loan can only be approved (and paid out) once.
      const changed = await tx.loan.updateMany({
        where: { id: loanId, status: 'pending' },
        data: { status: 'approved', approvedBy: approverId, approvedAt: new Date(), disbursedAt: new Date(), dueDate },
      });
      if (changed.count !== 1) throw new BadRequestException('Only pending loans can be approved');

      if (disbursementAccountId) {
        await tx.account.update({
          where: { id: disbursementAccountId },
          data: { balance: { increment: loan.principalAmount }, availableBalance: { increment: loan.principalAmount } },
        });
        await tx.transaction.create({
          data: {
            transactionReference: newReference('LOAN'),
            senderAccountId: null,
            receiverAccountId: disbursementAccountId,
            amount: loan.principalAmount,
            fee: new Decimal(0),
            currency: 'USD',
            status: 'completed',
            type: 'loan_disbursement',
            description: `Loan disbursement: ${LOAN_PRODUCTS[loan.loanType]?.label || loan.loanType}`,
            performedByAdminId: approverId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: approverId,
          action: 'APPROVE_LOAN',
          entityType: 'Loan',
          entityId: loanId,
          oldValues: JSON.stringify({ status: 'pending' }),
          newValues: JSON.stringify({ status: 'approved', disbursementAccountId }),
        },
      });

      return tx.loan.findUnique({ where: { id: loanId } });
    });

    try {
      await this.notificationsService.createNotification(
        loan.userId,
        'Loan approved',
        `Your ${LOAN_PRODUCTS[loan.loanType]?.label.toLowerCase() || 'loan'} of $${money(loan.principalAmount)} was approved.${
          disbursementAccountId
            ? ' The funds are now in your account.'
            : ' The funds will be sent to the destination you provided.'
        } Monthly payment: $${money(loan.monthlyPayment || 0)} for ${loan.termMonths} months.`,
        'success',
      );
    } catch (err) {
      console.error('Failed to send loan approval notification:', err);
    }

    return present(updatedLoan!);
  }

  async rejectLoan(loanId: string, approverId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    const changed = await this.prisma.loan.updateMany({
      where: { id: loanId, status: 'pending' },
      data: { status: 'rejected', approvedBy: approverId },
    });
    if (changed.count !== 1) throw new BadRequestException('Only pending loans can be rejected');

    await this.prisma.auditLog.create({
      data: {
        userId: approverId,
        action: 'REJECT_LOAN',
        entityType: 'Loan',
        entityId: loanId,
        oldValues: JSON.stringify({ status: 'pending' }),
        newValues: JSON.stringify({ status: 'rejected' }),
      },
    });

    try {
      await this.notificationsService.createNotification(
        loan.userId,
        'Loan application update',
        `Your application for $${money(loan.principalAmount)} was not approved this time. Contact support if you'd like to discuss it.`,
        'warning',
      );
    } catch (err) {
      console.error('Failed to send loan rejection notification:', err);
    }

    const updated = await this.prisma.loan.findUnique({ where: { id: loanId } });
    return present(updated!);
  }
}
