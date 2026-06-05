import { apiUrl } from '../api'

export const DRINKS_CATALOG_MAX = 1000

export const CSV_IMPORT_HEADER =
  'title,description,abv,rating,price,imageUrl'

/** Committed sample image served by the API at GET /samples/csv-import-example.png */
export const CSV_IMPORT_SAMPLE_IMAGE_PATH = '/samples/csv-import-example.png'

export const CSV_IMPORT_EXAMPLE_FILENAME = 'drinks-import-example.csv'

export function getCsvImportExample(): string {
  const sampleImageUrl = apiUrl(CSV_IMPORT_SAMPLE_IMAGE_PATH)

  return `${CSV_IMPORT_HEADER}
Citrus IPA,Bright hop aroma,6.2,4.2,7.50,${sampleImageUrl}
Midnight Stout,Dark roast notes,6.5,4.5,8.99,`
}

export function downloadCsvImportExample(): void {
  const blob = new Blob([getCsvImportExample()], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = CSV_IMPORT_EXAMPLE_FILENAME
  link.click()
  URL.revokeObjectURL(url)
}
