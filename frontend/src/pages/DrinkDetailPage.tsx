import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDrink } from '../api/drinks'
import ConfirmDialog from '../components/ConfirmDialog'
import DrinkFormModal from '../components/DrinkFormModal'
import { apiUrl } from '../api'
import type { Drink } from '../types/drink'
import { formatDecimal, formatOptionalDecimal } from '../utils/decimalInput'
import { formatPrice } from '../utils/formatPrice'
import {
  handleDrinkImageError,
  resolveDrinkImageSrc,
} from '../utils/drinkImage'

export default function DrinkDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drink, setDrink] = useState<Drink | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const loading = id !== loadedId

  const fetchDrink = useCallback(async (): Promise<Drink | null> => {
    if (!id) {
      throw new Error('Missing drink id')
    }

    const res = await fetch(apiUrl(`/drink/${id}`))
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json() as Promise<Drink | null>
  }, [id])

  useEffect(() => {
    if (!id) {
      return
    }

    let cancelled = false

    void fetchDrink()
      .then((data) => {
        if (cancelled) {
          return
        }
        setDrink(data)
        setError(null)
        setLoadedId(id)
      })
      .catch((e) => {
        if (cancelled) {
          return
        }
        setError(e instanceof Error ? e.message : 'Failed to load drink')
        setDrink(null)
        setLoadedId(id)
      })

    return () => {
      cancelled = true
    }
  }, [fetchDrink, id])

  function reloadDrink() {
    if (!id) {
      return
    }

    setLoadedId(null)
    void fetchDrink()
      .then((data) => {
        setDrink(data)
        setError(null)
        setLoadedId(id)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load drink')
        setDrink(null)
        setLoadedId(id)
      })
  }

  async function handleConfirmDelete() {
    if (!drink) {
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDrink(drink.id)
      navigate('/drinks')
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : 'Failed to delete drink',
      )
    } finally {
      setDeleting(false)
    }
  }

  if (!id) {
    return (
      <>
        <p className="status error">Error: Missing drink id</p>
        <Link to="/drinks">← Back to list</Link>
      </>
    )
  }

  if (loading) {
    return <p className="status">Loading…</p>
  }

  if (error) {
    return (
      <>
        <p className="status error">Error: {error}</p>
        <Link to="/drinks">← Back to list</Link>
      </>
    )
  }

  if (!drink) {
    return (
      <>
        <p className="status">Drink not found.</p>
        <Link to="/drinks">← Back to list</Link>
      </>
    )
  }

  return (
    <>
      <div className="drinks-page__toolbar">
        <h2 className="drinks-page__title">{drink.title}</h2>
        <div className="drinks-page__actions">
          <button
            type="button"
            className="drinks-page__btn"
            onClick={() => setEditOpen(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="drinks-page__btn drinks-page__btn--danger"
            onClick={() => {
              setDeleteError(null)
              setDeleteOpen(true)
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <article className="drink-detail">
        <img
          className="drink-detail__image"
          src={resolveDrinkImageSrc(drink.imageUrl)}
          alt=""
          onError={handleDrinkImageError}
        />
        <dl>
          <dt>Description</dt>
          <dd>{drink.description || '—'}</dd>
          <dt>ABV</dt>
          <dd>{formatDecimal(drink.abv, 1)}%</dd>
          <dt>Rating</dt>
          <dd>{formatOptionalDecimal(drink.rating, 1)}</dd>
          <dt>Price</dt>
          <dd>{formatPrice(drink.price)}</dd>
        </dl>
        <Link to="/drinks">← Back to list</Link>
      </article>

      <DrinkFormModal
        mode="edit"
        open={editOpen}
        drink={drink}
        onClose={() => setEditOpen(false)}
        onSuccess={reloadDrink}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete drink"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false)
            setDeleteError(null)
          }
        }}
        onConfirm={handleConfirmDelete}
      >
        <p className="modal__message">
          Delete <strong>{drink.title}</strong>? This action cannot be undone.
        </p>
        {deleteError ? <p className="modal__error">{deleteError}</p> : null}
      </ConfirmDialog>
    </>
  )
}
