import { Test, TestingModule } from '@nestjs/testing';
import { GifController } from './gif.controller';
import { GifService } from './gif.service';

describe('GifController', () => {
  let controller: GifController;
  const gifService = {
    searchArtworks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GifController],
      providers: [
        {
          provide: GifService,
          useValue: gifService,
        },
      ],
    }).compile();

    controller = module.get<GifController>(GifController);
    gifService.searchArtworks.mockReset();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates search to GifService', async () => {
    const query = { query: 'knight' };
    const response = {
      available: 1,
      number: 1,
      offset: 0,
      artworks: [],
    };
    gifService.searchArtworks.mockResolvedValue(response);

    await expect(controller.searchArtworks(query)).resolves.toEqual(response);
    expect(gifService.searchArtworks).toHaveBeenCalledWith(query);
  });
});
