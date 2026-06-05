import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDrink } from '../api/drinks'
import ConfirmDialog from '../components/ConfirmDialog'
import DrinkFormModal from '../components/DrinkFormModal'
import { apiUrl } from '../api'
import type { Drink } from '../types/drink'
import { formatDecimal, formatOptionalDecimal } from '../utils/decimalInput'
import { formatPrice } from '../utils/formatPrice'

export default function DrinkDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drink, setDrink] = useState<Drink | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadDrink = useCallback(async () => {
    if (!id) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/drink/${id}`))
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data: Drink | null = await res.json()
      setDrink(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load drink')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDrink()
  }, [loadDrink])

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
        onSuccess={loadDrink}
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
