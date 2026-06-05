import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const numberOpts = { allowNaN: false, allowInfinity: false } as const;

export class CreateDrinkDto {
  @IsString()
  @MaxLength(40)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0, { message: 'ABV must be at least 0' })
  @Max(100, { message: 'ABV must not exceed 100' })
  abv: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0, { message: 'Rating must be at least 0' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;

  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price must be at least 0' })
  price: number;
}
