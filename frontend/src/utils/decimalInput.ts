export function hasAtMostDecimalPlaces(value: string, maxPlaces: number): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return true
  }

  const dotIndex = trimmed.indexOf('.')
  if (dotIndex === -1) {
    return true
  }

  return trimmed.length - dotIndex - 1 <= maxPlaces
}

function formatNumberDisplay(num: number, maxFractionDigits: number): string {
  return num.toFixed(maxFractionDigits).replace(/\.?0+$/, '')
}

export function formatDecimal(value: string | number, fractionDigits: number): string {
  const num = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(num)) {
    return String(value)
  }
  return formatNumberDisplay(num, fractionDigits)
}

export function formatOptionalDecimal(
  value: string | number | null | undefined,
  fractionDigits: number,
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  const num = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(num) || num === 0) {
    return '—'
  }
  return formatNumberDisplay(num, fractionDigits)
}
