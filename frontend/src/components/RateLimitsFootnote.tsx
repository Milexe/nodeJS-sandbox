import { useState } from 'react'
import { RATE_LIMIT_RULES, RATE_LIMITS_FOOTNOTE } from '../config/rateLimits'
import InfoDialog from './InfoDialog'

export default function RateLimitsFootnote() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <p className="drinks-page__footnote">
        <button
          type="button"
          className="drinks-page__footnote-link"
          onClick={() => setOpen(true)}
        >
          Rate limits
        </button>
        <span className="drinks-page__footnote-text">
          {' '}
          apply to API requests on this demo.
        </span>
      </p>

      <InfoDialog
        open={open}
        title="API rate limits"
        onClose={() => setOpen(false)}
      >
        <p className="modal__message">{RATE_LIMITS_FOOTNOTE}</p>

        <ul className="rate-limits-list">
          {RATE_LIMIT_RULES.map((rule) => (
            <li key={rule.id} className="rate-limits-list__item">
              <strong className="rate-limits-list__label">{rule.label}</strong>
              <span className="rate-limits-list__quota">
                {rule.limit} requests per {rule.windowLabel}
              </span>
              <span className="rate-limits-list__detail">{rule.detail}</span>
              {rule.demoHint ? (
                <p className="rate-limits-list__hint">
                  <span className="rate-limits-list__hint-label">Hint:</span>
                  <span className="rate-limits-list__hint-text">
                    {rule.demoHint}
                  </span>
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="rate-limits-list__note">
          Limits are tracked per client IP. <code>/health</code> is excluded.
          Fast catalog refreshes or background polling may hit the read limit
          during testing.
        </p>
      </InfoDialog>
    </>
  )
}
