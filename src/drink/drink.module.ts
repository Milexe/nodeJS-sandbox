import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DrinkService } from './drink.service';
import { DrinkController } from './drink.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DrinkController],
  providers: [DrinkService],
})
export class DrinkModule {}
