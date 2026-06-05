const PRICE_PREFIX = '$'

export function formatPrice(value: string | number): string {
  const num = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(num)) {
    return `${PRICE_PREFIX}${value}`
  }
  return `${PRICE_PREFIX}${num.toFixed(2)}`
}

export { PRICE_PREFIX }
