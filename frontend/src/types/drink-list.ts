import type { Drink } from '../types/drink'

export type DrinkListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedDrinks = {
  data: Drink[]
  meta: DrinkListMeta
}

export const DRINKS_PAGE_SIZE = 10
