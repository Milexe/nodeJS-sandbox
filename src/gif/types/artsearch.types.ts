export type ArtsearchArtwork = {
  id: number;
  title: string;
  image: string;
};

/** Parsed from ArtSearch response headers (X-Api-Quota-*). */
export type ArtsearchQuota = {
  left: number | null;
  used: number | null;
  request: number | null;
};

export type ArtsearchSearchResponse = {
  available: number;
  number: number;
  offset: number;
  artworks: ArtsearchArtwork[];
  quota?: ArtsearchQuota;
};
