import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateDrinkDto } from './create-drink.dto';

export class UpdateDrinkDto extends PartialType(CreateDrinkDto) {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  removeImage?: boolean;
}
