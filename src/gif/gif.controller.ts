import { Controller, Get, Query, HttpException, HttpStatus, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';

const apiKey: string = process.env.ARTSEARCH_SECRET ?? '';

@Controller('gif')
export class GifController {
      constructor(private readonly httpService: HttpService) {}

    @Get()
    async findAll(@Query() query: Record<string, any>) {
        const params = new URLSearchParams(query).toString();
        const url = `https://api.artsearch.io/artworks${params ? `?${params}` : ''}`;

            try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'x-api-key': process.env.ARTSEARCH_SECRET ?? '' }
        })
      );
      return response.data;
    } catch (error) {
            console.log(error.response.data);
      throw new HttpException('Roman is a teapot', HttpStatus.I_AM_A_TEAPOT);
    }

    }
}
