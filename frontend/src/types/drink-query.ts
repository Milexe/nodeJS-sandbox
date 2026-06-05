export type DrinkSortField = 'title' | 'abv' | 'rating' | 'price' | 'id'
export type DrinkSortOrder = 'asc' | 'desc'

export type DrinkRangeFilters = {
  minAbv?: number
  maxAbv?: number
  minRating?: number
  maxRating?: number
  minPrice?: number
  maxPrice?: number
}

export type DrinkCatalogQuery = {
  search: string
  sort: DrinkSortField
  order: DrinkSortOrder
  filters: DrinkRangeFilters
}

export const DEFAULT_DRINK_CATALOG_QUERY: DrinkCatalogQuery = {
  search: '',
  sort: 'title',
  order: 'asc',
  filters: {},
}

export type DrinkSortFieldOption = {
  value: DrinkSortField
  label: string
}

export const DRINK_SORT_FIELD_OPTIONS: DrinkSortFieldOption[] = [
  { value: 'title', label: 'Title' },
  { value: 'price', label: 'Price' },
  { value: 'abv', label: 'ABV' },
  { value: 'rating', label: 'Rating' },
  { value: 'id', label: 'Date added' },
]

export function toggleSortOrder(order: DrinkSortOrder): DrinkSortOrder {
  return order === 'asc' ? 'desc' : 'asc'
}

export function hasActiveCatalogFilters(
  query: DrinkCatalogQuery,
): boolean {
  return (
    query.search.trim().length > 0 || activeRangeFilterCount(query.filters) > 0
  )
}

export function activeRangeFilterCount(filters: DrinkRangeFilters): number {
  let count = 0

  if (filters.minAbv !== undefined || filters.maxAbv !== undefined) {
    count += 1
  }
  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    count += 1
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    count += 1
  }

  return count
}

export function isDefaultCatalogQuery(query: DrinkCatalogQuery): boolean {
  return (
    query.search.trim().length === 0 &&
    query.sort === DEFAULT_DRINK_CATALOG_QUERY.sort &&
    query.order === DEFAULT_DRINK_CATALOG_QUERY.order &&
    activeRangeFilterCount(query.filters) === 0
  )
}
