import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface ApplyLoanDto {
  loanType: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  accountId?: string;
  ssn?: string;
  selectedCrypto?: string;
  cryptoAmount?: number;
  disbursementType?: string;
  disbursementDestination?: string;
}

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number,
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / termMonths;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    );
  }

  async getMyLoans(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyForLoan(userId: string, dto: ApplyLoanDto) {
    const monthlyPayment = this.calculateMonthlyPayment(
      dto.principalAmount,
      dto.interestRate,
      dto.termMonths,
    );

    const loan = await this.prisma.loan.create({
      data: {
        userId,
        accountId: dto.accountId || null,
        loanType: dto.loanType,
        principalAmount: new Decimal(dto.principalAmount),
        interestRate: new Decimal(dto.interestRate),
        termMonths: dto.termMonths,
        monthlyPayment: new Decimal(monthlyPayment.toFixed(2)),
        outstandingBalance: new Decimal(dto.principalAmount),
        status: 'pending',
        ssn: dto.ssn || null,
        selectedCrypto: dto.selectedCrypto || null,
        cryptoAmount: dto.cryptoAmount ? new Decimal(dto.cryptoAmount) : null,
        disbursementType: dto.disbursementType || 'bank',
        disbursementDestination: dto.disbursementDestination || null,
      },
    });

    // Send 72-hour approval notification email
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });
      if (user?.email) {
        const loanLabel = dto.loanType.charAt(0).toUpperCase() + dto.loanType.slice(1);
        const subject = `[Intercontinental Crest] Loan Application Received — Review in Progress`;
        const html = `
<!DOCTYPE html><html><head><style>
  body{font-family:Inter,sans-serif;background:#f9fafb;margin:0;padding:0;color:#1f2937}
  .wrap{max-width:600px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb}
  .hdr{background:#0A2342;padding:28px;text-align:center;border-bottom:4px solid #00B7F1}
  .hdr h1{color:#fff;margin:0;font-size:22px;letter-spacing:1px}
  .hdr p{color:#00B7F1;margin:4px 0 0;font-size:11px;letter-spacing:3px;font-weight:700}
  .body{padding:36px 28px;line-height:1.7}
  .body h2{color:#0A2342;margin-top:0}
  .box{background:#f0fdf4;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:20px 0}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px}
  .badge{display:inline-block;background:#fef9c3;color:#854d0e;padding:4px 12px;border-radius:20px;font-weight:700;font-size:12px}
  .timer{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;text-align:center;margin:20px 0}
  .timer strong{color:#1d4ed8;font-size:18px}
  .btn{display:inline-block;background:#00B7F1;color:#fff;padding:12px 28px;border-radius:30px;text-decoration:none;font-weight:700;margin-top:8px}
  .foot{background:#f3f4f6;padding:18px;text-align:center;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="wrap">
  <div class="hdr"><h1>INTERCONTINENTAL</h1><p>CREST</p></div>
  <div class="body">
    <h2>Loan Application Received</h2>
    <p>Dear ${user.fullName},</p>
    <p>We have received your lending application and it is now under administrative review. Here is a summary:</p>
    <div class="box">
      <div class="row"><span>Loan Type</span><strong>${loanLabel} Loan</strong></div>
      <div class="row"><span>Principal Amount</span><strong>$${Number(dto.principalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
      <div class="row"><span>Term</span><strong>${dto.termMonths} Months</strong></div>
      <div class="row"><span>Monthly Payment</span><strong>$${monthlyPayment.toFixed(2)}</strong></div>
      <div class="row" style="border:none"><span>Status</span><span class="badge">PENDING REVIEW</span></div>
    </div>
    <div class="timer">
      <p style="margin:0 0 4px;color:#374151;font-size:13px">Estimated approval window</p>
      <strong>Within 72 Hours</strong>
      <p style="margin:4px 0 0;color:#6b7280;font-size:12px">Our credit team reviews all applications within 3 business days</p>
    </div>
    <p>You will receive another email notification once your application has been approved or reviewed. You can also track the status of your application in real time from your dashboard.</p>
    <div style="text-align:center;margin-top:24px">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/loans" class="btn" style="color:#fff">Track My Application</a>
    </div>
  </div>
  <div class="foot">
    <p>© 2026 Intercontinental Crest. FDIC Insured Simulation. All rights reserved.</p>
    <p>This is a secure automated notification. Please do not reply directly to this email.</p>
  </div>
</div>
</body></html>`;

        await this.emailService.sendEmail({
          to: user.email,
          subject,
          text: `Dear ${user.fullName},\n\nYour ${loanLabel} loan application for $${dto.principalAmount} has been received and is under review. You will receive a decision within 72 hours.\n\nLoan ID: ${loan.id}\n\nThank you,\nIntercontinental Crest`,
          html,
        });
      }
    } catch (err) {
      console.error('Failed to send loan application email:', err);
    }

    return loan;
  }

  async getAllLoans(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
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

    return { loans, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveLoan(loanId: string, approverId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'pending')
      throw new BadRequestException('Only pending loans can be approved');

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loan.termMonths);

    return this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        disbursedAt: new Date(),
        dueDate,
      },
    });
  }

  async rejectLoan(loanId: string, approverId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'pending')
      throw new BadRequestException('Only pending loans can be rejected');

    return this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'rejected',
        approvedBy: approverId,
      },
    });
  }
}
