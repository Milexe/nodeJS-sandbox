import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react'
import { apiUrl } from '../api'
import { fetchDrinkCatalogCapacity, importDrinksCsv } from '../api/drinks'
import {
  CSV_IMPORT_SAMPLE_IMAGE_PATH,
  downloadCsvImportExample,
  getCsvImportExample,
  DRINKS_CATALOG_MAX,
} from '../config/drinkCatalog'
import type {
  DrinkCatalogCapacity,
  DrinkCsvImportResult,
} from '../types/drink-import'

type DrinkCsvImportModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function DrinkCsvImportModal({
  open,
  onClose,
  onSuccess,
}: DrinkCsvImportModalProps) {
  const titleId = useId()
  const overlayPressed = useRef(false)
  const [capacity, setCapacity] = useState<DrinkCatalogCapacity | null>(null)
  const [capacityError, setCapacityError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DrinkCsvImportResult | null>(null)
  const [exampleOpen, setExampleOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setFile(null)
    setSubmitting(false)
    setError(null)
    setResult(null)
    setCapacity(null)
    setCapacityError(null)
    setExampleOpen(false)

    void fetchDrinkCatalogCapacity()
      .then(setCapacity)
      .catch(() => {
        setCapacityError('Could not load catalog capacity.')
      })
  }, [open])

  if (!open) {
    return null
  }

  const catalogTotal = capacity?.total ?? 0
  const remainingSlots = capacity?.remaining ?? 0
  const catalogFull = capacity !== null && remainingSlots === 0

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    overlayPressed.current = event.target === event.currentTarget
  }

  function handleOverlayMouseUp(event: MouseEvent<HTMLDivElement>) {
    if (
      event.target === event.currentTarget &&
      overlayPressed.current &&
      !submitting
    ) {
      onClose()
    }
    overlayPressed.current = false
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    setError(null)
    setResult(null)
  }

  async function handleImport() {
    if (!file) {
      setError('Choose a CSV file first.')
      return
    }

    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const importResult = await importDrinksCsv(file)
      setResult(importResult)
      setCapacity({
        total: importResult.catalogTotal,
        max: DRINKS_CATALOG_MAX,
        remaining: Math.max(DRINKS_CATALOG_MAX - importResult.catalogTotal, 0),
      })
      if (importResult.imported > 0) {
        onSuccess()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CSV import failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div
        className="modal modal--import"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal__header">
          <h3 id={titleId} className="modal__title">
            Import drinks from CSV
          </h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <div className="modal__body drink-csv-import">
          <div className="drink-csv-import__notice">
            <strong>
              Catalog limit:{' '}
              {capacity
                ? `${catalogTotal} / ${DRINKS_CATALOG_MAX}`
                : 'Loading…'}
            </strong>
            <p>
              {capacityError
                ? capacityError
                : catalogFull
                  ? 'The catalog is full. Delete drinks or skip import until space is available.'
                  : capacity
                    ? `This import can add up to ${remainingSlots} more drink(s). If the CSV has more valid rows than free slots, the entire import is rejected before any rows are saved.`
                    : 'Checking how many drinks can still be imported…'}
            </p>
          </div>

          <div className="drink-csv-import__example-panel">
            <div className="drink-csv-import__example-toolbar">
              <button
                type="button"
                className={`drink-csv-import__example-toggle${exampleOpen ? ' drink-csv-import__example-toggle--open' : ''}`}
                aria-expanded={exampleOpen}
                aria-controls="drink-csv-import-example"
                onClick={() => setExampleOpen((open) => !open)}
              >
                <img
                  className="drink-csv-import__example-icon"
                  src={apiUrl(CSV_IMPORT_SAMPLE_IMAGE_PATH)}
                  alt=""
                  width={28}
                  height={28}
                />
                <span className="drink-csv-import__example-title">CSV example</span>
                <span className="drink-csv-import__example-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
              <button
                type="button"
                className="drink-csv-import__example-download"
                onClick={() => downloadCsvImportExample()}
              >
                Download
              </button>
            </div>

            {exampleOpen ? (
              <div
                id="drink-csv-import-example"
                className="drink-csv-import__example-body"
              >
                <p className="drink-csv-import__hint">
                  Required columns: <code>title</code>, <code>abv</code>,{' '}
                  <code>price</code>. Optional: <code>description</code>,{' '}
                  <code>rating</code>, <code>imageUrl</code> (http/https — first
                  sample row uses an image hosted on this API).
                </p>
                <pre className="drink-csv-import__example">{getCsvImportExample()}</pre>
              </div>
            ) : null}
          </div>

          <div className="drink-csv-import__section">
            <label className="drink-csv-import__file-label" htmlFor="drink-csv-file">
              CSV file
            </label>
            <input
              id="drink-csv-file"
              className="drink-csv-import__file"
              type="file"
              accept=".csv,text/csv"
              disabled={submitting || catalogFull}
              onChange={handleFileChange}
            />
            {file ? (
              <p className="drink-csv-import__file-name">{file.name}</p>
            ) : null}
          </div>

          {error ? <p className="modal__error">{error}</p> : null}

          {result ? (
            <div className="drink-csv-import__result">
              <p className="drink-csv-import__result-summary">
                Imported {result.imported} drink(s). Catalog total:{' '}
                {result.catalogTotal}.
              </p>
              {result.failed.length > 0 ? (
                <ul className="drink-csv-import__errors">
                  {result.failed.map((item) => (
                    <li key={`${item.row}-${item.title ?? 'row'}`}>
                      Row {item.row}
                      {item.title ? ` (${item.title})` : ''}:{' '}
                      {item.messages.join(', ')}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="modal__actions modal__actions--footer">
          <button
            type="button"
            className="modal__button modal__button--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
          <button
            type="button"
            className="modal__button modal__button--primary"
            disabled={submitting || catalogFull || !file || !capacity || !!capacityError}
            onClick={() => void handleImport()}
          >
            {submitting ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
