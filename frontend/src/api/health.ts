import { apiUrl } from '../api'
import type { HealthCheckResult, HealthResponse } from '../types/health'

function isHealthResponse(value: unknown): value is HealthResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    (value as HealthResponse).status === 'ok'
  )
}

export function getHealthEndpointUrl(): string {
  return apiUrl('/health')
}

export async function fetchHealth(): Promise<HealthCheckResult> {
  const checkedAt = new Date().toISOString()
  const started = performance.now()

  try {
    const res = await fetch(getHealthEndpointUrl())
    const latencyMs = Math.round(performance.now() - started)

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status} ${res.statusText}`,
        checkedAt,
        latencyMs,
      }
    }

    const data: unknown = await res.json()
    if (!isHealthResponse(data)) {
      return {
        ok: false,
        error: 'Unexpected response body',
        checkedAt,
        latencyMs,
      }
    }

    return { ok: true, data, checkedAt, latencyMs }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
      checkedAt,
      latencyMs: Math.round(performance.now() - started),
    }
  }
}
