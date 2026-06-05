import { Drink } from '../generated/prisma/client';

export type DrinkListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedDrinkList = {
  data: Drink[];
  meta: DrinkListMeta;
};
