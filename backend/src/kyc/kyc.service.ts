import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async getMyKyc(userId: string) {
    return this.prisma.kycDocument.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitKyc(
    userId: string,
    data: {
      documentType: string;
      documentFrontUrl?: string;
      documentBackUrl?: string;
      selfieUrl?: string;
      proofOfAddressUrl?: string;
    },
  ) {
    const existing = await this.prisma.kycDocument.findFirst({
      where: { userId, status: 'pending' },
    });

    if (existing) {
      throw new BadRequestException('A KYC submission is already under review');
    }

    return this.prisma.kycDocument.create({
      data: {
        userId,
        status: 'pending',
        documentType: data.documentType,
        documentFrontUrl: data.documentFrontUrl,
        documentBackUrl: data.documentBackUrl,
        selfieUrl: data.selfieUrl,
        proofOfAddressUrl: data.proofOfAddressUrl,
      },
    });
  }

  async getAllKyc(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [kycs, total] = await Promise.all([
      this.prisma.kycDocument.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          reviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.kycDocument.count({ where: whereClause }),
    ]);

    return { kycs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async reviewKyc(
    kycId: string,
    reviewerId: string,
    data: { status: 'approved' | 'rejected'; reviewerNotes?: string },
  ) {
    const kyc = await this.prisma.kycDocument.findUnique({ where: { id: kycId } });
    if (!kyc) throw new NotFoundException('KYC document not found');
    if (kyc.status !== 'pending') throw new BadRequestException('KYC is not pending review');

    return this.prisma.kycDocument.update({
      where: { id: kycId },
      data: {
        status: data.status,
        reviewerId,
        reviewerNotes: data.reviewerNotes,
        reviewedAt: new Date(),
      },
    });
  }
}
