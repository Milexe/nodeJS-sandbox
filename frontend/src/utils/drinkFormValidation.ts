import type { Drink } from '../types/drink'
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
