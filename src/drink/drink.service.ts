import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDrinkDto } from './dto/create-drink.dto';
import { UpdateDrinkDto } from './dto/update-drink.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  deleteDrinkImage,
  downloadDrinkImageFromUrl,
  saveDrinkImage,
} from './drink-image.storage';
import {
  DRINKS_DEFAULT_LIMIT,
  DRINKS_DEFAULT_PAGE,
  FindDrinksQueryDto,
} from './dto/find-drinks-query.dto';
import { PaginatedDrinkList } from './drink-list.types';
import { buildDrinkOrderBy, buildDrinkWhere } from './drink-list.query';
import { parseDrinkCsv } from './drink-csv.parser';
import type {
  DrinkCsvImportResult,
  ParsedDrinkCsvRow,
} from './drink-csv.types';
import {
  DRINKS_CATALOG_FULL_MESSAGE,
  DRINKS_CATALOG_MAX,
  drinkCatalogCapacityMessage,
} from './drink.constants';

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
  constructor(private readonly prisma: PrismaService) {}

  private imageUrlFromFile(file?: Express.Multer.File): string | undefined {
    if (!file) {
      return undefined;
    }

    return saveDrinkImage(file);
  }

  private async assertCatalogHasCapacity(addCount = 1): Promise<void> {
    if (addCount <= 0) {
      return;
    }

    const currentCount = await this.prisma.drink.count();
    if (currentCount + addCount > DRINKS_CATALOG_MAX) {
      throw new ConflictException(DRINKS_CATALOG_FULL_MESSAGE);
    }
  }

  private async assertTitleAvailable(
    title: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.drink.findFirst({
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

  private buildCreateDataFromCsvRow(row: ParsedDrinkCsvRow, imageUrl?: string) {
    return this.buildCreateData(
      {
        title: row.title,
        description: row.description,
        abv: row.abv,
        rating: row.rating,
        price: row.price,
      },
      imageUrl,
    );
  }

  async create(createDrinkDto: CreateDrinkDto, image?: Express.Multer.File) {
    await this.assertCatalogHasCapacity();
    await this.assertTitleAvailable(createDrinkDto.title);
    const imageUrl = this.imageUrlFromFile(image);

    try {
      return await this.prisma.drink.create({
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

  async importFromCsv(fileBuffer: Buffer): Promise<DrinkCsvImportResult> {
    const content = fileBuffer.toString('utf-8');
    const { validRows, invalidRows } = await parseDrinkCsv(content);
    const currentCount = await this.prisma.drink.count();
    const remainingSlots = DRINKS_CATALOG_MAX - currentCount;

    if (remainingSlots <= 0) {
      throw new ConflictException(DRINKS_CATALOG_FULL_MESSAGE);
    }

    if (validRows.length > remainingSlots) {
      throw new ConflictException(
        drinkCatalogCapacityMessage(currentCount, validRows.length),
      );
    }

    const failed = [...invalidRows];
    let imported = 0;

    for (const row of validRows) {
      let imageUrl: string | undefined;

      try {
        if (row.imageUrl) {
          imageUrl = await downloadDrinkImageFromUrl(row.imageUrl);
        }

        await this.prisma.drink.create({
          data: this.buildCreateDataFromCsvRow(row, imageUrl),
        });

        imported += 1;
      } catch (error: unknown) {
        if (imageUrl) {
          deleteDrinkImage(imageUrl);
        }

        failed.push({
          row: row.rowNumber,
          title: row.title,
          messages: [this.toImportErrorMessage(error)],
        });
      }
    }

    const catalogTotal = await this.prisma.drink.count();

    return {
      imported,
      failed,
      catalogTotal,
    };
  }

  private toImportErrorMessage(error: unknown): string {
    if (isUniqueConstraintError(error)) {
      return 'Title already exists.';
    }

    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = response.message;
        if (typeof message === 'string') {
          return message;
        }
        if (Array.isArray(message)) {
          return message.join(', ');
        }
      }
    }

    return 'Failed to import row.';
  }

  async getCatalogCapacity() {
    const total = await this.prisma.drink.count();
    const remaining = Math.max(DRINKS_CATALOG_MAX - total, 0);

    return {
      total,
      max: DRINKS_CATALOG_MAX,
      remaining,
    };
  }

  async findAll(query: FindDrinksQueryDto = {}): Promise<PaginatedDrinkList> {
    const page = query.page ?? DRINKS_DEFAULT_PAGE;
    const limit = query.limit ?? DRINKS_DEFAULT_LIMIT;
    const where = buildDrinkWhere(query);
    const orderBy = buildDrinkOrderBy(query.sort, query.order);

    const [data, total] = await Promise.all([
      this.prisma.drink.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.drink.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: { page, limit, total, totalPages },
    };
  }

  async findOne(id: number) {
    const drink = await this.prisma.drink.findUnique({ where: { id } });
    if (!drink) {
      throw new NotFoundException(`Drink #${id} not found`);
    }
    return drink;
  }

  async update(
    id: number,
    updateDrinkDto: UpdateDrinkDto,
    image?: Express.Multer.File,
  ) {
    const existing = await this.prisma.drink.findUnique({ where: { id } });
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

    const dto = { ...updateDrinkDto };
    delete dto.removeImage;

    try {
      return await this.prisma.drink.update({
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
    const existing = await this.prisma.drink.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Drink #${id} not found`);
    }

    if (existing.imageUrl) {
      deleteDrinkImage(existing.imageUrl);
    }

    await this.prisma.drink.delete({ where: { id } });
    return `This action removes a #${id} drink`;
  }
}
