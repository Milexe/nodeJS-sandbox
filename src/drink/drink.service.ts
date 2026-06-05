import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDrinkDto } from './dto/create-drink.dto';
import { UpdateDrinkDto } from './dto/update-drink.dto';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class DrinkService {
  private async assertTitleAvailable(
    title: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await prisma.drink.findFirst({
      where: {
        title,
        ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('Title already exists');
    }
  }

  private buildCreateData(dto: CreateDrinkDto) {
    return {
      title: dto.title,
      description: dto.description ?? '',
      abv: dto.abv,
      rating: dto.rating ?? 0,
      price: dto.price,
    };
  }

  async create(createDrinkDto: CreateDrinkDto) {
    await this.assertTitleAvailable(createDrinkDto.title);

    try {
      return await prisma.drink.create({
        data: this.buildCreateData(createDrinkDto),
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Title already exists');
      }
      throw error;
    }
  }

  async findAll(title?: string) {
    return prisma.drink.findMany({
      where: title ? { title } : undefined,
    });
  }

  async findOne(id: string) {
    try {
      return await prisma.drink.findUnique({
        where: { id: parseInt(id, 10) },
      });
    } catch (error) {
      console.log(error);
      throw new HttpException('Roman is a teapot', HttpStatus.I_AM_A_TEAPOT);
    }
  }

  async update(id: number, updateDrinkDto: UpdateDrinkDto) {
    const existing = await prisma.drink.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Drink #${id} not found`);
    }

    const title = updateDrinkDto.title ?? existing.title;
    await this.assertTitleAvailable(title, id);

    try {
      return await prisma.drink.update({
        where: { id },
        data: {
          title: updateDrinkDto.title ?? existing.title,
          description: updateDrinkDto.description ?? existing.description,
          abv: updateDrinkDto.abv ?? existing.abv,
          rating: updateDrinkDto.rating ?? existing.rating,
          price: updateDrinkDto.price ?? existing.price,
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Title already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await prisma.drink.delete({
      where: { id },
    });
    return `This action removes a #${id} drink`;
  }
}
