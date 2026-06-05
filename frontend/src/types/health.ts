export type HealthResponse = {
  status: 'ok'
}

export type HealthCheckResult =
  | {
      ok: true
      data: HealthResponse
      checkedAt: string
      latencyMs: number
    }
  | {
      ok: false
      error: string
      checkedAt: string
      latencyMs: number | null
    }
