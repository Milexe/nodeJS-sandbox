import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DrinkService } from './drink.service';
import { CreateDrinkDto } from './dto/create-drink.dto';
import { UpdateDrinkDto } from './dto/update-drink.dto';
import { title } from 'process';

@Controller('drink')
export class DrinkController {
  constructor(private readonly drinkService: DrinkService) {}

  @Post()
  create(@Body() createDrinkDto: CreateDrinkDto) {
    return this.drinkService.create(createDrinkDto);
  }

  @Get()
  findAll(@Query() query: Record<string, any>) {
    return this.drinkService.findAll(query['title']);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drinkService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDrinkDto: UpdateDrinkDto) {
    return this.drinkService.update(parseInt(id), updateDrinkDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.drinkService.remove(parseInt(id));
  }
}
