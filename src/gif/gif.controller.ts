import { Controller, Get, Query } from '@nestjs/common';
import { FindArtworksQueryDto } from './dto/find-artworks-query.dto';
import { GifService } from './gif.service';

@Controller('gif')
export class GifController {
  constructor(private readonly gifService: GifService) {}

  @Get()
  searchArtworks(@Query() query: FindArtworksQueryDto) {
    return this.gifService.searchArtworks(query);
  }
}
