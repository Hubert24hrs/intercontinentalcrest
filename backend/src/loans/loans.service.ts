import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface ApplyLoanDto {
  loanType: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  accountId?: string;
}

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.loan.create({
      data: {
        userId,
        accountId: dto.accountId,
        loanType: dto.loanType,
        principalAmount: new Decimal(dto.principalAmount),
        interestRate: new Decimal(dto.interestRate),
        termMonths: dto.termMonths,
        monthlyPayment: new Decimal(monthlyPayment.toFixed(2)),
        outstandingBalance: new Decimal(dto.principalAmount),
        status: 'pending',
      },
    });
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
