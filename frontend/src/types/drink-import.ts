export type DrinkCatalogCapacity = {
  total: number
  max: number
  remaining: number
}

export type DrinkCsvImportRowError = {
  row: number
  title?: string
  messages: string[]
}

export type DrinkCsvImportResult = {
  imported: number
  failed: DrinkCsvImportRowError[]
  catalogTotal: number
}
