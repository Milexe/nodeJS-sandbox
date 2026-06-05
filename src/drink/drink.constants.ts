export const DRINKS_CATALOG_MAX = 1000;

export const DRINKS_CATALOG_FULL_MESSAGE = `Drink catalog is full (maximum ${DRINKS_CATALOG_MAX} drinks).`;

export function drinkCatalogCapacityMessage(
  currentCount: number,
  importCount: number,
): string {
  const remaining = Math.max(DRINKS_CATALOG_MAX - currentCount, 0);
  return `Catalog has ${currentCount} drinks. This file has ${importCount} valid row(s) but only ${remaining} slot(s) remain (maximum ${DRINKS_CATALOG_MAX}).`;
}
