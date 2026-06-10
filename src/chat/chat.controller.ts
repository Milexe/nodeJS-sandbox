import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  getMessages(@Query('before') before?: string) {
    const beforeId = before !== undefined ? Number(before) : undefined;
    return this.chatService.getRecentMessages(
      Number.isFinite(beforeId) ? beforeId : undefined,
    );
  }
}
