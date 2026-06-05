import { Prisma } from '../generated/prisma/client';
import {
  DRINKS_DEFAULT_LIMIT,
  DRINKS_DEFAULT_PAGE,
  DrinkSortField,
  DrinkSortOrder,
  FindDrinksQueryDto,
} from './dto/find-drinks-query.dto';

function decimalRange(
  min?: number,
  max?: number,
): Prisma.DecimalFilter | undefined {
  if (min === undefined && max === undefined) {
    return undefined;
  }

  return {
    ...(min !== undefined ? { gte: min } : {}),
    ...(max !== undefined ? { lte: max } : {}),
  };
}

function buildDrinkWhere(query: FindDrinksQueryDto): Prisma.DrinkWhereInput {
  const and: Prisma.DrinkWhereInput[] = [];
  const search = query.search?.trim();

  if (search) {
    and.push({
      title: { contains: search, mode: 'insensitive' },
    });
  }

  if (query.hasImage === true) {
    and.push({ imageUrl: { not: null } });
  } else if (query.hasImage === false) {
    and.push({ imageUrl: null });
  }

  const abv = decimalRange(query.minAbv, query.maxAbv);
  if (abv) {
    and.push({ abv });
  }

  const rating = decimalRange(query.minRating, query.maxRating);
  if (rating) {
    and.push({ rating });
  }

  const price = decimalRange(query.minPrice, query.maxPrice);
  if (price) {
    and.push({ price });
  }

  return and.length > 0 ? { AND: and } : {};
}

function buildDrinkOrderBy(
  sort: DrinkSortField = 'title',
  order: DrinkSortOrder = 'asc',
): Prisma.DrinkOrderByWithRelationInput {
  return { [sort]: order };
}

export {
  buildDrinkOrderBy,
  buildDrinkWhere,
  DRINKS_DEFAULT_LIMIT,
  DRINKS_DEFAULT_PAGE,
};
