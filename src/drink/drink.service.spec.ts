import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DRINKS_CATALOG_FULL_MESSAGE } from './drink.constants';
import { DrinkService } from './drink.service';

describe('DrinkService', () => {
  let service: DrinkService;
  let prisma: {
    drink: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      drink: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrinkService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<DrinkService>(DrinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects create when the catalog limit is reached', async () => {
    prisma.drink.count.mockResolvedValue(1000);

    await expect(
      service.create({
        title: 'New drink',
        abv: 5,
        price: 9.99,
      }),
    ).rejects.toThrow(new ConflictException(DRINKS_CATALOG_FULL_MESSAGE));

    expect(prisma.drink.create).not.toHaveBeenCalled();
  });
});
