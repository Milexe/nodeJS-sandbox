import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
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

export class ImportDrinkCsvRowDto {
  @IsString()
  @MaxLength(DRINK_TITLE_MAX_LENGTH)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(DRINK_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  abv: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(5)
  rating?: number;

  @Type(() => Number)
  @IsNumber({ ...numberOpts, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(DRINK_PRICE_MAX)
  price: number;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  })
  imageUrl?: string;
}
