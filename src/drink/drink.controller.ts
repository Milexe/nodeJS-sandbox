import {

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

import { DrinkService } from './drink.service';

import { CreateDrinkDto } from './dto/create-drink.dto';

import { FindDrinksQueryDto } from './dto/find-drinks-query.dto';

import { UpdateDrinkDto } from './dto/update-drink.dto';

import {

  DRINK_IMAGE_MAX_BYTES,

  drinkImageFileFilter,

  drinkImageStorage,

} from './drink-image.storage';



const drinkImageInterceptor = FileInterceptor('image', {

  storage: drinkImageStorage,

  fileFilter: drinkImageFileFilter,

  limits: { fileSize: DRINK_IMAGE_MAX_BYTES },

});



@Controller('drink')

export class DrinkController {

  constructor(private readonly drinkService: DrinkService) {}



  @Post()

  @UseInterceptors(drinkImageInterceptor)

  create(

    @Body() createDrinkDto: CreateDrinkDto,

    @UploadedFile() image?: Express.Multer.File,

  ) {

    return this.drinkService.create(createDrinkDto, image);

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

  @UseInterceptors(drinkImageInterceptor)

  update(

    @Param('id') id: string,

    @Body() updateDrinkDto: UpdateDrinkDto,

    @UploadedFile() image?: Express.Multer.File,

  ) {

    return this.drinkService.update(parseInt(id, 10), updateDrinkDto, image);

  }



  @Delete(':id')

  remove(@Param('id') id: string) {

    return this.drinkService.remove(parseInt(id, 10));

  }

}

