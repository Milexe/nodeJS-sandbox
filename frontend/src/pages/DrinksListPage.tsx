import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDrink } from '../api/drinks'
import ConfirmDialog from '../components/ConfirmDialog'
import DrinkFormModal from '../components/DrinkFormModal'
import DrinkTableActions from '../components/DrinkTableActions'
import { apiUrl } from '../api'
import type { Drink } from '../types/drink'
import { formatDecimal, formatOptionalDecimal } from '../utils/decimalInput'
import { formatPrice } from '../utils/formatPrice'
import {
  handleDrinkImageError,
  resolveDrinkImageSrc,
} from '../utils/drinkImage'

const POLL_INTERVAL_MS = 15_000

type LoadDrinksOptions = {
  silent?: boolean
}

export default function DrinksListPage() {
  const navigate = useNavigate()
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null)
  const [deletingDrink, setDeletingDrink] = useState<Drink | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadDrinks = useCallback(async ({ silent = false }: LoadDrinksOptions = {}) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const res = await fetch(apiUrl('/drink'))
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data: Drink[] = await res.json()
      setDrinks(data)
      if (silent) {
        setError(null)
      }
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Failed to load drinks')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadDrinks()
  }, [loadDrinks])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDrinks({ silent: true })
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [loadDrinks])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void loadDrinks({ silent: true })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadDrinks])

  async function handleConfirmDelete() {
    if (!deletingDrink) {
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDrink(deletingDrink.id)
      setDeletingDrink(null)
      await loadDrinks({ silent: true })
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : 'Failed to delete drink',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="drinks-page__toolbar">
        <h2 className="drinks-page__title">Drinks catalog</h2>
        <button
          type="button"
          className="drinks-page__btn"
          onClick={() => setCreateOpen(true)}
        >
          Add drink
        </button>
      </div>

      {loading ? <p className="status">Loading…</p> : null}

      {!loading && error ? (
        <p className="status error">Error: {error}</p>
      ) : null}

      {!loading && !error && drinks.length === 0 ? (
        <p className="status">No drinks yet. Add the first one with POST.</p>
      ) : null}

      {!loading && !error && drinks.length > 0 ? (
        <table className="drinks-table">
          <thead>
            <tr>
              <th className="drinks-table__col-image" aria-label="Image" />
              <th>Title</th>
              <th>ABV %</th>
              <th>Rating</th>
              <th>Price</th>
              <th className="drinks-table__col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drinks.map((drink) => (
              <tr
                key={drink.id}
                className="drinks-row"
                onClick={() => navigate(`/drinks/${drink.id}`)}
              >
                <td className="drinks-table__col-image">
                  <img
                    className="drinks-table__thumb"
                    src={resolveDrinkImageSrc(drink.imageUrl)}
                    alt=""
                    onError={handleDrinkImageError}
                  />
                </td>
                <td>{drink.title}</td>
                <td>{formatDecimal(drink.abv, 1)}</td>
                <td>{formatOptionalDecimal(drink.rating, 1)}</td>
                <td>{formatPrice(drink.price)}</td>
                <td
                  className="drinks-table__col-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="drinks-table__actions">
                    <DrinkTableActions
                      onEdit={() => setEditingDrink(drink)}
                      onDelete={() => {
                        setDeleteError(null)
                        setDeletingDrink(drink)
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <DrinkFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => loadDrinks({ silent: true })}
      />

      <DrinkFormModal
        mode="edit"
        open={editingDrink !== null}
        drink={editingDrink ?? undefined}
        onClose={() => setEditingDrink(null)}
        onSuccess={() => loadDrinks({ silent: true })}
      />

      <ConfirmDialog
        open={deletingDrink !== null}
        title="Delete drink"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeletingDrink(null)
            setDeleteError(null)
          }
        }}
        onConfirm={handleConfirmDelete}
      >
        <p className="modal__message">
          Delete <strong>{deletingDrink?.title}</strong>? This action cannot be
          undone.
        </p>
        {deleteError ? <p className="modal__error">{deleteError}</p> : null}
      </ConfirmDialog>
    </>
  )
}
