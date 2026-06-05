import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDrink, fetchDrinks } from '../api/drinks'
import ConfirmDialog from '../components/ConfirmDialog'
import DrinksCatalogControls from '../components/DrinksCatalogControls'
import DrinkFormModal from '../components/DrinkFormModal'
import DrinkTableActions from '../components/DrinkTableActions'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { Drink } from '../types/drink'
import type { DrinkListMeta } from '../types/drink-list'
import { DRINKS_PAGE_SIZE } from '../types/drink-list'
import {
  DEFAULT_DRINK_CATALOG_QUERY,
  hasActiveCatalogFilters,
  isDefaultCatalogQuery,
  type DrinkCatalogQuery,
  type DrinkRangeFilters,
  type DrinkSortField,
  type DrinkSortOrder,
} from '../types/drink-query'
import { clearFilterChip } from '../utils/drinkFilterLabels'
import { formatDecimal, formatOptionalDecimal } from '../utils/decimalInput'
import { formatPrice } from '../utils/formatPrice'
import {
  handleDrinkImageError,
  resolveDrinkImageSrc,
} from '../utils/drinkImage'

const POLL_INTERVAL_MS = 15_000

const EMPTY_META: DrinkListMeta = {
  page: 1,
  limit: DRINKS_PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

type LoadDrinksOptions = {
  silent?: boolean
  page?: number
  query?: DrinkCatalogQuery
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

function paginationRange(meta: DrinkListMeta): { start: number; end: number } {
  const start = (meta.page - 1) * meta.limit + 1
  const end = Math.min(meta.page * meta.limit, meta.total)
  return { start, end }
}

type DrinksPaginationNavProps = {
  page: number
  meta: DrinkListMeta
  onPageChange: (page: number) => void
}

function DrinksPaginationNav({
  page,
  meta,
  onPageChange,
}: DrinksPaginationNavProps) {
  const { start, end } = paginationRange(meta)

  return (
    <nav className="drinks-pagination" aria-label="Drinks pagination">
      <button
        type="button"
        className="drinks-pagination__btn drinks-pagination__btn--prev"
        disabled={page <= 1}
        aria-label="Previous page"
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon />
        <span>Previous</span>
      </button>
      <div className="drinks-pagination__info">
        <span className="drinks-pagination__page">
          Page {meta.page} of {meta.totalPages}
        </span>
        <span className="drinks-pagination__range">
          {start}–{end} of {meta.total}
        </span>
      </div>
      <button
        type="button"
        className="drinks-pagination__btn drinks-pagination__btn--next"
        disabled={page >= meta.totalPages}
        aria-label="Next page"
        onClick={() => onPageChange(page + 1)}
      >
        <span>Next</span>
        <ChevronRightIcon />
      </button>
    </nav>
  )
}

export default function DrinksListPage() {
  const navigate = useNavigate()
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [meta, setMeta] = useState<DrinkListMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [catalogQuery, setCatalogQuery] = useState<DrinkCatalogQuery>(
    DEFAULT_DRINK_CATALOG_QUERY,
  )
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null)
  const [deletingDrink, setDeletingDrink] = useState<Drink | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadDrinks = useCallback(
    async ({
      silent = false,
      page: pageArg = page,
      query = catalogQuery,
    }: LoadDrinksOptions = {}) => {
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      try {
        const result = await fetchDrinks({ ...query, page: pageArg })

        if (
          result.data.length === 0 &&
          result.meta.totalPages > 0 &&
          pageArg > result.meta.totalPages
        ) {
          setPage(result.meta.totalPages)
          return
        }

        setDrinks(result.data)
        setMeta(result.meta)
        if (silent) {
          setError(null)
        }
      } catch (e) {
        if (!silent) {
          setError(e instanceof Error ? e.message : 'Failed to load drinks')
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [page, catalogQuery],
  )

  useEffect(() => {
    setCatalogQuery((current) => {
      if (current.search === debouncedSearch) {
        return current
      }

      return { ...current, search: debouncedSearch }
    })
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    void loadDrinks({ page })
  }, [loadDrinks, page])
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDrinks({ silent: true, page })
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [loadDrinks, page])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void loadDrinks({ silent: true, page })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadDrinks, page])

  async function handleConfirmDelete() {    if (!deletingDrink) {
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDrink(deletingDrink.id)
      setDeletingDrink(null)
      await loadDrinks({ silent: true, page })
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : 'Failed to delete drink',
      )
    } finally {
      setDeleting(false)
    }
  }

  function handleSortFieldChange(sort: DrinkSortField) {
    setCatalogQuery((current) => ({ ...current, sort }))
    setPage(1)
  }

  function handleSortOrderChange(order: DrinkSortOrder) {
    setCatalogQuery((current) => ({ ...current, order }))
    setPage(1)
  }

  function handleFiltersApply(filters: DrinkRangeFilters) {
    setCatalogQuery((current) => ({ ...current, filters }))
    setPage(1)
  }

  function handleRemoveFilterChip(chipId: Parameters<typeof clearFilterChip>[1]) {
    setCatalogQuery((current) => ({
      ...current,
      filters: clearFilterChip(current.filters, chipId),
    }))
    setPage(1)
  }

  function handleClearCatalog() {
    setSearchInput('')
    setCatalogQuery(DEFAULT_DRINK_CATALOG_QUERY)
    setPage(1)
  }

  const filtersActive = hasActiveCatalogFilters(catalogQuery)
  const showEmptyCatalog =
    !loading && !error && meta.total === 0 && !filtersActive
  const showNoMatches =
    !loading && !error && meta.total === 0 && filtersActive

  return (    <>
      <div className="drinks-page__toolbar">
        <h2 className="drinks-page__title">Drinks catalog</h2>
        <button
          type="button"
          className="drinks-page__btn"
          onClick={() => setCreateOpen(true)}
        >
          Add drink
        </button>
      </div>

      <DrinksCatalogControls
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        sort={catalogQuery.sort}
        order={catalogQuery.order}
        onSortFieldChange={handleSortFieldChange}
        onSortOrderChange={handleSortOrderChange}
        appliedFilters={catalogQuery.filters}
        onFiltersApply={handleFiltersApply}
        onRemoveFilterChip={handleRemoveFilterChip}
        onClearAll={handleClearCatalog}
        canClear={!isDefaultCatalogQuery(catalogQuery) || searchInput.length > 0}
      />

      {loading ? <p className="status">Loading…</p> : null}

      {!loading && error ? (
        <p className="status error">Error: {error}</p>
      ) : null}

      {showEmptyCatalog ? (
        <p className="status">No drinks yet. Add the first one with POST.</p>
      ) : null}

      {showNoMatches ? (
        <p className="status">No drinks match your search or filters.</p>
      ) : null}

      {!loading && !error && meta.total > 0 ? (
        <>
          <div className="drinks-table-scroll">
            <table className="drinks-table">
            <thead>
              <tr>
                <th className="drinks-table__col-image" aria-label="Image" />
                <th>Title</th>
                <th>ABV %</th>
                <th>Rating</th>
                <th>Price</th>
                <th className="drinks-table__col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drinks.map((drink) => (
                <tr
                  key={drink.id}
                  className="drinks-row"
                  onClick={() => navigate(`/drinks/${drink.id}`)}
                >
                  <td className="drinks-table__col-image">
                    <img
                      className="drinks-table__thumb"
                      src={resolveDrinkImageSrc(drink.imageUrl)}
                      alt=""
                      onError={handleDrinkImageError}
                    />
                  </td>
                  <td>{drink.title}</td>
                  <td>{formatDecimal(drink.abv, 1)}</td>
                  <td>{formatOptionalDecimal(drink.rating, 1)}</td>
                  <td>{formatPrice(drink.price)}</td>
                  <td
                    className="drinks-table__col-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="drinks-table__actions">
                      <DrinkTableActions
                        onEdit={() => setEditingDrink(drink)}
                        onDelete={() => {
                          setDeleteError(null)
                          setDeletingDrink(drink)
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>

          {meta.totalPages > 1 ? (
            <DrinksPaginationNav
              page={page}
              meta={meta}
              onPageChange={setPage}
            />
          ) : null}
        </>
      ) : null}

      <DrinkFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setPage(1)
          void loadDrinks({ silent: true, page: 1, query: catalogQuery })
        }}      />

      <DrinkFormModal
        mode="edit"
        open={editingDrink !== null}
        drink={editingDrink ?? undefined}
        onClose={() => setEditingDrink(null)}
        onSuccess={() => loadDrinks({ silent: true, page, query: catalogQuery })}      />

      <ConfirmDialog
        open={deletingDrink !== null}
        title="Delete drink"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeletingDrink(null)
            setDeleteError(null)
          }
        }}
        onConfirm={handleConfirmDelete}
      >
        <p className="modal__message">
          Delete <strong>{deletingDrink?.title}</strong>? This action cannot be
          undone.
        </p>
        {deleteError ? <p className="modal__error">{deleteError}</p> : null}
      </ConfirmDialog>
    </>
  )
}
