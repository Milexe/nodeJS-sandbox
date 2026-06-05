import type { SyntheticEvent } from 'react'
import { apiUrl } from '../api'

export const DEFAULT_DRINK_IMAGE = '/images/default-drink.png'
export const DRINK_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const DRINK_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

export function resolveDrinkImageSrc(
  imageUrl: string | null | undefined,
): string {
  if (!imageUrl) {
    return DEFAULT_DRINK_IMAGE
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return apiUrl(imageUrl)
}

export function handleDrinkImageError(
  event: SyntheticEvent<HTMLImageElement>,
): void {
  event.currentTarget.onerror = null
  event.currentTarget.src = DEFAULT_DRINK_IMAGE
}

export function validateDrinkImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Image must be JPEG, PNG, or WebP.'
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Image must be JPEG, PNG, or WebP.'
  }

  if (file.size > DRINK_IMAGE_MAX_BYTES) {
    return 'Image must be 2 MB or smaller.'
  }

  return null
}
