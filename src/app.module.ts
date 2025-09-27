import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { GifController } from './gif/gif.controller';


@Module({
  imports: [HttpModule],
  controllers: [AppController, GifController],
  providers: [AppService],
})
export class AppModule {}
