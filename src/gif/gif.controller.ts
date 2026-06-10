import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindArtworksQueryDto } from './dto/find-artworks-query.dto';
import { GifService } from './gif.service';

@ApiTags('artwork')
@Controller('gif')
export class GifController {
  constructor(private readonly gifService: GifService) {}

  @Get()
  @ApiOperation({ summary: 'Search artworks via ArtSearch proxy' })
  @ApiResponse({ status: 200, description: 'Artwork results' })
  @ApiResponse({ status: 429, description: 'Upstream daily quota exceeded' })
  searchArtworks(@Query() query: FindArtworksQueryDto) {
    return this.gifService.searchArtworks(query);
  }
}
