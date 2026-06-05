import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { apiUrl } from '../api'
import type { Drink } from '../types/drink'
import {
  buildDrinkPayload,
  drinkToFormValues,
  isAbvInvalid,
  isPriceInvalid,
  isRatingInvalid,
  isTitleInvalid,
  validateDrinkForm,
  type DrinkFormValues,
} from '../utils/drinkFormValidation'
import { PRICE_PREFIX } from '../utils/formatPrice'

type DrinkFormModalProps = {
  mode: 'create' | 'edit'
  open: boolean
  drink?: Drink
  onClose: () => void
  onSuccess: () => void
}

const emptyForm: DrinkFormValues = {
  title: '',
  description: '',
  abv: '',
  rating: '',
  price: '',
}

const emptyTouched = {
  title: false,
  abv: false,
  rating: false,
  price: false,
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <span
      className={
        required ? 'modal__label modal__label--required' : 'modal__label'
      }
    >
      {children}
    </span>
  )
}

export default function DrinkFormModal({
  mode,
  open,
  drink,
  onClose,
  onSuccess,
}: DrinkFormModalProps) {
  const titleId = useId()
  const overlayPressed = useRef(false)
  const [form, setForm] = useState(emptyForm)
  const [touched, setTouched] = useState(emptyTouched)
  const [titleTaken, setTitleTaken] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const titleInvalid = isTitleInvalid(form.title, touched.title, titleTaken)
  const abvInvalid = isAbvInvalid(form.abv, touched.abv)
  const ratingInvalid = isRatingInvalid(form.rating, touched.rating)
  const priceInvalid = isPriceInvalid(form.price, touched.price)

  useEffect(() => {
    if (!open) {
      return
    }

    setForm(mode === 'edit' && drink ? drinkToFormValues(drink) : emptyForm)
    setTouched(emptyTouched)
    setTitleTaken(false)
    setError(null)
    setSubmitting(false)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, mode, drink])

  useEffect(() => {
    if (!open) {
      return
    }

    const title = form.title.trim()
    if (!title) {
      setTitleTaken(false)
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          apiUrl(`/drink?title=${encodeURIComponent(title)}`),
        )
        if (!res.ok) {
          return
        }

        const matches: Drink[] = await res.json()
        const taken = matches.some(
          (item) =>
            item.title === title &&
            (mode === 'create' || item.id !== drink?.id),
        )
        setTitleTaken(taken)
      } catch {
        setTitleTaken(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [form.title, open, mode, drink?.id])

  if (!open) {
    return null
  }

  function updateField(field: keyof DrinkFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setTouched({ title: true, abv: true, rating: true, price: true })

    const validationError = validateDrinkForm(form, titleTaken)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const url =
        mode === 'edit' && drink
          ? apiUrl(`/drink/${drink.id}`)
          : apiUrl('/drink')
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildDrinkPayload(form, mode)),
      })

      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null)
        const message =
          typeof body === 'object' &&
          body !== null &&
          'message' in body &&
          (typeof body.message === 'string' || Array.isArray(body.message))
            ? Array.isArray(body.message)
              ? body.message.join(', ')
              : body.message
            : `HTTP ${res.status}`

        if (res.status === 409) {
          setTitleTaken(true)
        }

        throw new Error(message)
      }

      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save drink')
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = mode === 'edit'

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    overlayPressed.current = event.target === event.currentTarget
  }

  function handleOverlayMouseUp(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && overlayPressed.current) {
      onClose()
    }
    overlayPressed.current = false
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal__header">
          <h3 id={titleId} className="modal__title">
            {isEdit ? 'Edit drink' : 'Add drink'}
          </h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div
            className={`modal__field${titleInvalid ? ' modal__field--invalid' : ''}`}
          >
            <FieldLabel required>Title</FieldLabel>
            <input
              type="text"
              name="title"
              maxLength={40}
              placeholder="e.g. Midnight Stout"
              value={form.title}
              aria-invalid={titleInvalid}
              onChange={(e) => updateField('title', e.target.value)}
            />
          </div>

          <div className="modal__field">
            <FieldLabel>Description</FieldLabel>
            <textarea
              name="description"
              rows={3}
              placeholder="Optional tasting notes or style"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>

          <div className="modal__field-row">
            <div
              className={`modal__field${abvInvalid ? ' modal__field--invalid' : ''}`}
            >
              <FieldLabel required>ABV %</FieldLabel>
              <input
                type="number"
                name="abv"
                min={0}
                max={100}
                step={0.1}
                placeholder="5.2"
                value={form.abv}
                aria-invalid={abvInvalid}
                onChange={(e) => updateField('abv', e.target.value)}
              />
            </div>

            <div
              className={`modal__field${ratingInvalid ? ' modal__field--invalid' : ''}`}
            >
              <FieldLabel>Rating</FieldLabel>
              <input
                type="number"
                name="rating"
                min={0}
                max={5}
                step={0.1}
                placeholder="0–5, optional"
                value={form.rating}
                aria-invalid={ratingInvalid}
                onChange={(e) => updateField('rating', e.target.value)}
              />
            </div>

            <div className="modal__field">
              <FieldLabel required>Price</FieldLabel>
              <div
                className={`modal__input-prefix${priceInvalid ? ' modal__input-prefix--invalid' : ''}`}
              >
                <span className="modal__input-prefix-symbol" aria-hidden="true">
                  {PRICE_PREFIX}
                </span>
                <input
                  type="number"
                  name="price"
                  min={0}
                  step={0.01}
                  placeholder="12.99"
                  value={form.price}
                  aria-invalid={priceInvalid}
                  onChange={(e) => updateField('price', e.target.value)}
                />
              </div>
            </div>
          </div>

          {error ? <p className="modal__error">{error}</p> : null}

          <div className="modal__actions">
            <button
              type="button"
              className="modal__button modal__button--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal__button modal__button--primary"
              disabled={submitting}
            >
              {submitting
                ? isEdit
                  ? 'Saving…'
                  : 'Creating…'
                : isEdit
                  ? 'Save'
                  : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
