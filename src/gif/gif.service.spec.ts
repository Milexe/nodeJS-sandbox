import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { GifService } from './gif.service';

function axiosError(
  status?: number,
  code?: string,
  headers: Record<string, string> = {},
): AxiosError {
  const error = new AxiosError('request failed', code);
  if (status !== undefined) {
    error.response = {
      status,
      data: {},
      statusText: 'Error',
      headers,
      config: { headers: new AxiosHeaders() },
    };
  }
  return error;
}

describe('GifService', () => {
  let service: GifService;
  let httpGet: jest.Mock;
  const originalSecret = process.env.ARTSEARCH_SECRET;

  beforeEach(async () => {
    httpGet = jest.fn();
    process.env.ARTSEARCH_SECRET = 'test-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GifService,
        {
          provide: HttpService,
          useValue: { get: httpGet },
        },
      ],
    }).compile();

    service = module.get<GifService>(GifService);
  });

  afterEach(() => {
    process.env.ARTSEARCH_SECRET = originalSecret;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns upstream data on success', async () => {
    const payload = {
      available: 1,
      number: 1,
      offset: 0,
      artworks: [{ id: 1, title: 'Test', image: 'https://example.com/a.jpg' }],
    };
    httpGet.mockReturnValue(of({ data: payload }));

    await expect(
      service.searchArtworks({ query: 'knight', type: 'painting' }),
    ).resolves.toEqual(payload);

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('https://api.artsearch.io/artworks?'),
      expect.objectContaining({
        headers: { 'x-api-key': 'test-secret-key' },
      }),
    );

    const [url] = httpGet.mock.calls[0] as [string, unknown];
    expect(url).toContain('query=knight');
    expect(url).toContain('type=painting');
    expect(url).toContain('number=10');
    expect(url).toContain('offset=0');
    expect(url).not.toContain('api-key');
  });

  it('throws 400 when search query is missing', async () => {
    await expect(service.searchArtworks({})).rejects.toThrow(
      BadRequestException,
    );
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('returns upstream quota headers in the response', async () => {
    const payload = {
      available: 1,
      number: 1,
      offset: 0,
      artworks: [],
    };
    httpGet.mockReturnValue(
      of({
        data: payload,
        headers: {
          'x-api-quota-left': '42',
          'x-api-quota-used': '8',
          'x-api-quota-request': '1',
        },
      }),
    );

    await expect(service.searchArtworks({ query: 'knight' })).resolves.toEqual({
      ...payload,
      quota: { left: 42, used: 8, request: 1 },
    });
  });

  it('throws 503 when ARTSEARCH_SECRET is missing', async () => {
    delete process.env.ARTSEARCH_SECRET;

    await expect(service.searchArtworks({})).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('maps upstream 402 to quota exceeded payload with headers', async () => {
    httpGet.mockReturnValue(
      throwError(() =>
        axiosError(402, undefined, {
          'x-api-quota-left': '0',
          'x-api-quota-used': '50',
          'x-api-quota-request': '1',
        }),
      ),
    );

    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toMatchObject({
      response: {
        message: 'ArtSearch daily quota exceeded. Resets at midnight UTC.',
        quota: { left: 0, used: 50, request: 1 },
      },
      status: 502,
    });
  });

  it('maps upstream 402 without quota headers to exhausted fallback', async () => {
    httpGet.mockReturnValue(throwError(() => axiosError(402)));

    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toMatchObject({
      response: {
        message: 'ArtSearch daily quota exceeded. Resets at midnight UTC.',
        quota: { left: 0, used: 50, request: 1 },
      },
      status: 502,
    });
  });

  it('maps upstream 429 to 429', async () => {
    httpGet.mockReturnValue(throwError(() => axiosError(429)));

    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toMatchObject({
      response: 'Upstream rate limit exceeded',
      status: 429,
    });
  });

  it('maps upstream 4xx to 502', async () => {
    httpGet.mockReturnValue(throwError(() => axiosError(400)));

    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toMatchObject({
      response: 'Upstream API rejected the request',
      status: 502,
    });
  });

  it('maps upstream 5xx to 502', async () => {
    httpGet.mockReturnValue(throwError(() => axiosError(503)));

    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toMatchObject({
      response: 'Upstream service unavailable',
      status: 502,
    });
  });

  it('maps timeout to 504', async () => {
    httpGet.mockReturnValue(
      throwError(() => axiosError(undefined, 'ETIMEDOUT')),
    );

    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toMatchObject({
      response: 'Upstream request timed out',
      status: 504,
    });
  });

  it('maps network errors to 502', async () => {
    httpGet.mockReturnValue(throwError(() => axiosError()));

    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toBeInstanceOf(HttpException);
    await expect(
      service.searchArtworks({ query: 'knight' }),
    ).rejects.toMatchObject({
      response: 'Failed to reach upstream API',
      status: 502,
    });
  });
});
