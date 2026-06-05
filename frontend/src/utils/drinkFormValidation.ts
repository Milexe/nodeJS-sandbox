import type { Drink } from '../types/drink'
import type { DrinkRangeFilters } from '../types/drink-query'
import { formatDecimal, hasAtMostDecimalPlaces } from './decimalInput'

const NUMERIC_PATTERN = /^\d*\.?\d*$/

export type DrinkFormValues = {
  title: string
  description: string
  abv: string
  rating: string
  price: string
}

function isIncompleteNumber(value: string): boolean {
  return value.endsWith('.')
}

function isNumericStringInvalid(value: string): boolean {
  return !NUMERIC_PATTERN.test(value) || value === '.'
}

function isNumericFieldInvalid(
  value: string,
  options: {
    required: boolean
    touched: boolean
    min: number
    max?: number
    maxDecimalPlaces: number
  },
): boolean {
  const trimmed = value.trim()

  if (!trimmed) {
    return options.required && options.touched
  }

  if (isNumericStringInvalid(trimmed)) {
    return true
  }

  if (isIncompleteNumber(trimmed)) {
    return false
  }

  if (!hasAtMostDecimalPlaces(trimmed, options.maxDecimalPlaces)) {
    return true
  }

  const num = Number(trimmed)
  if (Number.isNaN(num) || num < options.min) {
    return true
  }

  if (options.max !== undefined && num > options.max) {
    return true
  }

  return false
}

export function isTitleInvalid(
  value: string,
  touched: boolean,
  titleTaken = false,
): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return touched
  }
  if (trimmed.length > 40) {
    return true
  }
  return titleTaken
}

export function isAbvInvalid(value: string, touched: boolean): boolean {
  return isNumericFieldInvalid(value, {
    required: true,
    touched,
    min: 0,
    max: 100,
    maxDecimalPlaces: 1,
  })
}

export function isRatingInvalid(value: string, touched: boolean): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  return isNumericFieldInvalid(value, {
    required: false,
    touched,
    min: 0,
    max: 5,
    maxDecimalPlaces: 1,
  })
}

export function isPriceInvalid(value: string, touched: boolean): boolean {
  return isNumericFieldInvalid(value, {
    required: true,
    touched,
    min: 0,
    maxDecimalPlaces: 2,
  })
}

const FILTER_ABV_RULE = {
  min: 0,
  max: 100,
  maxDecimalPlaces: 1,
} as const

const FILTER_RATING_RULE = {
  min: 0,
  max: 5,
  maxDecimalPlaces: 1,
} as const

const FILTER_PRICE_RULE = {
  min: 0,
  maxDecimalPlaces: 2,
} as const

type OptionalNumericRule = {
  min: number
  max?: number
  maxDecimalPlaces: number
}

function isOptionalNumericInvalid(
  value: string,
  rule: OptionalNumericRule,
): boolean {
  return isNumericFieldInvalid(value, {
    required: false,
    touched: true,
    min: rule.min,
    max: rule.max,
    maxDecimalPlaces: rule.maxDecimalPlaces,
  })
}

export function isOptionalAbvFilterInvalid(value: string): boolean {
  return isOptionalNumericInvalid(value, FILTER_ABV_RULE)
}

export function isOptionalRatingFilterInvalid(value: string): boolean {
  return isOptionalNumericInvalid(value, FILTER_RATING_RULE)
}

export function isOptionalPriceFilterInvalid(value: string): boolean {
  return isOptionalNumericInvalid(value, FILTER_PRICE_RULE)
}

export type FilterDraftValues = {
  minAbv: string
  maxAbv: string
  minRating: string
  maxRating: string
  minPrice: string
  maxPrice: string
}

function optionalFilterFieldError(
  label: string,
  value: string,
  maxDecimalPlaces: number,
  rangeMessage: string,
): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (!hasAtMostDecimalPlaces(trimmed, maxDecimalPlaces)) {
    const placeLabel = maxDecimalPlaces === 1 ? 'place' : 'places'
    return `${label} allows at most ${maxDecimalPlaces} decimal ${placeLabel}.`
  }

  return `${label} must be ${rangeMessage}.`
}

export function validateFilterDraft(draft: FilterDraftValues): string | null {
  if (isOptionalAbvFilterInvalid(draft.minAbv)) {
    return (
      optionalFilterFieldError(
        'Minimum ABV',
        draft.minAbv,
        1,
        'between 0 and 100',
      ) ?? 'Minimum ABV must be between 0 and 100.'
    )
  }

  if (isOptionalAbvFilterInvalid(draft.maxAbv)) {
    return (
      optionalFilterFieldError(
        'Maximum ABV',
        draft.maxAbv,
        1,
        'between 0 and 100',
      ) ?? 'Maximum ABV must be between 0 and 100.'
    )
  }

  if (isOptionalRatingFilterInvalid(draft.minRating)) {
    return (
      optionalFilterFieldError(
        'Minimum rating',
        draft.minRating,
        1,
        'between 0 and 5',
      ) ?? 'Minimum rating must be between 0 and 5.'
    )
  }

  if (isOptionalRatingFilterInvalid(draft.maxRating)) {
    return (
      optionalFilterFieldError(
        'Maximum rating',
        draft.maxRating,
        1,
        'between 0 and 5',
      ) ?? 'Maximum rating must be between 0 and 5.'
    )
  }

  if (isOptionalPriceFilterInvalid(draft.minPrice)) {
    return (
      optionalFilterFieldError(
        'Minimum price',
        draft.minPrice,
        2,
        '0 or greater',
      ) ?? 'Minimum price must be 0 or greater.'
    )
  }

  if (isOptionalPriceFilterInvalid(draft.maxPrice)) {
    return (
      optionalFilterFieldError(
        'Maximum price',
        draft.maxPrice,
        2,
        '0 or greater',
      ) ?? 'Maximum price must be 0 or greater.'
    )
  }

  return null
}

export function parseOptionalFilterNumber(
  value: string,
  rule: OptionalNumericRule,
): number | undefined {
  const trimmed = value.trim()
  if (!trimmed || isOptionalNumericInvalid(value, rule)) {
    return undefined
  }

  if (isIncompleteNumber(trimmed)) {
    return undefined
  }

  return Number(trimmed)
}

export function filterDraftToRangeFilters(
  draft: FilterDraftValues,
): DrinkRangeFilters {
  return {
    minAbv: parseOptionalFilterNumber(draft.minAbv, FILTER_ABV_RULE),
    maxAbv: parseOptionalFilterNumber(draft.maxAbv, FILTER_ABV_RULE),
    minRating: parseOptionalFilterNumber(draft.minRating, FILTER_RATING_RULE),
    maxRating: parseOptionalFilterNumber(draft.maxRating, FILTER_RATING_RULE),
    minPrice: parseOptionalFilterNumber(draft.minPrice, FILTER_PRICE_RULE),
    maxPrice: parseOptionalFilterNumber(draft.maxPrice, FILTER_PRICE_RULE),
  }
}

export function validateDrinkForm(
  form: DrinkFormValues,
  titleTaken = false,
): string | null {
  const title = form.title.trim()

  if (!title) {
    return 'Title is required.'
  }

  if (title.length > 40) {
    return 'Title must be 40 characters or fewer.'
  }

  if (titleTaken) {
    return 'Title already exists.'
  }

  if (isAbvInvalid(form.abv, true)) {
    if (!form.abv.trim()) {
      return 'ABV is required.'
    }
    if (!hasAtMostDecimalPlaces(form.abv, 1)) {
      return 'ABV allows at most 1 decimal place.'
    }
    return 'ABV must be between 0 and 100.'
  }

  if (isPriceInvalid(form.price, true)) {
    if (!form.price.trim()) {
      return 'Price is required.'
    }
    if (!hasAtMostDecimalPlaces(form.price, 2)) {
      return 'Price allows at most 2 decimal places.'
    }
    return 'Price must be 0 or greater.'
  }

  if (isRatingInvalid(form.rating, true)) {
    if (!hasAtMostDecimalPlaces(form.rating, 1)) {
      return 'Rating allows at most 1 decimal place.'
    }
    return 'Rating must be between 0 and 5.'
  }

  return null
}

export function drinkToFormValues(drink: Drink): DrinkFormValues {
  const rating = Number.parseFloat(String(drink.rating))

  return {
    title: drink.title,
    description: drink.description || '',
    abv: formatDecimal(drink.abv, 1),
    rating: Number.isNaN(rating) || rating === 0 ? '' : formatDecimal(rating, 1),
    price: formatDecimal(drink.price, 2),
  }
}

export function buildDrinkPayload(form: DrinkFormValues, mode: 'create' | 'edit') {
  const payload = {
    title: form.title.trim(),
    abv: Number(form.abv),
    price: Number(form.price),
  } as {
    title: string
    abv: number
    price: number
    description?: string
    rating?: number
  }

  const description = form.description.trim()
  if (description || mode === 'edit') {
    payload.description = description
  }

  if (form.rating.trim() !== '') {
    payload.rating = Number(form.rating)
  } else if (mode === 'edit') {
    payload.rating = 0
  }

  return payload
}
