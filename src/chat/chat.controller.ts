import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get recent chat messages' })
  @ApiQuery({ name: 'before', required: false, description: 'Return messages before this message ID (cursor pagination)' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  getMessages(@Query('before') before?: string) {
    const beforeId = before !== undefined ? Number(before) : undefined;
    return this.chatService.getRecentMessages(
      Number.isFinite(beforeId) ? beforeId : undefined,
    );
  }
}
