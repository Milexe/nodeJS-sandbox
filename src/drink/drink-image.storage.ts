import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { memoryStorage } from 'multer';

export const DRINK_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const DRINK_CSV_MAX_BYTES = 512 * 1024;
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.png';
  }
}

function buildFilenameFromMime(mimeType: string): string {
  return `${randomUUID()}${extensionForMimeType(mimeType)}`;
}

function buildFilename(file: Express.Multer.File): string {
  const ext = extname(file.originalname).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.png';
  return `${randomUUID()}${safeExt}`;
}

export function saveDrinkImageBuffer(buffer: Buffer, mimeType: string): string {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new BadRequestException('Image must be JPEG, PNG, or WebP');
  }

  if (buffer.length > DRINK_IMAGE_MAX_BYTES) {
    throw new BadRequestException('Image must be 2 MB or smaller');
  }

  ensureUploadsDir();
  const filename = buildFilenameFromMime(mimeType);
  writeFileSync(join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export async function downloadDrinkImageFromUrl(url: string): Promise<string> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new BadRequestException('Image URL is invalid.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new BadRequestException('Image URL must use http or https.');
  }

  const response = await fetch(parsedUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new BadRequestException(
      `Image download failed with HTTP ${response.status}.`,
    );
  }

  const contentType = response.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim();

  if (!contentType || !ALLOWED_MIME_TYPES.has(contentType)) {
    throw new BadRequestException(
      'Image URL must point to JPEG, PNG, or WebP.',
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return saveDrinkImageBuffer(buffer, contentType);
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
