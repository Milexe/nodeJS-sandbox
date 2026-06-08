import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AxiosError, isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { FindArtworksQueryDto } from './dto/find-artworks-query.dto';
import {
  ARTSEARCH_ARTWORKS_PATH,
  ARTSEARCH_BASE_URL,
  ARTSEARCH_DAILY_QUOTA_LIMIT,
  ARTSEARCH_REQUEST_TIMEOUT_MS,
  ARTWORKS_DEFAULT_LIMIT,
  ARTWORKS_DEFAULT_OFFSET,
} from './gif.constants';
import {
  ArtsearchQuota,
  ArtsearchSearchResponse,
} from './types/artsearch.types';

@Injectable()
export class GifService {
  private readonly logger = new Logger(GifService.name);

  constructor(private readonly httpService: HttpService) {}

  async searchArtworks(
    query: FindArtworksQueryDto,
  ): Promise<ArtsearchSearchResponse> {
    const apiKey = process.env.ARTSEARCH_SECRET?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('Upstream API is not configured');
    }

    const params = this.buildSearchParams(query);
    const url = `${ARTSEARCH_BASE_URL}${ARTSEARCH_ARTWORKS_PATH}?${params.toString()}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<ArtsearchSearchResponse>(url, {
          headers: { 'x-api-key': apiKey },
          timeout: ARTSEARCH_REQUEST_TIMEOUT_MS,
        }),
      );
      return {
        ...response.data,
        quota: this.parseQuotaHeaders(response.headers),
      };
    } catch (error: unknown) {
      throw this.mapUpstreamError(error);
    }
  }

  private buildSearchParams(query: FindArtworksQueryDto): URLSearchParams {
    const params = new URLSearchParams();
    const number = query.number ?? ARTWORKS_DEFAULT_LIMIT;
    const offset = query.offset ?? ARTWORKS_DEFAULT_OFFSET;

    params.set('number', String(number));
    params.set('offset', String(offset));

    const searchQuery = query.query?.trim();
    if (!searchQuery) {
      throw new BadRequestException('Search query is required');
    }
    params.set('query', searchQuery);
    if (query.type) {
      params.set('type', query.type);
    }
    if (query.material) {
      params.set('material', query.material);
    }
    if (query.technique) {
      params.set('technique', query.technique);
    }

    return params;
  }

  private parseQuotaHeaders(
    headers: Record<string, unknown> | undefined,
  ): ArtsearchQuota | undefined {
    if (!headers) {
      return undefined;
    }

    const left = this.parseQuotaHeader(headers['x-api-quota-left']);
    const used = this.parseQuotaHeader(headers['x-api-quota-used']);
    const request = this.parseQuotaHeader(headers['x-api-quota-request']);

    if (left === null && used === null && request === null) {
      return undefined;
    }

    return { left, used, request };
  }

  private resolveExhaustedQuota(
    headers: Record<string, unknown> | undefined,
  ): ArtsearchQuota {
    const parsed = this.parseQuotaHeaders(headers);
    if (parsed) {
      return {
        left: parsed.left ?? 0,
        used: parsed.used,
        request: parsed.request,
      };
    }

    return {
      left: 0,
      used: ARTSEARCH_DAILY_QUOTA_LIMIT,
      request: 1,
    };
  }

  private parseQuotaHeader(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private mapUpstreamError(error: unknown): HttpException {
    if (isAxiosError(error)) {
      return this.mapAxiosError(error);
    }

    this.logger.error('Unexpected error while calling ArtSearch', error);
    return new HttpException(
      'Failed to reach upstream API',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private mapAxiosError(error: AxiosError): HttpException {
    const status = error.response?.status;

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new HttpException(
        'Upstream request timed out',
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    if (status === 402) {
      return new HttpException(
        {
          message: 'ArtSearch daily quota exceeded. Resets at midnight UTC.',
          quota: this.resolveExhaustedQuota(error.response?.headers),
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (status === 429) {
      return new HttpException(
        'Upstream rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (status !== undefined && status >= 400 && status < 500) {
      this.logger.warn(`ArtSearch client error: ${status}`);
      return new HttpException(
        'Upstream API rejected the request',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (status !== undefined && status >= 500) {
      this.logger.warn(`ArtSearch server error: ${status}`);
      return new HttpException(
        'Upstream service unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.warn(`ArtSearch request failed: ${error.message}`);
    return new HttpException(
      'Failed to reach upstream API',
      HttpStatus.BAD_GATEWAY,
    );
  }
}
