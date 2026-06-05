import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { fetchHealth, getHealthEndpointUrl } from '../api/health'
import type { HealthCheckResult } from '../types/health'

type HealthIndicatorState = 'loading' | 'ok' | 'error'

const REFRESH_COOLDOWN_MS = 2_000

function formatCheckedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function toIndicatorState(result: HealthCheckResult | null): HealthIndicatorState {
  if (!result) {
    return 'loading'
  }
  return result.ok ? 'ok' : 'error'
}

export default function HealthStatus() {
  const titleId = useId()
  const overlayPressed = useRef(false)
  const refreshCooldownTimerRef = useRef<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshCooldown, setRefreshCooldown] = useState(false)
  const [result, setResult] = useState<HealthCheckResult | null>(null)
  const indicatorState = toIndicatorState(result)

  const runCheck = useCallback(async () => {
    const next = await fetchHealth()
    setResult(next)
    return next
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await runCheck()
    setRefreshing(false)
    setRefreshCooldown(true)
    if (refreshCooldownTimerRef.current !== null) {
      window.clearTimeout(refreshCooldownTimerRef.current)
    }
    refreshCooldownTimerRef.current = window.setTimeout(() => {
      setRefreshCooldown(false)
      refreshCooldownTimerRef.current = null
    }, REFRESH_COOLDOWN_MS)
  }, [runCheck])

  useEffect(() => {
    void runCheck()
  }, [runCheck])

  useEffect(() => {
    return () => {
      if (refreshCooldownTimerRef.current !== null) {
        window.clearTimeout(refreshCooldownTimerRef.current)
      }
    }
  }, [])

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    overlayPressed.current = event.target === event.currentTarget
  }

  function handleOverlayMouseUp(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && overlayPressed.current) {
      setDialogOpen(false)
    }
    overlayPressed.current = false
  }

  const statusLabel =
    indicatorState === 'loading'
      ? 'Checking API…'
      : indicatorState === 'ok'
        ? 'API healthy'
        : 'API unreachable'

  const statusText =
    indicatorState === 'loading'
      ? 'Checking…'
      : indicatorState === 'ok'
        ? 'Healthy'
        : 'Unavailable'

  return (
    <>
      <button
        type="button"
        className={`health-status health-status--${indicatorState}`}
        onClick={() => setDialogOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={dialogOpen}
        aria-label={`API health: ${statusLabel}. Open details.`}
        title={statusLabel}
      >
        <span className="health-status__dot" aria-hidden="true" />
        <span className="health-status__label">API</span>
      </button>

      {dialogOpen
        ? createPortal(
            <div
              className="modal-overlay"
              role="presentation"
              onMouseDown={handleOverlayMouseDown}
              onMouseUp={handleOverlayMouseUp}
            >
              <div
                className="modal modal--info modal--health health-status-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <div className="modal__header">
                  <h3 id={titleId} className="modal__title">
                    API health
                  </h3>
                  <button
                    type="button"
                    className="modal__close"
                    onClick={() => setDialogOpen(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="modal__body health-status-dialog__body">
                  <p className="health-status-dialog__intro">
                    Liveness probe for the NestJS API. A successful check means the server
                    process is running — it does not verify database connectivity.
                  </p>

                  <div className="health-status-dialog__facts">
                    <div className="health-status-dialog__fact">
                      <span className="health-status-dialog__fact-label">Endpoint</span>
                      <code className="health-status-dialog__fact-value">
                        GET {getHealthEndpointUrl()}
                      </code>
                    </div>
                  </div>

                  <div className="health-status-dialog__status">
                    <span
                      className={`health-status-dialog__badge health-status-dialog__badge--${indicatorState}`}
                    >
                      {statusText}
                    </span>
                    {result?.latencyMs != null ? (
                      <span className="health-status-dialog__meta">{result.latencyMs} ms</span>
                    ) : null}
                    {result ? (
                      <span className="health-status-dialog__meta">
                        checked {formatCheckedAt(result.checkedAt)}
                      </span>
                    ) : null}
                  </div>

                  {result ? (
                    <div
                      className={`health-status-dialog__result${
                        result.ok ? '' : ' health-status-dialog__result--error'
                      }`}
                    >
                      {result.ok ? (
                        <code>{JSON.stringify(result.data)}</code>
                      ) : (
                        result.error
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="modal__actions modal__actions--footer">
                  <button
                    type="button"
                    className="modal__button modal__button--secondary"
                    onClick={() => setDialogOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="modal__button modal__button--primary"
                    disabled={refreshing || refreshCooldown}
                    onClick={() => void handleRefresh()}
                  >
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
