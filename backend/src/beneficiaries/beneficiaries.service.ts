import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateBeneficiaryDto {
  beneficiaryName: string;
  accountNumber: string;
  bankName?: string;
  bankCode?: string;
  swiftCode?: string;
  iban?: string;
  currency?: string;
  country?: string;
  isInternational?: boolean;
}

@Injectable()
export class BeneficiariesService {
  constructor(private prisma: PrismaService) {}

  async getByUserId(userId: string) {
    return this.prisma.beneficiary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateBeneficiaryDto) {
    return this.prisma.beneficiary.create({
      data: {
        userId,
        beneficiaryName: dto.beneficiaryName,
        accountNumber: dto.accountNumber,
        bankName: dto.bankName,
        bankCode: dto.bankCode,
        swiftCode: dto.swiftCode,
        iban: dto.iban,
        currency: dto.currency || 'USD',
        country: dto.country,
        isInternational: dto.isInternational || false,
      },
    });
  }

  async delete(beneficiaryId: string, userId: string) {
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });
    if (!beneficiary) throw new NotFoundException('Beneficiary not found');
    if (beneficiary.userId !== userId) throw new ForbiddenException('Access denied');
    return this.prisma.beneficiary.delete({ where: { id: beneficiaryId } });
  }
}
