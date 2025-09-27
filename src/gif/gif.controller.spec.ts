import { Test, TestingModule } from '@nestjs/testing';
import { GifController } from './gif.controller';

describe('GifController', () => {
  let controller: GifController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GifController],
    }).compile();

    controller = module.get<GifController>(GifController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
