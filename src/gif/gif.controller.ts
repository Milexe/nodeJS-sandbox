import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';

@Controller('gif')
export class GifController {
  constructor(private readonly httpService: HttpService) {}

  @Get()
  async findAll(@Query() query: Record<string, string>) {
    const params = new URLSearchParams(query).toString();
    const url = `https://api.artsearch.io/artworks${params ? `?${params}` : ''}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'x-api-key': process.env.ARTSEARCH_SECRET ?? '' },
        }),
      );
      return response.data as unknown;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.log(error.response?.data);
      }
      throw new HttpException('Roman is a teapot', HttpStatus.I_AM_A_TEAPOT);
    }
  }
}
