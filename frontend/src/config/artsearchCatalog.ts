/** Keep in sync with src/gif/gif.constants.ts (ArtSearch max per request). */
export const ARTWORKS_PAGE_SIZE = 10
export const ARTWORKS_MAX_QUERY_LENGTH = 200
/** Keep in sync with src/gif/gif.constants.ts ARTSEARCH_DAILY_QUOTA_LIMIT. */
export const ARTSEARCH_DAILY_QUOTA_LIMIT = 50

export const ARTWORK_FILTER_TYPES = [
  'painting',
  'sculpture',
  'photograph',
  'drawing',
  'digital_art',
  'print',
  'furniture',
  'jewellery',
] as const

export const ARTWORK_FILTER_MATERIALS = [
  'oil_paint',
  'bronze',
  'marble',
  'canvas',
  'wood',
  'gold',
  'silver',
  'paper',
  'glass',
  'ceramic',
] as const

export const ARTWORK_FILTER_TECHNIQUES = [
  'engraving',
  'etching',
  'lithography',
  'woodcut',
  'printing',
  'photographing',
  'casting',
] as const

export type ArtworkFilterType = (typeof ARTWORK_FILTER_TYPES)[number]
export type ArtworkFilterMaterial = (typeof ARTWORK_FILTER_MATERIALS)[number]
export type ArtworkFilterTechnique = (typeof ARTWORK_FILTER_TECHNIQUES)[number]
