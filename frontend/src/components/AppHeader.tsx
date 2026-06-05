import { Link, useLocation } from 'react-router-dom'
import { findActiveDemo } from '../config/demos'
import HealthStatus from './HealthStatus'
import ThemeToggle from './ThemeToggle'

const PROJECT_TITLE = 'NodeJS Sandbox'
const PROJECT_AUTHOR = 'Roman'

const HOSTING_NOTICE =
  'Hosted on free tiers — Vercel (frontend), Render (API), Neon (PostgreSQL). The first request after idle may take up to a minute.'

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      />
    </svg>
  )
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const activeDemo = findActiveDemo(pathname)
  const onHome = pathname === '/'
  const headerTitle = activeDemo?.title ?? PROJECT_TITLE

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__bar">
          <div className="app-header__brand">
            <Link
              to="/"
              className="app-header__title"
              aria-current={onHome ? 'page' : undefined}
            >
              {headerTitle}
            </Link>
            <span className="app-header__author">by {PROJECT_AUTHOR}</span>
          </div>

          <div className="app-header__actions">
            {activeDemo ? (
              <Link to="/" className="app-header__nav-link">
                All demos
              </Link>
            ) : null}
            <HealthStatus />
            <ThemeToggle />
          </div>
        </div>

        <p className="app-header__notice">
          <span className="app-header__notice-icon">
            <InfoIcon />
          </span>
          <span>{HOSTING_NOTICE}</span>
        </p>
      </div>
    </header>
  )
}
