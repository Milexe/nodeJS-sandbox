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
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(DRINK_SORT_FIELDS)
  sort?: DrinkSortField;

  @IsOptional()
  @IsIn(DRINK_SORT_ORDERS)
  order?: DrinkSortOrder;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  minAbv?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  maxAbv?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(5)
  maxRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DRINKS_MAX_LIMIT)
  limit?: number;
}
