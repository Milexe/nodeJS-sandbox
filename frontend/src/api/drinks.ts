import { apiUrl } from '../api'

export async function deleteDrink(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/drink/${id}`), { method: 'DELETE' })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
}
