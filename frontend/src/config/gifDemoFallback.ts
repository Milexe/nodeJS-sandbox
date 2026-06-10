import { apiUrl } from '../api'
import heroImage from '../assets/hero.png'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import type { ArtsearchArtwork, ArtsearchSearchResponse } from '../types/artsearch'
import { ARTWORKS_PAGE_SIZE } from './artsearchCatalog'
const DEMO_IMAGE_COPIES = 3

/** Static images committed to this repo (no external URLs). */
const DEMO_IMAGE_POOL = [
  heroImage,
  reactLogo,
  viteLogo,
  '/images/default-drink.png',
  '/favicon.svg',
  '/icons.svg',
  apiUrl('/samples/csv-import-example.png'),
] as const

/** Drink catalog titles from prisma/seed-drinks.sql — reused as demo artwork labels. */
const DEMO_TITLE_POOL = [
  'Midnight Stout',
  'Citrus IPA',
  'Golden Lager',
  'Smoky Porter',
  'Wheat Haze',
  'Amber Ale',
  'Session Pale',
  'Belgian Tripel',
  'Farmhouse Saison',
  'Cherry Sour',
  'Oatmeal Stout',
  'Mango Sour',
  'Rye IPA',
  'Honey Blonde',
  'Imperial Stout',
  'Pilsner Classic',
  'Red Ale',
] as const

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function isArtsearchQuotaError(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes('daily quota exceeded') || lower.includes('quota exceeded')
}

export function buildRandomDemoArtworks(): ArtsearchArtwork[] {
  const titles = shuffle(DEMO_TITLE_POOL)
  const artworks: ArtsearchArtwork[] = []
  let titleIndex = 0

  for (const image of DEMO_IMAGE_POOL) {
    for (let copy = 0; copy < DEMO_IMAGE_COPIES; copy += 1) {
      artworks.push({
        id: -(artworks.length + 1),
        title: titles[titleIndex % titles.length]!,
        image,
      })
      titleIndex += 1
    }
  }

  return shuffle(artworks)
}

export function sliceDemoSearchResponse(
  artworks: ArtsearchArtwork[],
  offset: number,
  pageSize = ARTWORKS_PAGE_SIZE,
): ArtsearchSearchResponse {
  return {
    available: artworks.length,
    number: pageSize,
    offset,
    artworks: artworks.slice(offset, offset + pageSize),
  }
}
