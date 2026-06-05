export const DRINK_TITLE_MAX_LENGTH = 40
export const DRINK_DESCRIPTION_MAX_LENGTH = 500
/** Keep in sync with src/drink/drink.constants.ts */
export const DRINK_PRICE_MAX = 99_999_999.99

export const DRINK_PRICE_MAX_LABEL = DRINK_PRICE_MAX.toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
