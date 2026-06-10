import { Injectable } from '@nestjs/common';
import { Message } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const RECENT_MESSAGES_LIMIT = 50;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(userId: number, text: string): Promise<Message> {
    return this.prisma.message.create({ data: { userId, text } });
  }

  async getRecentMessages(): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: RECENT_MESSAGES_LIMIT,
    });
    return messages.reverse();
  }
}
