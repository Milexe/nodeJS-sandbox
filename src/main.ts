import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createCorsOriginValidator } from './cors.config';
import { UPLOADS_DIR, ensureUploadsDir } from './drink/drink-image.storage';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SAMPLES_DIR = join(process.cwd(), 'samples');

async function bootstrap() {
  ensureUploadsDir();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads' });
  app.useStaticAssets(SAMPLES_DIR, { prefix: '/samples' });
  app.set('trust proxy', 1);
  app.enableCors({
    origin: createCorsOriginValidator(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('NodeJS Sandbox API')
      .setDescription('REST API for the NodeJS Sandbox portfolio project')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
