import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiUrl } from '../api'
import type { Drink } from '../types/drink'

export default function DrinkDetailPage() {
  const { id } = useParams()
  const [drink, setDrink] = useState<Drink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Missing drink id')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(apiUrl(`/drink/${id}`))
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data: Drink | null = await res.json()
        if (!cancelled) {
          setDrink(data)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load drink')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

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
    <article className="drink-detail">
      <h2>{drink.title}</h2>
      <dl>
        <dt>Description</dt>
        <dd>{drink.description}</dd>
        <dt>ABV</dt>
        <dd>{drink.abv}%</dd>
        <dt>Rating</dt>
        <dd>{drink.rating}</dd>
        <dt>Price</dt>
        <dd>{drink.price}</dd>
      </dl>
      <Link to="/drinks">← Back to list</Link>
    </article>
  )
}
