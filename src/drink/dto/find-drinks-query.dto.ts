import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const DRINKS_DEFAULT_PAGE = 1;
export const DRINKS_DEFAULT_LIMIT = 10;
export const DRINKS_MAX_LIMIT = 100;

export const DRINK_SORT_FIELDS = [
  'title',
  'abv',
  'rating',
  'price',
  'id',
] as const;

export const DRINK_SORT_ORDERS = ['asc', 'desc'] as const;

export type DrinkSortField = (typeof DRINK_SORT_FIELDS)[number];
export type DrinkSortOrder = (typeof DRINK_SORT_ORDERS)[number];

const numberOpts = { allowNaN: false, allowInfinity: false } as const;

export class FindDrinksQueryDto {
  @ApiPropertyOptional({ example: 'stout' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DRINK_SORT_FIELDS })
  @IsOptional()
  @IsIn(DRINK_SORT_FIELDS)
  sort?: DrinkSortField;

  @ApiPropertyOptional({ enum: DRINK_SORT_ORDERS })
  @IsOptional()
  @IsIn(DRINK_SORT_ORDERS)
  order?: DrinkSortOrder;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }
    return undefined;
  })
  @IsBoolean()
  hasImage?: boolean;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  minAbv?: number;

  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  maxAbv?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 50, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: DRINKS_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: DRINKS_DEFAULT_LIMIT, minimum: 1, maximum: DRINKS_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DRINKS_MAX_LIMIT)
  limit?: number;
}
