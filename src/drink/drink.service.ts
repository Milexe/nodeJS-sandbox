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
import { deleteDrinkImage, saveDrinkImage } from './drink-image.storage';
import {
  DRINKS_DEFAULT_LIMIT,
  DRINKS_DEFAULT_PAGE,
  FindDrinksQueryDto,
} from './dto/find-drinks-query.dto';
import { PaginatedDrinkList } from './drink-list.types';
import { buildDrinkOrderBy, buildDrinkWhere } from './drink-list.query';

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
  private imageUrlFromFile(file?: Express.Multer.File): string | undefined {
    if (!file) {
      return undefined;
    }

    return saveDrinkImage(file);
  }

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

  private buildCreateData(dto: CreateDrinkDto, imageUrl?: string) {
    return {
      title: dto.title,
      description: dto.description ?? '',
      abv: dto.abv,
      rating: dto.rating ?? 0,
      price: dto.price,
      imageUrl: imageUrl ?? null,
    };
  }

  async create(createDrinkDto: CreateDrinkDto, image?: Express.Multer.File) {
    await this.assertTitleAvailable(createDrinkDto.title);
    const imageUrl = this.imageUrlFromFile(image);

    try {
      return await prisma.drink.create({
        data: this.buildCreateData(createDrinkDto, imageUrl),
      });
    } catch (error: unknown) {
      if (imageUrl) {
        deleteDrinkImage(imageUrl);
      }
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Title already exists');
      }
      throw error;
    }
  }

  async findAll(query: FindDrinksQueryDto = {}): Promise<PaginatedDrinkList> {
    const page = query.page ?? DRINKS_DEFAULT_PAGE;
    const limit = query.limit ?? DRINKS_DEFAULT_LIMIT;
    const where = buildDrinkWhere(query);
    const orderBy = buildDrinkOrderBy(query.sort, query.order);

    const [data, total] = await Promise.all([
      prisma.drink.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.drink.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: { page, limit, total, totalPages },
    };
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

  async update(
    id: number,
    updateDrinkDto: UpdateDrinkDto,
    image?: Express.Multer.File,
  ) {
    const existing = await prisma.drink.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Drink #${id} not found`);
    }

    const title = updateDrinkDto.title ?? existing.title;
    await this.assertTitleAvailable(title, id);

    const uploadedImageUrl = this.imageUrlFromFile(image);
    let nextImageUrl = existing.imageUrl;

    if (updateDrinkDto.removeImage) {
      deleteDrinkImage(existing.imageUrl);
      nextImageUrl = null;
    }

    if (uploadedImageUrl) {
      if (existing.imageUrl && existing.imageUrl !== uploadedImageUrl) {
        deleteDrinkImage(existing.imageUrl);
      }
      nextImageUrl = uploadedImageUrl;
    }

    const { removeImage: _removeImage, ...dto } = updateDrinkDto;

    try {
      return await prisma.drink.update({
        where: { id },
        data: {
          title: dto.title ?? existing.title,
          description: dto.description ?? existing.description,
          abv: dto.abv ?? existing.abv,
          rating: dto.rating ?? existing.rating,
          price: dto.price ?? existing.price,
          imageUrl: nextImageUrl,
        },
      });
    } catch (error: unknown) {
      if (uploadedImageUrl) {
        deleteDrinkImage(uploadedImageUrl);
      }
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Title already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const existing = await prisma.drink.findUnique({ where: { id } });
    if (existing?.imageUrl) {
      deleteDrinkImage(existing.imageUrl);
    }

    await prisma.drink.delete({
      where: { id },
    });
    return `This action removes a #${id} drink`;
  }
}
