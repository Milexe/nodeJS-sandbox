export type ArtsearchArtwork = {
  id: number
  title: string
  image: string
}

export type ArtsearchQuota = {
  left: number | null
  used: number | null
  request: number | null
}

export type ArtsearchSearchResponse = {
  available: number
  number: number
  offset: number
  artworks: ArtsearchArtwork[]
  quota?: ArtsearchQuota
}

export type ArtsearchQuery = {
  query?: string
  type?: string
  material?: string
  technique?: string
  number?: number
  offset?: number
}
