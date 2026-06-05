import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { DrinkService } from './drink.service';
import { CreateDrinkDto } from './dto/create-drink.dto';
import { FindDrinksQueryDto } from './dto/find-drinks-query.dto';
import { UpdateDrinkDto } from './dto/update-drink.dto';
import {
  DRINK_CSV_MAX_BYTES,
  DRINK_IMAGE_MAX_BYTES,
  drinkImageFileFilter,
  drinkImageStorage,
} from './drink-image.storage';
import {
  drinkImportThrottle,
  drinkWriteThrottle,
} from '../throttle/throttle.config';

const drinkImageInterceptor = FileInterceptor('image', {
  storage: drinkImageStorage,
  fileFilter: drinkImageFileFilter,
  limits: { fileSize: DRINK_IMAGE_MAX_BYTES },
});

const drinkCsvInterceptor = FileInterceptor('file', {
  storage: drinkImageStorage,
  limits: { fileSize: DRINK_CSV_MAX_BYTES },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = new Set(['text/csv', 'application/vnd.ms-excel']);
    const allowedExtensions = file.originalname.toLowerCase().endsWith('.csv');

    if (allowedTypes.has(file.mimetype) || allowedExtensions) {
      callback(null, true);
      return;
    }

    callback(
      new BadRequestException('Import file must be a CSV (.csv).'),
      false,
    );
  },
});

@Controller('drink')
export class DrinkController {
  constructor(private readonly drinkService: DrinkService) {}

  @Post()
  @Throttle(drinkWriteThrottle)
  @UseInterceptors(drinkImageInterceptor)
  create(
    @Body() createDrinkDto: CreateDrinkDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.drinkService.create(createDrinkDto, image);
  }

  @Post('import')
  @Throttle(drinkImportThrottle)
  @UseInterceptors(drinkCsvInterceptor)
  importCsv(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required.');
    }

    return this.drinkService.importFromCsv(file.buffer);
  }

  @Get('catalog/capacity')
  getCatalogCapacity() {
    return this.drinkService.getCatalogCapacity();
  }

  @Get()
  findAll(@Query() query: FindDrinksQueryDto) {
    return this.drinkService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drinkService.findOne(id);
  }

  @Patch(':id')
  @Throttle(drinkWriteThrottle)
  @UseInterceptors(drinkImageInterceptor)
  update(
    @Param('id') id: string,
    @Body() updateDrinkDto: UpdateDrinkDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.drinkService.update(parseInt(id, 10), updateDrinkDto, image);
  }

  @Delete(':id')
  @Throttle(drinkWriteThrottle)
  remove(@Param('id') id: string) {
    return this.drinkService.remove(parseInt(id, 10));
  }
}
