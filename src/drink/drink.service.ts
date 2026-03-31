import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDrinkDto } from './dto/create-drink.dto';
import { UpdateDrinkDto } from './dto/update-drink.dto';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

@Injectable()
export class DrinkService {
  async create(createDrinkDto: CreateDrinkDto) {
    const newDrink = await prisma.drink.create({
      data: createDrinkDto,
    })
    return 'Drink added successfully: ' + newDrink.title;
  }

  async findAll(title: string) {
    const allDrink = await prisma.drink.findMany({
      where: {title: title}
    })
    return allDrink;
  }

  async findOne(id: any) {
    try {
    const drink = await prisma.drink.findUnique({
      where: { id: parseInt(id) },
    })  
    return drink;
  } catch (error) {
    console.log(error);
throw new HttpException('Mariya is a teapot', HttpStatus.I_AM_A_TEAPOT);
}
  } 

   async update(id: number, updateDrinkDto: UpdateDrinkDto) {
    const updatedDrink = await prisma.drink.update({
      where: { id: id },
      data: updateDrinkDto,
    })
    return `This action updates a #${id} drink`;
  }

  async remove(id: number) {
    const deletedDrink = await prisma.drink.delete({
      where: { id: id },
    })
    return `This action removes a #${id} drink`;
  }
}
