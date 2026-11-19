import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getMyKyc(userId: string) {
    return this.prisma.kycDocument.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
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
    const latest = await this.getMyKyc(userId);
    if (latest?.status === 'pending') throw new BadRequestException('Your verification is already under review');
    if (latest?.status === 'approved') throw new BadRequestException('Your identity is already verified');

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

  async getAllKyc(page = 1, limit = 20, status?: string) {
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

  async reviewKyc(kycId: string, reviewerId: string, data: { status: 'approved' | 'rejected'; reviewerNotes?: string }) {
    const kyc = await this.prisma.kycDocument.findUnique({ where: { id: kycId } });
    if (!kyc) throw new NotFoundException('Verification request not found');
    if (kyc.status !== 'pending') throw new BadRequestException('This request has already been reviewed');

    const updated = await this.prisma.kycDocument.update({
      where: { id: kycId },
      data: {
        status: data.status,
        reviewerId,
        reviewerNotes: data.reviewerNotes?.trim() || null,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: data.status === 'approved' ? 'APPROVE_KYC' : 'REJECT_KYC',
        entityType: 'KycDocument',
        entityId: kycId,
        oldValues: JSON.stringify({ status: 'pending' }),
        newValues: JSON.stringify({ status: data.status }),
      },
    });

    try {
      await this.notificationsService.createNotification(
        kyc.userId,
        data.status === 'approved' ? 'Identity verified' : 'Identity verification needs attention',
        data.status === 'approved'
          ? 'Your identity documents were approved.'
          : `Your identity documents could not be approved.${data.reviewerNotes ? ` Note from our team: ${data.reviewerNotes.trim()}` : ''}`,
        data.status === 'approved' ? 'success' : 'warning',
      );
    } catch (err) {
      console.error('Failed to send KYC notification:', err);
    }

    return updated;
  }
}
