import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ example: 'landscape', maxLength: ARTWORKS_MAX_QUERY_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(ARTWORKS_MAX_QUERY_LENGTH)
  query?: string;

  @ApiPropertyOptional({ enum: ARTWORK_TYPES })
  @IsOptional()
  @IsIn(ARTWORK_TYPES)
  type?: (typeof ARTWORK_TYPES)[number];

  @ApiPropertyOptional({ enum: ARTWORK_MATERIALS })
  @IsOptional()
  @IsIn(ARTWORK_MATERIALS)
  material?: (typeof ARTWORK_MATERIALS)[number];

  @ApiPropertyOptional({ enum: ARTWORK_TECHNIQUES })
  @IsOptional()
  @IsIn(ARTWORK_TECHNIQUES)
  technique?: (typeof ARTWORK_TECHNIQUES)[number];

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: ARTWORKS_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ARTWORKS_MAX_LIMIT)
  number?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
