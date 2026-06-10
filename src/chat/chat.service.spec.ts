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

    // Prisma returns desc (newest first), limit+1 rows to detect hasMore
    prisma.message.findMany.mockResolvedValue([
      makeMessage(3, t3),
      makeMessage(2, t2),
      makeMessage(1, t1),
    ]);

    const { messages, hasMore } = await service.getRecentMessages();

    // Service must reverse to chronological (oldest first)
    expect(messages.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(hasMore).toBe(false);
  });

  it('getRecentMessages sets hasMore when extra row is returned', async () => {
    // Return limit+1 rows to signal there are older messages
    const rows = Array.from({ length: 11 }, (_, i) =>
      makeMessage(
        11 - i,
        new Date(`2024-01-01T10:${String(i).padStart(2, '0')}:00Z`),
      ),
    );
    prisma.message.findMany.mockResolvedValue(rows);

    const { messages, hasMore } = await service.getRecentMessages();

    expect(messages).toHaveLength(10);
    expect(hasMore).toBe(true);
  });

  it('getRecentMessages returns empty array when there are no messages', async () => {
    prisma.message.findMany.mockResolvedValue([]);

    const { messages, hasMore } = await service.getRecentMessages();
    expect(messages).toEqual([]);
    expect(hasMore).toBe(false);
  });
});
