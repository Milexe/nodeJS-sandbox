import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../api'
import type { Drink } from '../types/drink'

export default function DrinksListPage() {
  const navigate = useNavigate()
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(apiUrl('/drink'))
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data: Drink[] = await res.json()
        if (!cancelled) {
          setDrinks(data)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load drinks')
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
  }, [])

  if (loading) {
    return <p className="status">Loading…</p>
  }

  if (error) {
    return <p className="status error">Error: {error}</p>
  }

  if (drinks.length === 0) {
    return <p className="status">No drinks found.</p>
  }

  return (
    <table className="drinks-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>ABV %</th>
          <th>Rating</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        {drinks.map((drink) => (
          <tr
            key={drink.id}
            className="drinks-row"
            onClick={() => navigate(`/drinks/${drink.id}`)}
          >
            <td>{drink.title}</td>
            <td>{drink.abv}</td>
            <td>{drink.rating}</td>
            <td>{drink.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
