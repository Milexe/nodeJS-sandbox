import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ARTWORK_MATERIALS,
  ARTWORK_TECHNIQUES,
  ARTWORK_TYPES,
  ARTWORKS_MAX_LIMIT,
  ARTWORKS_MAX_QUERY_LENGTH,
} from '../gif.constants';

export class FindArtworksQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(ARTWORKS_MAX_QUERY_LENGTH)
  query?: string;

  @IsOptional()
  @IsIn(ARTWORK_TYPES)
  type?: (typeof ARTWORK_TYPES)[number];

  @IsOptional()
  @IsIn(ARTWORK_MATERIALS)
  material?: (typeof ARTWORK_MATERIALS)[number];

  @IsOptional()
  @IsIn(ARTWORK_TECHNIQUES)
  technique?: (typeof ARTWORK_TECHNIQUES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ARTWORKS_MAX_LIMIT)
  number?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
