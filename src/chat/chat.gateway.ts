import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { createCorsOriginValidator } from '../cors.config';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingDto } from './dto/typing.dto';

@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({
  cors: {
    origin: createCorsOriginValidator(),
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() dto: SendMessageDto): Promise<void> {
    const message = await this.chatService.saveMessage(dto.userId, dto.text);
    this.server.emit('message', message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() dto: TypingDto,
    @ConnectedSocket() client: Socket,
  ): void {
    client.broadcast.emit('typing', { userId: dto.userId });
  }
}
