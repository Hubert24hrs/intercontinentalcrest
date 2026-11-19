import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  /** Newest `limit` messages, returned oldest → newest for display. */
  private async latestMessages(conversationId: string, limit: number) {
    const rows = await this.prisma.supportMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.reverse();
  }

  /** Find or create the customer's open conversation. */
  async getOrCreateConversation(customerId: string) {
    const existing =
      (await this.prisma.supportConversation.findFirst({
        where: { customerId, status: 'open' },
        orderBy: { lastMessageAt: 'desc' },
      })) || (await this.prisma.supportConversation.create({ data: { customerId } }));

    return { ...existing, messages: await this.latestMessages(existing.id, 100) };
  }

  async getMessagesForCustomer(conversationId: string, customerId: string, limit = 100) {
    const conversation = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.customerId !== customerId) throw new NotFoundException('Conversation not found');

    await this.prisma.supportMessage.updateMany({
      where: { conversationId, senderType: 'admin', readAt: null },
      data: { readAt: new Date() },
    });

    return { conversation, messages: await this.latestMessages(conversationId, limit) };
  }

  async sendMessageAsCustomer(conversationId: string, customerId: string, content: string) {
    const conversation = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.customerId !== customerId) throw new NotFoundException('Conversation not found');
    if (conversation.status === 'closed') {
      throw new ForbiddenException('This conversation is closed. Start a new one.');
    }

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: { conversationId, senderType: 'customer', senderId: customerId, content },
      });
      await tx.supportConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });
      return message;
    });
  }

  async getAllConversations(page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [conversations, total, unread] = await Promise.all([
      this.prisma.supportConversation.findMany({
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.supportConversation.count(),
      this.prisma.supportMessage.groupBy({
        by: ['conversationId'],
        where: { senderType: 'customer', readAt: null },
        _count: { _all: true },
      }),
    ]);

    const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));
    return {
      data: conversations.map((c) => ({ ...c, unreadCount: unreadMap.get(c.id) ?? 0 })),
      total,
      page,
      limit,
    };
  }

  async getMessagesForAdmin(conversationId: string, limit = 100) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: { customer: { select: { id: true, fullName: true, email: true } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    await this.prisma.supportMessage.updateMany({
      where: { conversationId, senderType: 'customer', readAt: null },
      data: { readAt: new Date() },
    });

    return { conversation, messages: await this.latestMessages(conversationId, limit) };
  }

  async sendMessageAsAdmin(conversationId: string, adminId: string, content: string) {
    const conversation = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: { conversationId, senderType: 'admin', senderId: adminId, content },
      });
      await tx.supportConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), status: 'open' },
      });
      return message;
    });
  }

  async closeConversation(conversationId: string) {
    const conversation = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.prisma.supportConversation.update({ where: { id: conversationId }, data: { status: 'closed' } });
  }
}
