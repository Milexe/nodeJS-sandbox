import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Guinness Stout', maxLength: DRINK_TITLE_MAX_LENGTH })
  @IsString()
  @MaxLength(DRINK_TITLE_MAX_LENGTH)
  title: string;

  @ApiPropertyOptional({ example: 'Dark Irish dry stout', maxLength: DRINK_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(DRINK_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({ example: 4.2, minimum: 0, maximum: 100, description: 'Alcohol by volume (%)' })
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0, { message: 'ABV must be at least 0' })
  @Max(100, { message: 'ABV must not exceed 100' })
  abv: number;

  @ApiPropertyOptional({ example: 4.5, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0, { message: 'Rating must be at least 0' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;

  @ApiProperty({ example: 3.99, minimum: 0, maximum: DRINK_PRICE_MAX })
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price must be at least 0' })
  @Max(DRINK_PRICE_MAX, {
    message: `Price must not exceed ${DRINK_PRICE_MAX}`,
  })
  price: number;
}
