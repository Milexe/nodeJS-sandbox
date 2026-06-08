import { apiUrl } from '../api'
import type {
  ArtsearchQuery,
  ArtsearchQuota,
  ArtsearchSearchResponse,
} from '../types/artsearch'

export class ArtworksFetchError extends Error {
  readonly quota?: ArtsearchQuota

  constructor(message: string, quota?: ArtsearchQuota) {
    super(message)
    this.name = 'ArtworksFetchError'
    this.quota = quota
  }
}

function parseQuotaFromBody(body: unknown): ArtsearchQuota | undefined {
  if (typeof body !== 'object' || body === null || !('quota' in body)) {
    return undefined
  }

  const quota = body.quota
  if (typeof quota !== 'object' || quota === null) {
    return undefined
  }

  return quota as ArtsearchQuota
}

function parseApiError(body: unknown, fallback: string): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    (typeof body.message === 'string' || Array.isArray(body.message))
  ) {
    return Array.isArray(body.message) ? body.message.join(', ') : body.message
  }

  return fallback
}

function buildArtworksSearchParams({
  query,
  type,
  material,
  technique,
  number,
  offset,
}: ArtsearchQuery): URLSearchParams {
  const params = new URLSearchParams()

  const trimmedQuery = query?.trim()
  if (trimmedQuery) {
    params.set('query', trimmedQuery)
  }
  if (type) {
    params.set('type', type)
  }
  if (material) {
    params.set('material', material)
  }
  if (technique) {
    params.set('technique', technique)
  }
  if (number !== undefined) {
    params.set('number', String(number))
  }
  if (offset !== undefined) {
    params.set('offset', String(offset))
  }

  return params
}

export async function fetchArtworks(
  query: ArtsearchQuery,
  signal?: AbortSignal,
): Promise<ArtsearchSearchResponse> {
  const params = buildArtworksSearchParams(query)
  const queryString = params.toString()
  const url = queryString ? apiUrl(`/gif?${queryString}`) : apiUrl('/gif')
  const res = await fetch(url, { signal })

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    throw new ArtworksFetchError(
      parseApiError(body, `HTTP ${res.status}`),
      parseQuotaFromBody(body),
    )
  }

  return res.json() as Promise<ArtsearchSearchResponse>
}
