import { apiUrl } from '../api'
import type { Drink } from '../types/drink'
import type { PaginatedDrinks } from '../types/drink-list'
import type { DrinkCatalogQuery } from '../types/drink-query'
import { DRINKS_PAGE_SIZE } from '../types/drink-list'
import type { DrinkFormValues } from '../utils/drinkFormValidation'
import { buildDrinkPayload } from '../utils/drinkFormValidation'

export type FetchDrinksParams = DrinkCatalogQuery & {
  page?: number
  limit?: number
}

function appendOptionalNumber(
  params: URLSearchParams,
  key: string,
  value?: number,
): void {
  if (value !== undefined) {
    params.set(key, String(value))
  }
}

export function buildDrinksSearchParams({
  page = 1,
  limit = DRINKS_PAGE_SIZE,
  search,
  sort,
  order,
  filters,
}: FetchDrinksParams): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
    order,
  })

  const trimmedSearch = search.trim()
  if (trimmedSearch) {
    params.set('search', trimmedSearch)
  }

  appendOptionalNumber(params, 'minAbv', filters.minAbv)
  appendOptionalNumber(params, 'maxAbv', filters.maxAbv)
  appendOptionalNumber(params, 'minRating', filters.minRating)
  appendOptionalNumber(params, 'maxRating', filters.maxRating)
  appendOptionalNumber(params, 'minPrice', filters.minPrice)
  appendOptionalNumber(params, 'maxPrice', filters.maxPrice)

  return params
}

export async function fetchDrinks(
  query: FetchDrinksParams,
): Promise<PaginatedDrinks> {
  const params = buildDrinksSearchParams(query)
  const res = await fetch(apiUrl(`/drink?${params.toString()}`))

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return res.json() as Promise<PaginatedDrinks>
}

type SaveDrinkOptions = {
  mode: 'create' | 'edit'
  form: DrinkFormValues
  drinkId?: number
  imageFile?: File | null
  removeImage?: boolean
}

function appendDrinkFields(
  formData: FormData,
  form: DrinkFormValues,
  mode: 'create' | 'edit',
): void {
  const payload = buildDrinkPayload(form, mode)

  formData.append('title', payload.title)
  formData.append('abv', String(payload.abv))
  formData.append('price', String(payload.price))

  if (payload.description !== undefined) {
    formData.append('description', payload.description)
  }

  if (payload.rating !== undefined) {
    formData.append('rating', String(payload.rating))
  }
}

export async function saveDrink({
  mode,
  form,
  drinkId,
  imageFile,
  removeImage = false,
}: SaveDrinkOptions): Promise<Drink> {
  const formData = new FormData()
  appendDrinkFields(formData, form, mode)

  if (imageFile) {
    formData.append('image', imageFile)
  }

  if (mode === 'edit' && removeImage) {
    formData.append('removeImage', 'true')
  }

  const url =
    mode === 'edit' && drinkId !== undefined
      ? apiUrl(`/drink/${drinkId}`)
      : apiUrl('/drink')

  const res = await fetch(url, {
    method: mode === 'edit' ? 'PATCH' : 'POST',
    body: formData,
  })

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      (typeof body.message === 'string' || Array.isArray(body.message))
        ? Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message
        : `HTTP ${res.status}`
    throw new Error(message)
  }

  return res.json() as Promise<Drink>
}

export async function deleteDrink(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/drink/${id}`), { method: 'DELETE' })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
}
