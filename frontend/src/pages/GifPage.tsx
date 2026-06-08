import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { ArtworksFetchError, fetchArtworks } from '../api/gif'
import ArtworkPreviewModal from '../components/ArtworkPreviewModal'
import RateLimitsFootnote from '../components/RateLimitsFootnote'
import {
  ARTSEARCH_DAILY_QUOTA_LIMIT,
  ARTWORK_FILTER_MATERIALS,
  ARTWORK_FILTER_TECHNIQUES,
  ARTWORK_FILTER_TYPES,
  ARTWORKS_MAX_QUERY_LENGTH,
  ARTWORKS_PAGE_SIZE,
  type ArtworkFilterMaterial,
  type ArtworkFilterTechnique,
  type ArtworkFilterType,
} from '../config/artsearchCatalog'
import {
  buildRandomDemoArtworks,
  isArtsearchQuotaError,
  sliceDemoSearchResponse,
} from '../config/gifDemoFallback'
import type {
  ArtsearchArtwork,
  ArtsearchQuota,
  ArtsearchSearchResponse,
} from '../types/artsearch'
import { formatArtsearchLabel } from '../utils/artsearchLabels'
import {
  clampPage,
  offsetForPage,
  pageForOffset,
  totalPagesForCount,
} from '../utils/artsearchPagination'

const EMPTY_RESPONSE: ArtsearchSearchResponse = {
  available: 0,
  number: ARTWORKS_PAGE_SIZE,
  offset: 0,
  artworks: [],
}

const IDLE_MESSAGE = 'Enter a search term and click Search to begin'

const EXHAUSTED_QUOTA_FALLBACK: ArtsearchQuota = {
  left: 0,
  used: ARTSEARCH_DAILY_QUOTA_LIMIT,
  request: 1,
}

function hasQuotaDisplay(quota: ArtsearchQuota | null): quota is ArtsearchQuota {
  return quota !== null && quota.left !== null && quota.left !== undefined
}

type ArtworkFilters = {
  type: '' | ArtworkFilterType
  material: '' | ArtworkFilterMaterial
  technique: '' | ArtworkFilterTechnique
}

type AppliedSearch = {
  query: string
  filters: ArtworkFilters
}

const DEFAULT_FILTERS: ArtworkFilters = {
  type: '',
  material: '',
  technique: '',
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"
      />
    </svg>
  )
}

function hasActiveFilters(filters: ArtworkFilters, search: string): boolean {
  return (
    search.trim().length > 0 ||
    filters.type !== '' ||
    filters.material !== '' ||
    filters.technique !== ''
  )
}

function filtersMatch(a: ArtworkFilters, b: ArtworkFilters): boolean {
  return (
    a.type === b.type && a.material === b.material && a.technique === b.technique
  )
}

function matchesAppliedSearch(
  query: string,
  filters: ArtworkFilters,
  applied: AppliedSearch | null,
): boolean {
  if (!applied) {
    return false
  }

  return applied.query === query.trim() && filtersMatch(filters, applied.filters)
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.75" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M15 15l4.5 4.5"
      />
    </svg>
  )
}

type ArtworksPagerProps = {
  offset: number
  available: number
  rangeStart: number
  rangeEnd: number
  onOffsetChange: (offset: number) => void
}

function ArtworksPager({
  offset,
  available,
  rangeStart,
  rangeEnd,
  onOffsetChange,
}: ArtworksPagerProps) {
  const currentPage = pageForOffset(offset, ARTWORKS_PAGE_SIZE)
  const totalPages = totalPagesForCount(available, ARTWORKS_PAGE_SIZE)
  const [pageDraft, setPageDraft] = useState<string | null>(null)
  const pageInput = pageDraft ?? String(currentPage)

  function goToPage(page: number) {
    setPageDraft(null)
    onOffsetChange(offsetForPage(clampPage(page, totalPages), ARTWORKS_PAGE_SIZE))
  }

  function commitPageInput() {
    const parsed = Number.parseInt(pageInput, 10)
    if (Number.isNaN(parsed)) {
      setPageDraft(null)
      return
    }

    goToPage(parsed)
  }

  return (
    <footer className="gif-pager">
      <p className="gif-pager__summary">
        {rangeStart}–{rangeEnd} of {available.toLocaleString()} artworks
      </p>

      {totalPages > 1 ? (
        <nav className="gif-pager__bar" aria-label="Artworks pagination">
          <button
            type="button"
            className="gif-pager__btn"
            disabled={currentPage <= 1}
            aria-label="Previous page"
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeftIcon />
            <span>Prev</span>
          </button>

          <label className="gif-pager__page">
            <span className="gif-pager__page-label">Page</span>
            <input
              className="gif-pager__page-input"
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              aria-label={`Page number, current page ${currentPage} of ${totalPages}`}
              onChange={(event) => setPageDraft(event.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur()
                }
              }}
            />
            <span className="gif-pager__page-total">of {totalPages}</span>
          </label>

          <button
            type="button"
            className="gif-pager__btn"
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            onClick={() => goToPage(currentPage + 1)}
          >
            <span>Next</span>
            <ChevronRightIcon />
          </button>
        </nav>
      ) : null}
    </footer>
  )
}

const SKELETON_SHIMMER_HEIGHTS = [
  '118%',
  '92%',
  '136%',
  '104%',
  '124%',
  '88%',
  '112%',
  '98%',
  '128%',
  '108%',
] as const

function ArtworkCardSkeleton({ index }: { index: number }) {
  return (
    <article className="gif-card gif-card--skeleton" aria-hidden="true">
      <div className="gif-card__media">
        <div
          className="gif-card__shimmer"
          style={{ paddingBottom: SKELETON_SHIMMER_HEIGHTS[index % SKELETON_SHIMMER_HEIGHTS.length] }}
        />
      </div>
      <div className="gif-card__skeleton-line gif-card__skeleton-line--wide" />
      <div className="gif-card__skeleton-line" />
    </article>
  )
}

function ArtworkCard({
  artwork,
  priority = false,
  onOpen,
}: {
  artwork: ArtsearchArtwork
  priority?: boolean
  onOpen: (artwork: ArtsearchArtwork) => void
}) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  )
  const placeholderHeight =
    SKELETON_SHIMMER_HEIGHTS[artwork.id % SKELETON_SHIMMER_HEIGHTS.length]

  useEffect(() => {
    const image = imageRef.current

    if (image?.complete) {
      setImageState(image.naturalWidth > 0 ? 'loaded' : 'error')
      return
    }

    setImageState('loading')
  }, [artwork.id, artwork.image])

  function handleOpen() {
    if (imageState === 'error') {
      return
    }

    onOpen(artwork)
  }

  return (
    <article
      className="gif-card gif-card--interactive"
      role="button"
      tabIndex={imageState === 'error' ? -1 : 0}
      aria-label={`Open preview: ${artwork.title}`}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleOpen()
        }
      }}
    >
      <div className="gif-card__media">
        {imageState === 'error' ? (
          <div className="gif-card__fallback">Preview unavailable</div>
        ) : (
          <>
            {imageState === 'loading' ? (
              <div
                className="gif-card__shimmer"
                style={{ paddingBottom: placeholderHeight }}
                aria-hidden="true"
              />
            ) : null}
            <img
              ref={imageRef}
              className={
                imageState === 'loaded'
                  ? 'gif-card__image gif-card__image--visible'
                  : 'gif-card__image gif-card__image--pending'
              }
              src={artwork.image}
              alt={artwork.title}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'low'}
              onLoad={() => setImageState('loaded')}
              onError={() => setImageState('error')}
            />
          </>
        )}
      </div>
      <h3 className="gif-card__title">{artwork.title}</h3>
    </article>
  )
}

function ArtworkMasonry({
  children,
  label,
  columns = 2,
}: {
  children: ReactNode
  label: string
  columns?: 1 | 2 | 3
}) {
  return (
    <div
      className={`gif-masonry gif-masonry--cols-${columns}`}
      role="list"
      aria-label={label}
    >
      {children}
    </div>
  )
}

export default function GifPage() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<ArtworkFilters>(DEFAULT_FILTERS)
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null)
  const [offset, setOffset] = useState(0)
  const [result, setResult] = useState<ArtsearchSearchResponse>(EMPTY_RESPONSE)
  const [quota, setQuota] = useState<ArtsearchQuota | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDemoGallery, setIsDemoGallery] = useState(false)
  const [demoArtworksPool, setDemoArtworksPool] = useState<
    ArtsearchArtwork[] | null
  >(null)
  const [selectedArtwork, setSelectedArtwork] = useState<ArtsearchArtwork | null>(
    null,
  )

  const queryForFetch = useMemo(() => {
    if (!appliedSearch) {
      return null
    }

    return {
      query: appliedSearch.query,
      type: appliedSearch.filters.type || undefined,
      material: appliedSearch.filters.material || undefined,
      technique: appliedSearch.filters.technique || undefined,
      number: ARTWORKS_PAGE_SIZE,
      offset,
    }
  }, [appliedSearch, offset])

  const fetchKey = queryForFetch ? JSON.stringify(queryForFetch) : null
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const demoResult = useMemo(() => {
    if (demoArtworksPool === null || queryForFetch === null) {
      return null
    }

    return sliceDemoSearchResponse(demoArtworksPool, queryForFetch.offset ?? 0)
  }, [demoArtworksPool, queryForFetch])
  const displayResult = demoResult ?? result
  const loading =
    fetchKey !== null && demoArtworksPool === null && loadedKey !== fetchKey

  useEffect(() => {
    if (!queryForFetch || !fetchKey || demoArtworksPool !== null) {
      return
    }

    const controller = new AbortController()
    let cancelled = false

    void fetchArtworks(queryForFetch, controller.signal)
      .then((response) => {
        if (cancelled) {
          return
        }

        setResult(response)
        setQuota(response.quota ?? null)
        setError(null)
        setIsDemoGallery(false)
        setDemoArtworksPool(null)
        setLoadedKey(fetchKey)
      })
      .catch((e) => {
        if (cancelled) {
          return
        }
        if (e instanceof DOMException && e.name === 'AbortError') {
          return
        }

        const message =
          e instanceof Error ? e.message : 'Failed to load artworks'

        if (isArtsearchQuotaError(message)) {
          const pool = buildRandomDemoArtworks()
          setDemoArtworksPool(pool)
          setQuota(
            e instanceof ArtworksFetchError && e.quota
              ? e.quota
              : EXHAUSTED_QUOTA_FALLBACK,
          )
          setError(null)
          setIsDemoGallery(true)
        } else {
          setError(message)
          setIsDemoGallery(false)
        }

        setLoadedKey(fetchKey)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [demoArtworksPool, fetchKey, queryForFetch])

  const rangeStart =
    displayResult.available === 0 ? 0 : displayResult.offset + 1
  const rangeEnd = Math.min(
    displayResult.offset + displayResult.artworks.length,
    displayResult.available,
  )
  const trimmedSearchInput = searchInput.trim()
  const filtersActive = hasActiveFilters(filters, searchInput)
  const canSubmitSearch = useMemo(
    () =>
      trimmedSearchInput.length > 0 &&
      !matchesAppliedSearch(searchInput, filters, appliedSearch),
    [appliedSearch, filters, searchInput, trimmedSearchInput],
  )
  const showIdle = appliedSearch === null
  const showNoMatches =
    appliedSearch !== null && !loading && !error && displayResult.available === 0

  function handleSearchSubmit(event?: FormEvent) {
    event?.preventDefault()

    const query = searchInput.trim()
    if (!query || matchesAppliedSearch(searchInput, filters, appliedSearch)) {
      return
    }

    setDemoArtworksPool(null)
    setAppliedSearch({ query, filters: { ...filters } })
    setOffset(0)
  }

  function handleFilterChange<K extends keyof ArtworkFilters>(
    key: K,
    value: ArtworkFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleClearFilters() {
    setSearchInput('')
    setFilters(DEFAULT_FILTERS)
    setAppliedSearch(null)
    setOffset(0)
    setResult(EMPTY_RESPONSE)
    setQuota(null)
    setError(null)
    setIsDemoGallery(false)
    setDemoArtworksPool(null)
    setLoadedKey(null)
  }

  return (
    <>
      <section className="gif-page__notice" aria-label="How this demo works">
        <strong>External API Proxy &amp; Secret Handling</strong>
        <p>
          The browser calls Nest at <code>/gif</code>; the server forwards to
          ArtSearch with a secret key that never reaches the client.
        </p>
        <p className="gif-page__flow">
          Browser → Nest <code>/gif</code> → ArtSearch <code>/artworks</code>
        </p>
      </section>

      <form className="gif-form" onSubmit={handleSearchSubmit}>
        <label className="gif-form__field gif-form__field--search">
          <span className="gif-form__label">Search</span>
          <input
            className="gif-form__input"
            type="search"
            value={searchInput}
            maxLength={ARTWORKS_MAX_QUERY_LENGTH}
            placeholder="e.g. knight, sunset, melancholy"
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <div className="gif-form__row">
          <label className="gif-form__field">
            <span className="gif-form__label">Type</span>
            <select
              className="gif-form__select"
              value={filters.type}
              onChange={(event) =>
                handleFilterChange(
                  'type',
                  event.target.value as ArtworkFilters['type'],
                )
              }
            >
              <option value="">Any</option>
              {ARTWORK_FILTER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatArtsearchLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="gif-form__field">
            <span className="gif-form__label">Material</span>
            <select
              className="gif-form__select"
              value={filters.material}
              onChange={(event) =>
                handleFilterChange(
                  'material',
                  event.target.value as ArtworkFilters['material'],
                )
              }
            >
              <option value="">Any</option>
              {ARTWORK_FILTER_MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {formatArtsearchLabel(material)}
                </option>
              ))}
            </select>
          </label>

          <label className="gif-form__field">
            <span className="gif-form__label">Technique</span>
            <select
              className="gif-form__select"
              value={filters.technique}
              onChange={(event) =>
                handleFilterChange(
                  'technique',
                  event.target.value as ArtworkFilters['technique'],
                )
              }
            >
              <option value="">Any</option>
              {ARTWORK_FILTER_TECHNIQUES.map((technique) => (
                <option key={technique} value={technique}>
                  {formatArtsearchLabel(technique)}
                </option>
              ))}
            </select>
          </label>

          <div className="gif-form__actions">
            <button
              type="submit"
              className="drinks-page__btn gif-form__search-btn"
              disabled={!canSubmitSearch}
            >
              <SearchIcon />
              <span>Search</span>
            </button>
            {filtersActive ? (
              <button
                type="button"
                className="drinks-page__btn drinks-page__btn--secondary"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {hasQuotaDisplay(quota) && !loading && isDemoGallery ? (
        <p className="gif-page__quota-banner" role="status">
          Quota exhausted ({quota.used ?? 0} used) · resets midnight UTC
        </p>
      ) : hasQuotaDisplay(quota) ? (
        <p className="gif-page__quota">
          ArtSearch quota: <strong>{quota.left}</strong> requests left today
          {quota.used !== null ? ` (${quota.used} used)` : ''}
        </p>
      ) : null}

      <div className="gif-page__main">
        {showIdle ? (
          <p className="gif-page__idle">{IDLE_MESSAGE}</p>
        ) : null}

        {loading ? (
          <ArtworkMasonry label="Loading artworks">
            {Array.from({ length: ARTWORKS_PAGE_SIZE }, (_, index) => (
              <ArtworkCardSkeleton key={`skeleton-${index}`} index={index} />
            ))}
          </ArtworkMasonry>
        ) : null}

        {!loading && error ? (
          <p className="gif-page__status gif-page__status--error">
            Error: {error}
          </p>
        ) : null}

        {showNoMatches ? (
          <p className="gif-page__status">
            No artworks match your search or filters.
          </p>
        ) : null}

        {!loading && !error && displayResult.artworks.length > 0 ? (
          <>
            <ArtworkMasonry
              label="Artwork results"
              columns={isDemoGallery ? 3 : 2}
            >
              {displayResult.artworks.map((artwork, index) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  priority={index < 2}
                  onOpen={setSelectedArtwork}
                />
              ))}
            </ArtworkMasonry>

            <ArtworksPager
              offset={offset}
              available={displayResult.available}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onOffsetChange={setOffset}
            />
          </>
        ) : null}
      </div>

      <div className="gif-page__footnote">
        <RateLimitsFootnote />
      </div>

      <ArtworkPreviewModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
    </>
  )
}
