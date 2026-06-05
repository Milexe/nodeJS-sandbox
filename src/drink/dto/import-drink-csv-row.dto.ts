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

const numberOpts = { allowNaN: false, allowInfinity: false } as const;

export class ImportDrinkCsvRowDto {
  @IsString()
  @MaxLength(40)
  title: string;

  @IsOptional()
  @IsString()
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
  price: number;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  })
  imageUrl?: string;
}
