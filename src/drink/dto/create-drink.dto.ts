import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DRINK_DESCRIPTION_MAX_LENGTH,
  DRINK_PRICE_MAX,
  DRINK_TITLE_MAX_LENGTH,
} from '../drink.constants';

const numberOpts = { allowNaN: false, allowInfinity: false } as const;

export class CreateDrinkDto {
  @IsString()
  @MaxLength(DRINK_TITLE_MAX_LENGTH)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(DRINK_DESCRIPTION_MAX_LENGTH)
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
  @Max(DRINK_PRICE_MAX, {
    message: `Price must not exceed ${DRINK_PRICE_MAX}`,
  })
  price: number;
}
