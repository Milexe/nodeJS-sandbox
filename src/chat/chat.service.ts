import { Injectable } from '@nestjs/common';
import { Message } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const RECENT_MESSAGES_LIMIT = 10;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(userId: number, text: string): Promise<Message> {
    return this.prisma.message.create({ data: { userId, text } });
  }

  async getRecentMessages(
    before?: number,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const rows = await this.prisma.message.findMany({
      where: before !== undefined ? { id: { lt: before } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: RECENT_MESSAGES_LIMIT + 1,
    });

    const hasMore = rows.length > RECENT_MESSAGES_LIMIT;
    const messages = rows.slice(0, RECENT_MESSAGES_LIMIT).reverse();
    return { messages, hasMore };
  }
}
