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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('drinks')
@Controller('drink')
export class DrinkController {
  constructor(private readonly drinkService: DrinkService) {}

  @Post()
  @Throttle(drinkWriteThrottle)
  @UseInterceptors(drinkImageInterceptor)
  @ApiOperation({ summary: 'Create a drink' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: '#/components/schemas/CreateDrinkDto' },
        { properties: { image: { type: 'string', format: 'binary', description: 'Optional drink image' } } },
      ],
    },
  })
  @ApiResponse({ status: 201, description: 'Drink created' })
  create(
    @Body() createDrinkDto: CreateDrinkDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.drinkService.create(createDrinkDto, image);
  }

  @Post('import')
  @Throttle(drinkImportThrottle)
  @UseInterceptors(drinkCsvInterceptor)
  @ApiOperation({ summary: 'Bulk import drinks from a CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: { file: { type: 'string', format: 'binary', description: 'CSV file' } },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Import result' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  importCsv(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required.');
    }

    return this.drinkService.importFromCsv(file.buffer);
  }

  @Get('catalog/capacity')
  @ApiOperation({ summary: 'Get current catalog size and capacity limit' })
  @ApiResponse({ status: 200, description: 'Catalog capacity info' })
  getCatalogCapacity() {
    return this.drinkService.getCatalogCapacity();
  }

  @Get()
  @ApiOperation({ summary: 'List drinks with filters, sorting, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of drinks' })
  findAll(@Query() query: FindDrinksQueryDto) {
    return this.drinkService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a drink by ID' })
  @ApiParam({ name: 'id', description: 'Drink ID' })
  @ApiResponse({ status: 200, description: 'Drink found' })
  @ApiResponse({ status: 404, description: 'Drink not found' })
  findOne(@Param('id') id: string) {
    return this.drinkService.findOne(id);
  }

  @Patch(':id')
  @Throttle(drinkWriteThrottle)
  @UseInterceptors(drinkImageInterceptor)
  @ApiOperation({ summary: 'Update a drink' })
  @ApiParam({ name: 'id', description: 'Drink ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: '#/components/schemas/UpdateDrinkDto' },
        { properties: { image: { type: 'string', format: 'binary', description: 'Replacement image' } } },
      ],
    },
  })
  @ApiResponse({ status: 200, description: 'Drink updated' })
  @ApiResponse({ status: 404, description: 'Drink not found' })
  update(
    @Param('id') id: string,
    @Body() updateDrinkDto: UpdateDrinkDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.drinkService.update(parseInt(id, 10), updateDrinkDto, image);
  }

  @Delete(':id')
  @Throttle(drinkWriteThrottle)
  @ApiOperation({ summary: 'Delete a drink' })
  @ApiParam({ name: 'id', description: 'Drink ID' })
  @ApiResponse({ status: 200, description: 'Drink deleted' })
  @ApiResponse({ status: 404, description: 'Drink not found' })
  remove(@Param('id') id: string) {
    return this.drinkService.remove(parseInt(id, 10));
  }
}
