import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  // ─── Customer helpers ────────────────────────────────────────────────────

  /** Find or create the customer's single open conversation. */
  async getOrCreateConversation(customerId: string) {
    const existing = await this.prisma.supportConversation.findFirst({
      where: { customerId, status: 'open' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (existing) return existing;

    return this.prisma.supportConversation.create({
      data: { customerId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });
  }

  /** Fetch messages for a conversation (customer-scoped). */
  async getMessagesForCustomer(
    conversationId: string,
    customerId: string,
    page = 1,
    limit = 50,
  ) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * limit;

    // Mark admin messages as read
    await this.prisma.supportMessage.updateMany({
      where: {
        conversationId,
        senderType: 'admin',
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const messages = await this.prisma.supportMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });

    return { conversation, messages };
  }

  /** Customer posts a new message. */
  async sendMessageAsCustomer(
    conversationId: string,
    customerId: string,
    content: string,
  ) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.customerId !== customerId) {
      throw new ForbiddenException('Access denied');
    }
    if (conversation.status === 'closed') {
      throw new ForbiddenException(
        'This conversation is closed. Please start a new one.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: {
          conversationId,
          senderType: 'customer',
          senderId: customerId,
          content,
        },
      });

      await tx.supportConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    });
  }

  // ─── Admin helpers ───────────────────────────────────────────────────────

  /** List all conversations for the admin inbox. */
  async getAllConversations(page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const conversations = await this.prisma.supportConversation.findMany({
      skip,
      take: limit,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Compute unread counts (messages from customer that admin hasn't read)
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.supportMessage.count({
          where: {
            conversationId: conv.id,
            senderType: 'customer',
            readAt: null,
          },
        });
        return { ...conv, unreadCount };
      }),
    );

    const total = await this.prisma.supportConversation.count();

    return {
      data: conversationsWithUnread,
      total,
      page,
      limit,
    };
  }

  /** Admin fetches messages for a specific conversation. */
  async getMessagesForAdmin(conversationId: string, page = 1, limit = 50) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const skip = (page - 1) * limit;

    // Mark customer messages as read by admin
    await this.prisma.supportMessage.updateMany({
      where: {
        conversationId,
        senderType: 'customer',
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const messages = await this.prisma.supportMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });

    return { conversation, messages };
  }

  /** Admin sends a reply. */
  async sendMessageAsAdmin(
    conversationId: string,
    adminId: string,
    content: string,
  ) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: {
          conversationId,
          senderType: 'admin',
          senderId: adminId,
          content,
        },
      });

      await tx.supportConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          status: 'open', // Re-open if it was closed
        },
      });

      return message;
    });
  }

  /** Admin closes a conversation. */
  async closeConversation(conversationId: string) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status: 'closed' },
    });
  }
}
