export function offsetForPage(page: number, pageSize: number): number {
  return Math.max(0, (page - 1) * pageSize)
}

export function pageForOffset(offset: number, pageSize: number): number {
  return Math.floor(offset / pageSize) + 1
}

export function totalPagesForCount(total: number, pageSize: number): number {
  return total === 0 ? 0 : Math.ceil(total / pageSize)
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) {
    return 1
  }

  return Math.min(Math.max(1, page), totalPages)
}
