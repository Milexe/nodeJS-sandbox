import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

const makeMessage = (id: number, createdAt: Date) => ({
  id,
  userId: 1,
  text: `message ${id}`,
  createdAt,
});

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    message: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('saveMessage persists and returns the created message', async () => {
    const now = new Date();
    const created = { id: 1, userId: 2, text: 'hello', createdAt: now };
    prisma.message.create.mockResolvedValue(created);

    await expect(service.saveMessage(2, 'hello')).resolves.toEqual(created);

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { userId: 2, text: 'hello' },
    });
  });

  it('getRecentMessages returns messages in chronological order', async () => {
    const t1 = new Date('2024-01-01T10:00:00Z');
    const t2 = new Date('2024-01-01T10:01:00Z');
    const t3 = new Date('2024-01-01T10:02:00Z');

    // Prisma returns desc (newest first)
    prisma.message.findMany.mockResolvedValue([
      makeMessage(3, t3),
      makeMessage(2, t2),
      makeMessage(1, t1),
    ]);

    const result = await service.getRecentMessages();

    // Service must reverse to chronological (oldest first)
    expect(result.map((m) => m.id)).toEqual([1, 2, 3]);

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('getRecentMessages returns empty array when there are no messages', async () => {
    prisma.message.findMany.mockResolvedValue([]);

    await expect(service.getRecentMessages()).resolves.toEqual([]);
  });
});
