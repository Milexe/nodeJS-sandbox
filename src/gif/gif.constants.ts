export const ARTSEARCH_BASE_URL = 'https://api.artsearch.io';
/** ArtSearch free tier — used when upstream omits quota headers on 402. */
export const ARTSEARCH_DAILY_QUOTA_LIMIT = 50;
export const ARTSEARCH_ARTWORKS_PATH = '/artworks';
export const ARTSEARCH_REQUEST_TIMEOUT_MS = 10_000;

/** ArtSearch caps search results at 10 artworks per request. */
export const ARTWORKS_UPSTREAM_MAX = 10;
export const ARTWORKS_DEFAULT_LIMIT = ARTWORKS_UPSTREAM_MAX;
export const ARTWORKS_MAX_LIMIT = ARTWORKS_UPSTREAM_MAX;
export const ARTWORKS_DEFAULT_OFFSET = 0;
export const ARTWORKS_MAX_QUERY_LENGTH = 200;

/** Subset aligned with ArtSearch Search Artworks API docs. */
export const ARTWORK_TYPES = [
  'tapestry',
  'collotype',
  'collage',
  'printmaking',
  'cutting',
  'digital_art',
  'sculpture',
  'metalwork',
  'fragment',
  'token',
  'embroidery',
  'painting',
  'jewellery',
  'print',
  'ornament',
  'photograph',
  'statuette',
  'furniture',
  'needlework',
  'drawing',
  'miniature',
  'tile',
  'stereograph',
  'calligraphy',
] as const;

export const ARTWORK_MATERIALS = [
  'ink',
  'textile',
  'metal',
  'bronze',
  'canvas',
  'stone',
  'chalk',
  'velvet',
  'silver',
  'charcoal',
  'gold_leaf',
  'porcelain',
  'jade',
  'cotton',
  'paint',
  'graphite',
  'plastic',
  'clay',
  'ivory',
  'earthenware',
  'tin',
  'linen',
  'silk',
  'glass',
  'lead',
  'brass',
  'oil_paint',
  'pencil',
  'leather',
  'gold',
  'marble',
  'watercolor',
  'iron',
  'gouache',
  'wool',
  'ceramic',
  'parchment',
  'paper',
  'pastel',
  'copper',
  'cardboard',
  'oak',
  'wood',
] as const;

export const ARTWORK_TECHNIQUES = [
  'engraving',
  'grinding',
  'embroidering',
  'etching',
  'vitrification',
  'gilding',
  'lithography',
  'knitting',
  'cyanotype',
  'silkscreen',
  'woodcut',
  'printing',
  'drypoint',
  'photolithography',
  'weaving',
  'sawing',
  'casting',
  'glassblowing',
  'block_printing',
  'photographing',
  'forging',
] as const;
