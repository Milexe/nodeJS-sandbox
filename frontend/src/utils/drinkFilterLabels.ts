import type { DrinkRangeFilters } from '../types/drink-query'

export type ActiveFilterChip = {
  id: 'abv' | 'rating' | 'price'
  label: string
}

function formatRangeLabel(
  prefix: string,
  min?: number,
  max?: number,
  suffix = '',
): string | null {
  if (min !== undefined && max !== undefined) {
    return `${prefix} ${min}${suffix}–${max}${suffix}`
  }
  if (min !== undefined) {
    return `${prefix} ≥ ${min}${suffix}`
  }
  if (max !== undefined) {
    return `${prefix} ≤ ${max}${suffix}`
  }
  return null
}

function formatPriceRangeLabel(min?: number, max?: number): string | null {
  if (min !== undefined && max !== undefined) {
    return `Price $${min}–$${max}`
  }
  if (min !== undefined) {
    return `Price ≥ $${min}`
  }
  if (max !== undefined) {
    return `Price ≤ $${max}`
  }
  return null
}

export function buildActiveFilterChips(
  filters: DrinkRangeFilters,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  const abv = formatRangeLabel('ABV', filters.minAbv, filters.maxAbv, '%')
  if (abv) {
    chips.push({ id: 'abv', label: abv })
  }

  const rating = formatRangeLabel('Rating', filters.minRating, filters.maxRating)
  if (rating) {
    chips.push({ id: 'rating', label: rating })
  }

  const priceLabel = formatPriceRangeLabel(filters.minPrice, filters.maxPrice)
  if (priceLabel) {
    chips.push({ id: 'price', label: priceLabel })
  }

  return chips
}

export function clearFilterChip(
  filters: DrinkRangeFilters,
  chipId: ActiveFilterChip['id'],
): DrinkRangeFilters {
  switch (chipId) {
    case 'abv':
      return {
        ...filters,
        minAbv: undefined,
        maxAbv: undefined,
      }
    case 'rating':
      return {
        ...filters,
        minRating: undefined,
        maxRating: undefined,
      }
    case 'price':
      return {
        ...filters,
        minPrice: undefined,
        maxPrice: undefined,
      }
    default:
      return filters
  }
}

export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function normalizeRangeFilters(
  filters: DrinkRangeFilters,
): DrinkRangeFilters {
  const next: DrinkRangeFilters = {}

  if (filters.minAbv !== undefined) {
    next.minAbv = filters.minAbv
  }
  if (filters.maxAbv !== undefined) {
    next.maxAbv = filters.maxAbv
  }
  if (filters.minRating !== undefined) {
    next.minRating = filters.minRating
  }
  if (filters.maxRating !== undefined) {
    next.maxRating = filters.maxRating
  }
  if (filters.minPrice !== undefined) {
    next.minPrice = filters.minPrice
  }
  if (filters.maxPrice !== undefined) {
    next.maxPrice = filters.maxPrice
  }

  if (
    next.minAbv !== undefined &&
    next.maxAbv !== undefined &&
    next.minAbv > next.maxAbv
  ) {
    ;[next.minAbv, next.maxAbv] = [next.maxAbv, next.minAbv]
  }

  if (
    next.minRating !== undefined &&
    next.maxRating !== undefined &&
    next.minRating > next.maxRating
  ) {
    ;[next.minRating, next.maxRating] = [next.maxRating, next.minRating]
  }

  if (
    next.minPrice !== undefined &&
    next.maxPrice !== undefined &&
    next.minPrice > next.maxPrice
  ) {
    ;[next.minPrice, next.maxPrice] = [next.maxPrice, next.minPrice]
  }

  return next
}
