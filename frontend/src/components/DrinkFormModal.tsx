import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { saveDrink } from '../api/drinks'
import { apiUrl } from '../api'
import type { Drink } from '../types/drink'
import {
  drinkToFormValues,
  isAbvInvalid,
  isPriceInvalid,
  isRatingInvalid,
  isTitleInvalid,
  validateDrinkForm,
  type DrinkFormValues,
} from '../utils/drinkFormValidation'
import { PRICE_PREFIX } from '../utils/formatPrice'
import {
  DEFAULT_DRINK_IMAGE,
  DRINK_IMAGE_ACCEPT,
  handleDrinkImageError,
  resolveDrinkImageSrc,
  validateDrinkImageFile,
} from '../utils/drinkImage'

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

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"
      />
    </svg>
  )
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
  if (!open) {
    return null
  }

  return (
    <DrinkFormModalContent
      key={`${mode}-${drink?.id ?? 'create'}`}
      mode={mode}
      drink={drink}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

type DrinkFormModalContentProps = Omit<DrinkFormModalProps, 'open'>

function DrinkFormModalContent({
  mode,
  drink,
  onClose,
  onSuccess,
}: DrinkFormModalContentProps) {
  const titleId = useId()
  const overlayPressed = useRef(false)
  const [form, setForm] = useState(() =>
    mode === 'edit' && drink ? drinkToFormValues(drink) : emptyForm,
  )
  const [touched, setTouched] = useState(emptyTouched)
  const [titleCheckResult, setTitleCheckResult] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewSrc, setPreviewSrc] = useState(() =>
    mode === 'edit' && drink
      ? resolveDrinkImageSrc(drink.imageUrl)
      : DEFAULT_DRINK_IMAGE,
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const previewObjectUrl = useRef<string | null>(null)

  const titleTaken = form.title.trim() ? titleCheckResult : false

  const titleInvalid = isTitleInvalid(form.title, touched.title, titleTaken)
  const abvInvalid = isAbvInvalid(form.abv, touched.abv)
  const ratingInvalid = isRatingInvalid(form.rating, touched.rating)
  const priceInvalid = isPriceInvalid(form.price, touched.price)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current)
      }
    }
  }, [])

  useEffect(() => {
    const title = form.title.trim()
    if (!title) {
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
        setTitleCheckResult(taken)
      } catch {
        setTitleCheckResult(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [form.title, mode, drink?.id])

  function updateField(field: keyof DrinkFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function handleImageChange(file: File | undefined) {
    if (!file) {
      return
    }

    const validationError = validateDrinkImageFile(file)
    if (validationError) {
      setImageError(validationError)
      return
    }

    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current)
    }

    const objectUrl = URL.createObjectURL(file)
    previewObjectUrl.current = objectUrl
    setImageFile(file)
    setRemoveImage(false)
    setImageError(null)
    setPreviewSrc(objectUrl)
  }

  function handleRemoveImage() {
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current)
      previewObjectUrl.current = null
    }

    setImageFile(null)
    setRemoveImage(true)
    setImageError(null)
    setPreviewSrc(DEFAULT_DRINK_IMAGE)
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

    if (imageError) {
      setError(imageError)
      return
    }

    setSubmitting(true)
    try {
      await saveDrink({
        mode,
        form,
        drinkId: drink?.id,
        imageFile,
        removeImage: mode === 'edit' ? removeImage : false,
      })

      onSuccess()
      onClose()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save drink'
      if (message.includes('Title already exists')) {
        setTitleCheckResult(true)
      }
      setError(message)
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

          <div className="modal__field modal__image-field">
            <FieldLabel>Image</FieldLabel>
            <div className="drink-image-picker">
              <div className="drink-image-picker__frame">
                <img
                  className="drink-image-picker__preview"
                  src={previewSrc}
                  alt=""
                  onError={handleDrinkImageError}
                />
              </div>
              <div className="drink-image-picker__body">
                <p className="drink-image-picker__lead">Optional cover image</p>
                <div className="drink-image-picker__actions">
                  <label className="drink-image-picker__upload">
                    <UploadIcon />
                    <span>
                      {imageFile ||
                      (mode === 'edit' && drink?.imageUrl && !removeImage)
                        ? 'Change image'
                        : 'Upload image'}
                    </span>
                    <input
                      type="file"
                      accept={DRINK_IMAGE_ACCEPT}
                      className="drink-image-picker__input"
                      onChange={(e) => handleImageChange(e.target.files?.[0])}
                    />
                  </label>
                  {imageFile ||
                  (mode === 'edit' && drink?.imageUrl && !removeImage) ? (
                    <button
                      type="button"
                      className="drink-image-picker__remove"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {imageError ? (
                  <p className="modal__error drink-image-picker__error">
                    {imageError}
                  </p>
                ) : (
                  <p className="drink-image-picker__hint">
                    JPEG, PNG, or WebP · up to 2 MB
                  </p>
                )}
              </div>
            </div>
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
