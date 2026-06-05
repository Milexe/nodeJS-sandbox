import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { memoryStorage } from 'multer';

export const DRINK_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export const drinkImageStorage = memoryStorage();

export function drinkImageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    callback(
      new BadRequestException('Image must be JPEG, PNG, or WebP'),
      false,
    );
    return;
  }

  callback(null, true);
}

function buildFilename(file: Express.Multer.File): string {
  const ext = extname(file.originalname).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.png';
  return `${randomUUID()}${safeExt}`;
}

export function saveDrinkImage(file: Express.Multer.File): string {
  ensureUploadsDir();
  const filename = buildFilename(file);
  writeFileSync(join(UPLOADS_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

export function deleteDrinkImage(imageUrl: string | null | undefined): void {
  if (!imageUrl?.startsWith('/uploads/')) {
    return;
  }

  const filePath = join(UPLOADS_DIR, basename(imageUrl));
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
